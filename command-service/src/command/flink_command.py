from command.icommand import ICommand
from model.data_models import CommandPayload, Action, ActionResponse
from config import Config
from service.http_service import HttpService
import subprocess
import logging

class FlinkCommand(ICommand):

    def __init__(self, config: Config, http_service: HttpService):
        self.config = config
        self.http_service = http_service
        self.logger = logging.getLogger()

    def execute(self, command_payload: CommandPayload, action: Action):
        result = None
        print(f"Invoking RESTART_PIPELINE_JOBS command...")
        result = self._restart_jobs()
        return result

    def _restart_jobs(self):
        return self._install_flink_jobs()
    
    def _install_flink_jobs(self):
        namespace = self.config.find("flink.namespace")
        result = ActionResponse(status="OK", status_code=200)

        flink_jobs = self.config.find("flink.jobs")
        for job in flink_jobs:
            release_name = job["release_name"]
            job_name = job["name"]
            restart_cmd = f"kubectl delete pods --selector app=flink,component={release_name}-jobmanager --namespace {namespace} && kubectl delete pods --selector app=flink,component={release_name}-taskmanager --namespace {namespace}".format(namespace=namespace, release_name=release_name)
            # Run the helm command
            helm_install_result = subprocess.run(restart_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True,)
            
            if helm_install_result.returncode == 0:
                print(f"Job {job_name} re-deployment succeeded...")
            else:
                print(f"Error re-installing job {job_name}: {helm_install_result.stderr.decode()}")
                result = ActionResponse(status="ERROR", status_code=500, error_message="FLINK_HELM_INSTALLATION_EXCEPTION")
        
        return result
