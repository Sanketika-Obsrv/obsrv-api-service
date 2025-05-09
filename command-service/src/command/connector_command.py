from dacite import from_dict
import json
import logging
import subprocess

from command.icommand import ICommand
from config import Config
from model.data_models import Action, ActionResponse, CommandPayload, DatasetStatusType
from model.db_models import ConnectorInstance
from service.db_service import DatabaseService
import time
from random import choice
from string import ascii_lowercase


class ConnectorCommand(ICommand):
    def __init__(self, config: Config, db_service: DatabaseService):
        self.config = config
        self.db_service = db_service
        self.logger = logging.getLogger()
        self.connector_job_config = self.config.find("connector_jobs")

    def execute(self, command_payload: CommandPayload, action: Action):
        result = None
        active_connectors = self._get_connector_details(
            dataset_id=command_payload.dataset_id
        )
        is_masterdata = self._get_masterdata_details(
            dataset_id=command_payload.dataset_id
        )

        print(f"Active connectors: {active_connectors}")
        print(f"Is masterdata: {is_masterdata}")

        if action == Action.DEPLOY_CONNECTORS.name:
            result = self._deploy_connectors(
                command_payload.dataset_id, active_connectors, is_masterdata
            )

        return result

    def _deploy_connectors(self, dataset_id, active_connectors, is_masterdata):
        result = None
        self._stop_connector_jobs(is_masterdata, dataset_id)
        result = self._install_jobs(dataset_id, active_connectors, is_masterdata)

        return result

    def _stop_connector_jobs(self, is_masterdata, dataset_id):
        # managed_releases = []
        # connector_jar_config = self.config.find("connector_job")
        # masterdata_jar_config = self.config.find("masterdata_job")
        # for connector_type in connector_jar_config:
        #     for release in connector_jar_config[connector_type]:
        #         managed_releases.append(release["release_name"])
        # if is_masterdata:
        #     for release in masterdata_jar_config:
        #         managed_releases.append(release["release_name"])

        ## Clear all spark cronjobs for the dataset
        spark_namespace = self.connector_job_config["spark"]["namespace"]
        deployed_cron_jobs_cmd = [
            "kubectl", "get", "cronjobs", "-n", spark_namespace,
            "--selector", f"app.kubernetes.io/dataset={dataset_id}",
            "-o", "jsonpath=\"{.items[*].metadata.name}\""
        ]

        deployed_cron_jobs_result = subprocess.run(
            deployed_cron_jobs_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        if deployed_cron_jobs_result.returncode == 0 and len(deployed_cron_jobs_result.stdout.decode().replace("\"", "").splitlines()):
            jobs = deployed_cron_jobs_result.stdout.decode().replace("\"", "").splitlines()[0].split()
            for job in jobs:
                print(f"Uninstalling job {job} related to dataset'{dataset_id}'...")
                helm_uninstall_cmd = [
                    "helm",
                    "uninstall",
                    job,
                    "--namespace",
                    spark_namespace,
                ]
                print("Uninstall command: ", " ".join(helm_uninstall_cmd))
                helm_uninstall_result = subprocess.run(
                    helm_uninstall_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                if helm_uninstall_result.returncode == 0:
                    print(f"Successfully uninstalled job '{job}'...")
                else:
                    print(f"Error uninstalling job '{job}': {helm_uninstall_result.stderr.decode()}")

        ## Clear all flink connectors that are not active
        flink_namespace = self.connector_job_config["flink"]["namespace"]
        registered_connectors = self._get_registered_connectors(runtime="flink")
        print("Registered flink connectors: ", registered_connectors)
        for connector in registered_connectors:
            if connector[1] == 0:
                ### Uninstall the helm chart
                helm_uninstall_cmd = [
                    "helm",
                    "uninstall",
                    connector[0].replace(".", "-").replace("_", "-"),
                    "--namespace",
                    flink_namespace,
                ]

                print("Uninstall command: ", " ".join(helm_uninstall_cmd))
                helm_uninstall_result = subprocess.run(
                    helm_uninstall_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                if helm_uninstall_result.returncode == 0:
                    print(f"Successfully uninstalled deployment '{connector[0]}'...")
                else:
                    print(f"Error uninstalling deployment '{connector}': {helm_uninstall_result.stderr.decode()}")

    def _install_jobs(self, dataset_id, active_connectors, is_masterdata):
        result = None
        for connector in active_connectors:
            print("Installing connector {0}".format(connector))

            if connector.connector_runtime == "spark":
                result = self._perform_spark_install(dataset_id, connector)
            elif connector.connector_runtime == "flink":
                result = self._perform_flink_install(dataset_id, connector)
            else:
                print(
                    f"Connector {connector.connector_id} is not supported for deployment"
                )
                break

        if result is None:
            result = ActionResponse(status="OK", status_code=200)

        # if is_masterdata:
        #     print("Installing masterdata job")
        #     masterdata_jar_config = self.config.find("masterdata_job")
        #     for release in masterdata_jar_config:
        #         result = self._perform_install(release)
        return result

    def _perform_flink_install(self, dataset_id, connector_instance):
        err = None
        result = None
        release_name = connector_instance.connector_id
        runtime = connector_instance.connector_runtime
        namespace = self.connector_job_config["flink"]["namespace"]
        job_name = release_name.replace(".", "-")
        helm_ls_cmd = ["helm", "ls", "--namespace", namespace]

        helm_ls_result = subprocess.run(
            helm_ls_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )

        if helm_ls_result.returncode == 0:
            jobs = helm_ls_result.stdout.decode()

            deployment_exists = any(job_name in line for line in jobs.splitlines()[1:])
            if deployment_exists:
                restart_cmd = f"kubectl delete pods --selector app.kubernetes.io/name=flink,app.kubernetes.io/component={job_name}-jobmanager --namespace {namespace} && kubectl delete pods --selector app.kubernetes.io/name=flink,app.kubernetes.io/component={job_name}-taskmanager --namespace {namespace}".format(
                    namespace=namespace, job_name=job_name
                )
                print("Restart command: ", restart_cmd)
                # Run the helm command
                restart_cmd_result = subprocess.run(
                    restart_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    shell=True,
                )
                if restart_cmd_result.returncode == 0:
                    print(f"Job {job_name} restart succeeded...")
                else:
                    err = True
                    print(f"Error restarting pod: {helm_ls_result.stderr.decode()}")
                    return ActionResponse(
                        status="ERROR",
                        status_code=500,
                        error_message="FLINK_HELM_LIST_EXCEPTION",
                    )

                if err is None:
                    result = ActionResponse(status="OK", status_code=200)

                return result
            else:
                if self._get_live_instances(runtime="flink", connector_instance=connector_instance):
                    connector_source = connector_instance.connector_source
                    flink_jobs = dict()
                    flink_jobs[job_name] = {
                        "enabled": "true",
                        "connector_id": connector_instance.connector_id,
                        "source": connector_source.get("source"),
                        "main_program": connector_source.get("main_program")
                    }

                    set_json_value = json.dumps(flink_jobs)
                    nodeSelector = self.config.find("node_selector")
                    security_contexts = self.config.find("container_security_context")
                    pod_security_context = self.config.find("pod_security_context")
                    helm_install_cmd = [
                        "helm",
                        "upgrade",
                        "--install",
                        job_name,
                        f"""{self.config.find("helm_charts_base_dir")}/{self.connector_job_config["flink"]["base_helm_chart"]}""",
                        "--namespace",
                        namespace,
                        "--create-namespace",
                        "--set", "namespace={}".format(namespace),
                        "--set", "connector_id={}".format(connector_instance.connector_id),
                        "--set-json",
                        f"""flink_jobs={set_json_value.replace(" ", "")}""",
                        "--set-json",
                        f"""nodeSelector={json.dumps(nodeSelector)}""",
                        "--set-json",
                        f"""securityContext={json.dumps(security_contexts)}""",
                        "--set-json",
                        f"""podSecurityContext={json.dumps(pod_security_context)}"""
                    ]

                    print("flink connector installation:  ", " ".join(helm_install_cmd))

                    helm_install_result = subprocess.run(
                        helm_install_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
                    )

                    print(helm_install_result)

                    if helm_install_result.returncode == 0:
                        print(f"Job '{job_name}' deployment succeeded...")
                    else:
                        err = True
                        result = ActionResponse(
                            status="ERROR",
                            status_code=500,
                            error_message="FLINK_CONNECTOR_HELM_INSTALLATION_EXCEPTION",
                        )
                        print(
                            f"Error installing job '{job_name}': {helm_install_result.stderr.decode()}"
                        )

                    if err is None:
                        result = ActionResponse(status="OK", status_code=200)

                    return result
        else:
            print(f"Error checking Flink deployments: {helm_ls_result.stderr.decode()}")
            return ActionResponse(
                status="ERROR",
                status_code=500,
                error_message="FLINK_HELM_LIST_EXCEPTION",
            )

    def _perform_spark_install(self, dataset_id, connector_instance):
        err = None
        result = None
        release_name = "{}-{}".format(
            (dataset_id + "_" + connector_instance.connector_id).lower().replace("_", "-")[:54],
            "".join(choice(ascii_lowercase) for i in range(6))
        )
        connector_source = connector_instance.connector_source
        schedule = connector_instance.operations_config["schedule"]

        schedule_configs = {
            "Hourly": "0 * * * *",     # Runs at the start of every hour
            "Weekly": "0 0 * * 0",     # Runs at midnight every Sunday
            "Monthly": "0 0 1 * *",    # Runs at midnight on the 1st day of every month
            "Yearly": "0 0 1 1 *"      # Runs at midnight on January 1st each year
        }

        namespace = self.connector_job_config["spark"]["namespace"]
        nodeSelector = self.config.find("node_selector")
        container_security_context = self.config.find("container_security_context")
        pod_security_context = self.config.find("pod_security_context")

        helm_install_cmd = [
            "helm",
            "upgrade",
            "--install",
            release_name,
            f"""{self.config.find("helm_charts_base_dir")}/{self.connector_job_config["spark"]["base_helm_chart"]}""",
            "--namespace",
            namespace,
            "--create-namespace",
            "--set",
            "technology={}".format(connector_instance.technology),
            "--set",
            "dataset_id={}".format(dataset_id),
            "--set",
            "connector_id={}".format(connector_instance.connector_id),
            "--set",
            "instance_id={}".format(connector_instance.id),
            "--set",
            "connector_source={}".format(connector_source["source"]),
            "--set",
            "main_class={}".format(connector_source["main_class"]),
            "--set",
            "main_file={}".format(connector_source["main_program"]),
            "--set",
            "cronSchedule={}".format(schedule_configs[schedule]),
            "--set-json",
            f"""nodeSelector={json.dumps(nodeSelector)}""",
            "--set-json",
            f"""securityContext={json.dumps(container_security_context)}""",
            "--set-json",
            f"""podSecurityContext={json.dumps(pod_security_context)}"""
        ]

        print("spark connector installation:", " ".join(helm_install_cmd))

        helm_install_result = subprocess.run(
            helm_install_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        if helm_install_result.returncode == 0:
            print(f"Job '{release_name}' update succeeded...")
            result = ActionResponse(status="OK", status_code=200)
        else:
            err = True
            result = ActionResponse(
                status="ERROR",
                status_code=500,
                error_message="SPARK_CRON_HELM_INSTALLATION_EXCEPTION",
            )
            print(f"Error updating job '{release_name}': {helm_install_result.stderr.decode()}")

        if result is None:
            result = ActionResponse(status="ERROR", status_code=500, error_message="UNKNOWN_ERROR")

        return result

    def _get_connector_details(self, dataset_id):
        active_connectors = []
        query = f"""
            SELECT ci.id, ci.connector_id, ci.dataset_id, ci.operations_config, cr.runtime as connector_runtime, cr.source as connector_source, cr.technology, cr.version
            FROM connector_instances ci
            JOIN connector_registry cr on ci.connector_id = cr.id
            WHERE ci.status= %s and ci.dataset_id = %s
        """
        params = (DatasetStatusType.Live.name, dataset_id,)
        records = self.db_service.execute_select_all(sql=query, params=params)

        for record in records:
            active_connectors.append(from_dict(
                data_class=ConnectorInstance, data=record
            ))

        return active_connectors

    def _get_masterdata_details(self, dataset_id):
        is_masterdata = False
        query = f"""
            SELECT *
            FROM datasets
            WHERE status= %s AND dataset_id = %s AND type = 'master'
        """
        params = (DatasetStatusType.Live.name, dataset_id,)
        rows = self.db_service.execute_select_all(sql=query, params=params)
        if len(rows) > 0:
            is_masterdata = True

        return is_masterdata

    def _get_live_instances(self, runtime, connector_instance):
        has_live_instances = False
        query = f"""
                SELECT d.id AS dataset_id, ci.id AS connector_instance_id, ci.connector_id
                FROM connector_instances ci
                JOIN connector_registry cr ON ci.connector_id = cr.id
                JOIN datasets d ON ci.dataset_id = d.id
                WHERE cr.runtime = %s AND ci.status = %s AND ci.connector_id = %s;
            """
        params = (runtime, DatasetStatusType.Live.name, connector_instance.connector_id)
        rows = self.db_service.execute_select_all(sql=query, params=params)
        if len(rows) > 0:
            has_live_instances = True

        return has_live_instances

    def _get_registered_connectors(self, runtime):
        query = f"""
            SELECT cr.id, COUNT(ci.id) AS instance_count
            FROM connector_registry cr
            LEFT JOIN connector_instances ci ON (cr.id = ci.connector_id AND ci.status = %s)
            WHERE cr.runtime = %s
            GROUP BY cr.id
        """
        params = (DatasetStatusType.Live.name, runtime)
        rows = self.db_service.execute_select_all(sql=query, params=params)
        return rows