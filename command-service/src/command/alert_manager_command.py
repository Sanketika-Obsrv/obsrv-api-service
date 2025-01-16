import json

from command.icommand import ICommand
from config import Config
from model.data_models import Action, ActionResponse, CommandPayload
from service.db_service import DatabaseService
from service.http_service import HttpService
from copy import deepcopy

class AlertManagerService(ICommand):

    def __init__(
        self, config: Config, db_service: DatabaseService, http_service: HttpService
    ):
        self.config = config
        self.db_service = db_service
        self.http_service = http_service
        self.metrics = self.config.find("alert_manager.metrics")
        self.masterdata_metrics = self.config.find("alert_manager.masterdata_metrics")
        self.object_connector_metrics = self.config.find(
            "alert_manager.object_connector_metrics"
        )
        self.jdbc_connector_metrics = self.config.find(
            "alert_manager.jdbc_connector_metrics"
        )
        self.config_service_host = self.config.find("config_service.host")
        self.config_service_port = self.config.find("config_service.port")
        self.base_url = (
            f"http://{self.config_service_host}:{self.config_service_port}/alerts/v1"
        )

    def execute(self, command_payload: CommandPayload, action: Action):
        dataset = self.get_dataset(dataset_id=command_payload.dataset_id)
        if dataset is None:
            return ActionResponse(
                status="ERROR",
                status_code=500,
                error_message=f"Dataset {command_payload.dataset_id} does not exist",
            )

        dataset_source_config = self.get_dataset_source_config(
            dataset_id=command_payload.dataset_id
        )

        for metric in self.metrics:
            for service, metrics in metric.items():
                for metric_info in metrics:
                    self.create_alert_metric(
                        payload=command_payload,
                        service=service,
                        metric=metric_info,
                        dataset_name=dataset["name"],
                    )

        for config in dataset_source_config:
            if config["connector_type"] == "object":
                for metric in self.object_connector_metrics:
                    self.create_alert_metric(
                        payload=command_payload,
                        service=service,
                        metric=metric,
                        dataset_name=dataset["name"],
                    )
            if config["connector_type"] == "jdbc":
                for metric in self.jdbc_connector_metrics:
                    self.create_alert_metric(
                        payload=command_payload,
                        service=service,
                        metric=metric,
                        dataset_name=dataset["name"],
                    )

        if dataset["type"] == "master-dataset":
            for metric_info in self.masterdata_metrics:
                self.create_alert_metric(
                    payload=command_payload,
                    service=service,
                    metric=metric_info,
                    dataset_name=dataset["name"],
                )
        return ActionResponse(status="OK", status_code=200)

    def get_dataset(self, dataset_id: str) -> str:
        query = f"SELECT * FROM datasets WHERE dataset_id= %s"
        params = (dataset_id,)
        result = self.db_service.execute_select_one(sql=query, params=params)
        return result

    def get_dataset_source_config(self, dataset_id: str) -> str:
        query = f"SELECT * FROM dataset_source_config WHERE dataset_id= %s"
        params = (dataset_id,)
        result = self.db_service.execute_select_all(sql=query, params=params)
        return result

    def get_modified_metric(
        self, service: str, metric: dict, payload: CommandPayload
    ) -> dict:
        metric_data = deepcopy(metric)
        if service == "flink":
            substring = f"{payload.dataset_id}"
            modified_substring = substring.replace("-", "_")
            modified_metric = metric_data["metric"].replace("dataset_id", modified_substring)
            metric_data["metric"] = modified_metric
            return metric_data
        else:
            metric_data["metric"] = metric_data["metric"].replace(
                "dataset_id", payload.dataset_id
            )
            return metric_data

    def create_alert_metric(
        self, payload: CommandPayload, service: str, metric: dict, dataset_name: str
    ) -> ActionResponse:
        metric_url = f"{self.base_url}/metric/alias/create"

        metric_data = self.get_modified_metric(
            service=service, metric=metric, payload=payload
        )

        prom_metric = metric_data["metric"]
        metric_alias = f"{metric_data['alias']} ({payload.dataset_id})"
        # Metric api payload
        metric_body = json.dumps(
            {
                "alias": metric_alias,
                "component": "datasets",
                "subComponent": dataset_name,
                "metric": prom_metric,
                "context": {
                    "datasetId": payload.dataset_id,
                },
            }
        )

        response = self.http_service.post(
            url=metric_url,
            body=metric_body,
            headers={"Content-Type": "application/json"},
        )
        if response.status == 200:
            self.create_alert_rule(
                payload={"dataset_name": dataset_name, "metric_data": metric_data}
            )
        else:
            error_data = json.loads(response.body)
            if "params" in error_data and "errmsg" in error_data["params"]:
                error_message = error_data["params"]["errmsg"]
            else:
                error_message = "Failed to publish alerts"            
            return ActionResponse(
                status="ERROR",
                status_code=500,
                error_message=f"Error creating alert metric {metric_alias}: {error_message}",
            )

    def create_alert_rule(self, payload: dict) -> ActionResponse:
        dataset_name = payload["dataset_name"]
        prom_metric = payload["metric_data"]["metric"]
        description = payload["metric_data"]["description"]
        metric_alias = payload["metric_data"]["alias"]
        frequency = payload["metric_data"]["frequency"]
        interval = payload["metric_data"]["interval"]
        operator = payload["metric_data"]["operator"]
        threshold = payload["metric_data"]["threshold"]

        alert_body = json.dumps(
            {
                "name": f"{dataset_name}_{metric_alias}",
                "manager": "grafana",
                "description": description
                or f"Automated alert set up for dataset {dataset_name}",
                "category": "datasets",
                "frequency": frequency,
                "interval": interval,
                "context": {"alertType": "SYSTEM"},
                "labels": {"component": "obsrv"},
                "metadata": {
                    "queryBuilderContext": {
                        "category": "datasets",
                        "subComponent": dataset_name,
                        "metric": prom_metric,
                        "operator": operator,
                        "threshold": [+threshold],
                        "metricAlias": metric_alias,
                    }
                },
                "notification": {"channels": []},
            }
        )

        response = self.http_service.post(
            url=f"{self.base_url}/create",
            body=alert_body,
            headers={"Content-Type": "application/json"},
        )
        result = json.loads(response.body)
        alert_id = result["result"]["id"]
        if response.status == 200:
            self.publish_alert_rule(alert_id=alert_id)
        else:
            error_data = json.loads(response.body)
            if "params" in error_data and "errmsg" in error_data["params"]:
                error_message = error_data["params"]["errmsg"]
            else:
                error_message = "Failed to publish alerts"    
            return ActionResponse(
                status="ERROR",
                status_code=500,
                error_message=f"Error creating alert rule for {dataset_name}: {error_message}",
            )

    def publish_alert_rule(self, alert_id: str) -> ActionResponse:
        endpoint = f"/publish/{alert_id}"
        url = self.base_url + endpoint
        try:
            response = self.http_service.get(url=url)
        except Exception as e:
            return ActionResponse(
                status="ERROR",
                status_code=500,
                message=f"Error publishing alert rule for {alert_id}: {e}",
            )
