import logging

import psycopg2
from urllib3.exceptions import MaxRetryError, NewConnectionError

from command.connector_command import ConnectorCommand
from command.dataset_command import DatasetCommand
from command.db_command import DBCommand
from command.druid_command import DruidCommand
from command.flink_command import FlinkCommand
from command.telemetry_command import TelemetryCommand
from command.kafka_command import KafkaCommand
from config import Config
from model.data_models import Action, ActionResponse, CommandPayload
from service.db_service import DatabaseService
from service.http_service import HttpService
from service.telemetry_service import TelemetryService


class CommandExecutor:

    def __init__(self):
        self.config_obj = Config()
        self.db_service = DatabaseService()
        self.http_service = HttpService()
        self.telemetry_service = TelemetryService()
        self.flink_command = FlinkCommand(
            config=self.config_obj, http_service=self.http_service
        )
        self.connector_command = ConnectorCommand(
            config=self.config_obj, db_service=self.db_service
        )
        self.druid_command = DruidCommand(
            config=self.config_obj,
            db_service=self.db_service,
            http_service=self.http_service,
        )
        self.dataset_command = DatasetCommand(
            db_service=self.db_service,
            telemetry_service=self.telemetry_service,
            http_service=self.http_service,
            config=self.config_obj,
        )
        self.db_command = DBCommand(
            db_service=self.db_service, dataset_command=self.dataset_command
        )
        self.create_kafka_topic = KafkaCommand(
            config=self.config_obj, http_service=self.http_service, dataset_command=self.dataset_command
        )
        self.audit_event_command = TelemetryCommand(
            telemetry_service=self.telemetry_service,
            dataset_command=self.dataset_command,
        )
        self.action_commands = {}
        self.action_commands[Action.START_PIPELINE_JOBS.name] = self.flink_command
        self.action_commands[Action.MAKE_DATASET_LIVE.name] = self.db_command
        self.action_commands[Action.CREATE_KAFKA_TOPIC.name] = self.create_kafka_topic
        self.action_commands[Action.SUBMIT_INGESTION_TASKS.name] = self.druid_command
        self.action_commands[Action.DEPLOY_CONNECTORS.name] = self.connector_command
        self.action_commands[Action.CREATE_AUDIT_EVENT.name] = self.audit_event_command
        self.logger = logging.getLogger()

    def execute_command(self, payload: CommandPayload, ts: int):
        command = payload.command.name
        workflow_commands = self.get_command_workflow(command)
        print(workflow_commands)
        for sub_command in workflow_commands:
            command = self.action_commands[sub_command]
            print(f"Executing command {sub_command}")
            try:
                if sub_command == Action.CREATE_AUDIT_EVENT.name:
                    command.execute(command_payload=payload, action=sub_command, ts=ts)
                else:
                    result = command.execute(
                        command_payload=payload, action=sub_command
                    )
            except (
                ConnectionRefusedError,
                MaxRetryError,
                NewConnectionError,
            ) as conn_error:
                self.logger.exception(
                    "Error when trying to connect to http endpoint...", conn_error
                )
                result = ActionResponse(
                    status="ERROR",
                    status_code=500,
                    error_message="HTTP_CONNECTION_ERROR",
                )
                return result
            except psycopg2.OperationalError as db_conn_error:
                self.logger.exception(
                    "Error when trying to connect to database...", db_conn_error
                )
                result = ActionResponse(
                    status="ERROR",
                    status_code=500,
                    error_message="DATABASE_CONNECTION_ERROR",
                )
                return result
        return result

    def get_command_workflow(self, action: Action):
        return self.config_obj.find("commands.{0}.workflow".format(action))
