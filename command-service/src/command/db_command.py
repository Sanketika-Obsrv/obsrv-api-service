import json
import time
from datetime import datetime as dt
from dacite import from_dict
from command.dataset_command import DatasetCommand
from command.icommand import ICommand
from model.data_models import Action, ActionResponse, CommandPayload, DatasetStatusType
from model.db_models import DatasetsDraft, DatasetConnectorConfigDraft, DatasourcesDraft, DatasetTransformationsDraft
from service.db_service import DatabaseService

class DBCommand(ICommand):

    def __init__(self, db_service: DatabaseService, dataset_command: DatasetCommand):
        self.db_service = db_service
        self.dataset_command = dataset_command

    def execute(self, command_payload: CommandPayload, action: Action):

        if action == Action.MAKE_DATASET_LIVE.name:
            print(
                f"Invoking MAKE_DATASET_LIVE command for dataset_id {command_payload.dataset_id}..."
            )
            result = self._change_dataset_to_active(command_payload)
            print(f"Result from MAKE_DATASET_ACTIVE {result}...")
            return result
        else:
            return ActionResponse(
                status="ERROR", status_code=404, error_message="INVALID_ACTION"
            )

    def _change_dataset_to_active(self, command_payload: CommandPayload):

        dataset_id = command_payload.dataset_id
        live_dataset, data_version = self.dataset_command._check_for_live_record(
            dataset_id
        )
        if live_dataset is not None:
            self.dataset_command.audit_live_dataset(
                command_payload, int(time.time() * 1000)
            )
        
        draft_dataset_record = self.dataset_command._get_draft_dataset(dataset_id)

        draft_dataset_id = self._insert_dataset_record(
            dataset_id, data_version, live_dataset, draft_dataset_record
        )
        if draft_dataset_id:
            self._insert_datasource_record(dataset_id, draft_dataset_id)
            self._insert_connector_instances(dataset_id, draft_dataset_record)
            self._insert_dataset_transformations(dataset_id, draft_dataset_record)
            return ActionResponse(status="OK", status_code=200)
        else:
            return ActionResponse(
                status="ERROR", status_code=404, error_message="DATASET_ID_NOT_FOUND"
            )

    def _insert_dataset_record(self, dataset_id, data_version, live_dataset, draft_dataset_record):

        if draft_dataset_record is None:
            return None

        draft_dataset = from_dict(data_class = DatasetsDraft, data = draft_dataset_record)
        draft_dataset_id = draft_dataset.id
        current_timestamp = dt.now()
        params = (
            dataset_id,
            dataset_id,
            draft_dataset.type,
            draft_dataset.name,
            json.dumps(draft_dataset.extraction_config).replace("'", "''"),
            json.dumps(draft_dataset.validation_config).replace("'", "''"),
            json.dumps(draft_dataset.dedup_config).replace("'", "''"),
            json.dumps(draft_dataset.denorm_config).replace("'", "''"),
            json.dumps(draft_dataset.data_schema).replace("'", "''"),
            json.dumps(draft_dataset.router_config).replace("'", "''"),
            json.dumps(draft_dataset.dataset_config).replace("'", "''"),
            DatasetStatusType.Live.name,
            json.dumps(draft_dataset.tags).replace("'", "''").replace("[", "{").replace("]", "}") if draft_dataset.tags is not None else json.dumps({}),
            draft_dataset.api_version,
            draft_dataset.version,
            json.dumps(draft_dataset.sample_data).replace("'", "''"),
            draft_dataset.entry_topic,
            draft_dataset.created_by,
            draft_dataset.updated_by,
            current_timestamp,
            current_timestamp,
            current_timestamp,
            
            draft_dataset.name,
            json.dumps(draft_dataset.extraction_config).replace("'", "''"),
            json.dumps(draft_dataset.validation_config).replace("'", "''"),
            json.dumps(draft_dataset.dedup_config).replace("'", "''"),
            json.dumps(draft_dataset.denorm_config).replace("'", "''"),
            json.dumps(draft_dataset.data_schema).replace("'", "''"),
            json.dumps(draft_dataset.router_config).replace("'", "''"),
            json.dumps(draft_dataset.dataset_config).replace("'", "''"),
            json.dumps(draft_dataset.tags).replace("'", "''").replace("[", "{").replace("]", "}") if draft_dataset.tags is not None else json.dumps({}),
            data_version if live_dataset is not None else 1,
            draft_dataset.api_version,
            draft_dataset.version,
            json.dumps(draft_dataset.sample_data).replace("'", "''"),
            draft_dataset.entry_topic,
            draft_dataset.updated_by,
            current_timestamp,
            current_timestamp,
            DatasetStatusType.Live.name,
        )
        insert_query = f"""
            INSERT INTO datasets(id, dataset_id, "type", name, extraction_config, validation_config, dedup_config,
            denorm_config, data_schema, router_config, dataset_config, status, tags, data_version, api_version,
            version, sample_data, entry_topic, created_by, updated_by, created_date, updated_date, published_date)
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                1,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            ON CONFLICT (id) DO UPDATE
            SET name = %s,
            extraction_config = %s,
            validation_config = %s,
            dedup_config = %s,
            denorm_config = %s,
            data_schema = %s,
            router_config = %s,
            dataset_config = %s,
            tags = %s,
            data_version = %s,
            api_version = %s,
            version = %s,
            sample_data = %s,
            entry_topic = %s,
            updated_by = %s,
            updated_date = %s,
            published_date = %s,
            status = %s;
            """
        self.db_service.execute_upsert(insert_query, params)
        print(f"Dataset {dataset_id} record inserted successfully...")
        return draft_dataset_id

    def _insert_datasource_record(self, dataset_id, draft_dataset_id):

        result = {}
        draft_datasource_record = self.db_service.execute_select_all(
            sql=f"SELECT * FROM datasources_draft WHERE dataset_id = %s",
            params=(draft_dataset_id,)
        )
        if draft_datasource_record is None:
            return result
        for record in draft_datasource_record:
            draft_datasource = from_dict(data_class=DatasourcesDraft, data=record)
            current_timestamp = dt.now()
            params = (
                draft_datasource.id,
                draft_datasource.datasource,
                dataset_id,
                draft_datasource.datasource_ref, 
                json.dumps(draft_datasource.ingestion_spec),
                draft_datasource.type,
                json.dumps(draft_datasource.retention_period).replace("'", "''"),
                json.dumps(draft_datasource.archival_policy).replace("'", "''"),
                json.dumps(draft_datasource.purge_policy).replace("'", "''"),
                json.dumps(draft_datasource.backup_config).replace("'", "''"),
                DatasetStatusType.Live.name,
                draft_datasource.created_by,
                draft_datasource.updated_by,
                current_timestamp,
                current_timestamp,
                current_timestamp,
                json.dumps(draft_datasource.metadata).replace("'", "''"),

                draft_datasource.datasource,
                json.dumps(draft_datasource.ingestion_spec),
                draft_datasource.type,
                json.dumps(draft_datasource.retention_period).replace("'", "''"),
                json.dumps(draft_datasource.archival_policy).replace("'", "''"),
                json.dumps(draft_datasource.purge_policy).replace("'", "''"),
                json.dumps(draft_datasource.backup_config).replace("'", "''"),
                draft_datasource.updated_by,
                current_timestamp,
                current_timestamp,
                json.dumps(draft_datasource.metadata).replace("'", "''"), 
                DatasetStatusType.Live.name,
            )
            insert_query = f"""
                INSERT INTO datasources(id, datasource, dataset_id, datasource_ref, ingestion_spec, type, retention_period,
                archival_policy, purge_policy, backup_config, status, created_by, updated_by, created_date,
                updated_date, published_date, metadata)
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
                ON CONFLICT (id) DO UPDATE
                SET datasource_ref = %s,
                ingestion_spec = %s,
                type = %s,
                retention_period = %s,
                archival_policy = %s,
                purge_policy = %s,
                backup_config = %s,
                updated_by = %s,
                updated_date = %s,
                published_date = %s,
                metadata = %s,
                status = %s;
            """
            result = self.db_service.execute_upsert(sql=insert_query, params=params)
            print(
                f"Datasource {draft_datasource.id} record inserted successfully..."
            )
        return result

    def _insert_connector_instances(self, dataset_id, draft_dataset_record):
        emptyJson = {}
        result = {}
        draft_connectors_config_record = draft_dataset_record.get('connectors_config')
        if draft_connectors_config_record is None:
            return result
        
        for record in draft_connectors_config_record:
            connector_config = from_dict(
                data_class = DatasetConnectorConfigDraft, data = record
            )
            current_timestamp = dt.now()
            operations_config =  connector_config.operations_config if connector_config.operations_config is not None else {}
            if connector_config.version == 'v2':
                params = (
                    connector_config.id,
                    dataset_id,
                    connector_config.connector_id,
                    connector_config.connector_config,
                    json.dumps(operations_config).replace("'", "''"),
                    DatasetStatusType.Live.name,
                    json.dumps(emptyJson),
                    json.dumps(emptyJson),
                    draft_dataset_record.get('created_by'),
                    draft_dataset_record.get('updated_by'),
                    current_timestamp,
                    current_timestamp,
                    current_timestamp,

                    connector_config.connector_config,
                    json.dumps(connector_config.operations_config).replace("'", "''"),
                    draft_dataset_record.get('updated_by'),
                    current_timestamp,
                    current_timestamp,
                    DatasetStatusType.Live.name,
                )
                insert_query = f"""
                    INSERT INTO connector_instances(id, dataset_id, connector_id, connector_config, operations_config,
                    status, connector_state, connector_stats, created_by, updated_by, created_date, 
                    updated_date, published_date)
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    ON CONFLICT (id) DO UPDATE
                    SET connector_config = %s,
                    operations_config = %s,
                    updated_by = %s,
                    updated_date = %s,
                    published_date = %s,
                    status = %s;
                """
                result = self.db_service.execute_upsert(sql=insert_query, params=params)
                print(
                    f"Connector[v2] Instance record for [dataset={dataset_id},connector={connector_config.connector_id},id={connector_config.id}] inserted successfully..."
                )
            else:
                params = (
                    connector_config.id,
                    dataset_id,
                    connector_config.connector_id,
                    json.dumps(connector_config.connector_config).replace("'", "''"),
                    DatasetStatusType.Live.name,
                    draft_dataset_record.get('created_by'),
                    draft_dataset_record.get('updated_by'),
                    current_timestamp,
                    current_timestamp,
                    current_timestamp,

                    json.dumps(connector_config.connector_config).replace("'", "''"),
                    draft_dataset_record.get('updated_by'),
                    current_timestamp,
                    current_timestamp,
                    DatasetStatusType.Live.name,
                )
                insert_query = f"""
                    INSERT INTO dataset_source_config(id, dataset_id, connector_type, connector_config,
                    status, created_by, updated_by, created_date, updated_date, published_date)
                    VALUES (
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s,
                        %s
                    )
                    ON CONFLICT (id) DO UPDATE
                    SET connector_config = %s,
                    updated_by = %s,
                    updated_date = %s,
                    published_date = %s,
                    status = %s;
                """
                result = self.db_service.execute_upsert(sql=insert_query, params=params)
                print(
                    f"Connector[v1] record for [dataset={dataset_id},connector={connector_config.connector_id},id={connector_config.id}] inserted successfully..."
                )
            
        return result

    def _insert_dataset_transformations(self, dataset_id, draft_dataset_record):

        draft_dataset_transformations_record = draft_dataset_record.get('transformations_config')
        result = {}
        current_timestamp = dt.now()
        # Delete existing transformations
        self.db_service.execute_delete(sql=f"""DELETE from dataset_transformations where dataset_id = %s""", params=(dataset_id,))
        print(f"Dataset Transformation for {dataset_id} are deleted successfully...")

        if draft_dataset_transformations_record is None:
            return result

        for record in draft_dataset_transformations_record:
            transformation = from_dict(
                data_class=DatasetTransformationsDraft, data=record
            )
            params = (
                dataset_id + '_' + transformation.field_key,
                dataset_id,
                transformation.field_key,
                json.dumps(transformation.transformation_function).replace("'", "''"),
                DatasetStatusType.Live.name,
                transformation.mode,
                draft_dataset_record.get('created_by'),
                draft_dataset_record.get('updated_by'),
                current_timestamp,
                current_timestamp,
                current_timestamp,
            )
            insert_query = f"""
                INSERT INTO dataset_transformations(id, dataset_id, field_key, transformation_function,
                status, mode, created_by, updated_by, created_date, updated_date, published_date)
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                )
            """
            result = self.db_service.execute_upsert(sql=insert_query, params=params)
            print(f"Dataset Transformation {dataset_id + '_' + transformation.field_key} record inserted successfully...")
        return result