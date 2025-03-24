import json
import time

from dacite import from_dict
from command.icommand import ICommand
from config import Config
from model.data_models import CommandPayload, DatasetStatusType
from model.db_models import DatasetsLive
from model.telemetry_models import Audit, Object, Property, Transition
from service.db_service import DatabaseService
from service.http_service import HttpService
from service.telemetry_service import TelemetryService

class DatasetCommand(ICommand):
    def __init__(
        self,
        db_service: DatabaseService,
        telemetry_service: TelemetryService,
        http_service: HttpService,
        config: Config,
    ):
        self.db_service = db_service
        self.telemetry_service = telemetry_service
        self.config = config

    def _get_draft_dataset_record(self, dataset_id):
        query = f"""
            SELECT "type", MAX(version) AS max_version FROM datasets_draft WHERE dataset_id = %s GROUP BY 1
        """
        dataset_record = self.db_service.execute_select_one(sql=query, params=(dataset_id,))
        if dataset_record is not None:
            return dataset_record
        return None
    
    def _get_draft_dataset(self, dataset_id):
        query = f"""
            SELECT * FROM datasets_draft
            WHERE dataset_id = %s AND (status = %s OR status = %s ) AND version = (SELECT MAX(version)
            FROM datasets_draft WHERE dataset_id = %s AND (status = %s OR status = %s ))
            """
        params = (dataset_id, DatasetStatusType.Publish.name, DatasetStatusType.ReadyToPublish.name, 
            dataset_id, DatasetStatusType.Publish.name, DatasetStatusType.ReadyToPublish.name,)
        dataset_record = self.db_service.execute_select_one(sql=query, params=params)
        if dataset_record is not None:
            return dataset_record
        return None

    def _check_for_live_record(self, dataset_id):
        query = f"""
            SELECT * FROM datasets WHERE dataset_id = %s AND status = %s
        """
        params = (dataset_id, DatasetStatusType.Live.name, )
        result = self.db_service.execute_select_one(sql=query, params=params)
        live_dataset = dict()
        if result is not None:
            live_dataset = from_dict(data_class=DatasetsLive, data=result)
            data_version = live_dataset.data_version + 1
            return live_dataset, data_version
        return None, None

    def audit_live_dataset(self, command_payload: CommandPayload, ts: int):
        dataset_id = command_payload.dataset_id
        dataset_record, data_version = self._check_for_live_record(dataset_id)
        if dataset_record is not None:
            object_ = Object(
                dataset_id, dataset_record.type, dataset_record.data_version
            )
            live_dataset_property = Property("dataset:export", dataset_record, "")
            draft_property = Property(
                "draft-dataset:status",
                DatasetStatusType.ReadyToPublish.name,
                DatasetStatusType.Live.name,
            )
            dataset_property = Property(
                "dataset:status",
                DatasetStatusType.Live.name,
                DatasetStatusType.Live.name,
            )
            transition = Transition(duration=int(time.time() - ts))
            edata = Audit(
                props=[
                    draft_property,
                    dataset_property,
                    live_dataset_property,
                ],
                transition=transition,
            )
            self.telemetry_service.audit(object_=object_, edata=edata)
            return True
        else:
            print(
                "Failed to get dataset configurations from export API, dataset_id: ",
                dataset_id,
            )
            return False
