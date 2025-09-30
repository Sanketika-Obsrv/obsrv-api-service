import json

from command.icommand import ICommand
from config import Config
from model.data_models import Action, ActionResponse, CommandPayload
from service.db_service import DatabaseService
from service.http_service import HttpService


class DruidCommand(ICommand):

    def __init__(
        self, config: Config, db_service: DatabaseService, http_service: HttpService
    ):
        self.config = config
        self.db_service = db_service
        self.http_service = http_service
        router_host = self.config.find("druid.router_host")
        router_post = self.config.find("druid.router_port")
        self.supervisor_endpoint = self.config.find("druid.supervisor_endpoint")
        self.router_url = f"{router_host}:{router_post}/druid"

    def execute(self, command_payload: CommandPayload, action: Action):
        if action == Action.SUBMIT_INGESTION_TASKS.name:
            response = self._submit_ingestion_task(command_payload.dataset_id)
            return response

    def _submit_ingestion_task(self, dataset_id):
        datasources_records = self.db_service.execute_select_all(
            sql=f"SELECT dso.*, dt.type as dataset_type FROM datasources dso, datasets dt WHERE dso.dataset_id = %s AND dso.dataset_id = dt.id",
            params=(dataset_id,)
        )
        if datasources_records is not None:
            print(
                f"Invoking SUBMIT_INGESTION_TASKS command for dataset_id {dataset_id}..."
            )
            task_submitted = 1
            for record in datasources_records:
                if record["type"] == "druid":
                    print(f"Submitting ingestion task for datasource  ...")
                    ingestion_spec = json.dumps(record["ingestion_spec"])
                    response = self.http_service.post(
                        url=f"{self.router_url}/{self.supervisor_endpoint}",
                        body=ingestion_spec,
                        headers={"Content-Type": "application/json"}
                    )
                    if response.status != 200:
                        task_submitted = 0
                        break
            if task_submitted:
                query=f"SELECT id FROM datasets_draft WHERE dataset_id= %s"
                response = self.db_service.execute_select_one(sql=query, params=(dataset_id,))
                self._delete_draft_dataset(dataset_id, response[0])
            return ActionResponse(status="OK", status_code=200)
        else:
            print(
                f"Dataset ID {dataset_id} not found for druid ingestion task submit..."
            )
            return ActionResponse(
                status="ERROR", status_code=404, error_message="DATASET_ID_NOT_FOUND"
            )

    def _delete_draft_dataset(self, dataset_id, draft_dataset_id):

        self.db_service.execute_delete(sql=f"""DELETE from datasources_draft where dataset_id = %s""", params=(draft_dataset_id,))
        print(f"Draft datasources/tables for {dataset_id} are deleted successfully...")

        self.db_service.execute_delete(sql=f"""DELETE from dataset_transformations_draft where dataset_id = %s""", params=(draft_dataset_id,))
        print(f"Draft transformations/tables for {dataset_id} are deleted successfully...")

        self.db_service.execute_delete(sql=f"""DELETE from dataset_source_config_draft where dataset_id = %s""", params=(draft_dataset_id,))
        print(f"Draft source config/tables for {dataset_id} are deleted successfully...")

        self.db_service.execute_delete(sql=f"""DELETE from datasets_draft where id = %s""", params=(draft_dataset_id,))
        print(f"Draft Dataset for {dataset_id} is deleted successfully...")
