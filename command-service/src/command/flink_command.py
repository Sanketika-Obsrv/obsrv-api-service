import logging
import subprocess

from command.icommand import ICommand
from config import Config
from model.data_models import Action, ActionResponse, CommandPayload
from service.http_service import HttpService


class FlinkCommand(ICommand):

    def __init__(self, config: Config, http_service: HttpService):
        self.config = config
        self.http_service = http_service
        self.logger = logging.getLogger()

    def execute(self, command_payload: CommandPayload, action: Action):
        result = None
        if action == Action.START_PIPELINE_JOBS.name:
            print(
                f"Invoking START_PIPELINE_JOBS command for dataset_id {command_payload.dataset_id}..."
            )
            result = self._restart_jobs()
        return result

    def _restart_jobs(self):
        return self._install_flink_jobs()

    def _restart_pods(self, release_name, namespace, job_name):
        # Shell-free (no shell in the distroless runtime): run the two kubectl
        # deletes as separate list-arg subprocess calls instead of one `&&` shell line.
        selectors = [
            f"app=flink,component={release_name}-jobmanager",
            f"app=flink,component={release_name}-taskmanager",
        ]
        for selector in selectors:
            result = subprocess.run(
                ["kubectl", "delete", "pods", "--selector", selector, "--namespace", namespace],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if result.returncode != 0:
                print(
                    f"Error re-installing job {job_name}: {result.stderr.decode()}"
                )
                return False
        print(f"Job {job_name} re-deployment succeeded...")
        return True

    def _install_flink_jobs(self):
        result = ActionResponse(status="OK", status_code=200)
        flink_jobs = self.config.find("flink.jobs")
        namespace = self.config.find("flink.namespace")
        for job in flink_jobs:
            release_name = job["release_name"]
            job_name = job["name"]
            # Restart pods
            status = self._restart_pods(
                release_name=release_name, namespace=namespace, job_name=job_name
            )
            if not status:
                result = ActionResponse(
                    status="ERROR",
                    status_code=500,
                    error_message="FLINK_HELM_INSTALLATION_EXCEPTION",
                )
        return result
