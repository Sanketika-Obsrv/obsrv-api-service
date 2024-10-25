from dataclasses import dataclass
from datetime import datetime
from dataclasses_json import dataclass_json

@dataclass
class DatasetsLive:
    id: str
    dataset_id: str
    data_version: int
    type: str
    name: str
    validation_config: dict
    extraction_config: dict
    dedup_config: dict
    data_schema: dict
    router_config: dict
    dataset_config: dict
    version: int
    status: str
    created_by: str
    created_date: datetime
    tags: list[str] | None = None
    updated_by: str | None = None
    updated_date: datetime | None = None
    denorm_config: dict | None = None
    published_date: datetime | None = None


@dataclass
class DatasetsDraft:
    id: str
    dataset_id: str
    version: int
    type: str
    name: str
    validation_config: dict
    extraction_config: dict
    dedup_config: dict
    data_schema: dict
    router_config: dict
    dataset_config: dict
    status: str
    api_version: str
    entry_topic: str
    created_by: str
    created_date: datetime
    sample_data: dict | None = None
    transformations_config: list[dict] | None = None
    connectors_config: list[dict] | None = None
    denorm_config: dict | None = None
    tags: list[str] | None = None
    updated_by: str | None = None
    updated_date: datetime | None = None
    published_date: datetime | None = None


@dataclass
class DatasourcesDraft:
    id: str
    datasource: str
    dataset_id: str
    ingestion_spec: dict
    type: str
    datasource_ref: str
    status: str
    created_by: str
    created_date: datetime
    retention_period: dict | None = None
    archival_policy: dict | None = None
    purge_policy: dict | None = None
    backup_config: dict | None = None
    metadata: dict | None = None
    updated_by: str | None = None
    updated_date: datetime | None = None
    published_date: datetime | None = None


@dataclass
class DatasetConnectorConfigDraft:
    id: str
    connector_id: str
    connector_config: str | dict
    version: str
    operations_config: dict | None = None
    data_format: str | None = 'json'


@dataclass
class DatasetTransformationsDraft:
    field_key: str
    transformation_function: dict
    mode: str


@dataclass_json
@dataclass
class ConnectorRegsitryv2:
    id: str
    name: str
    type: str
    category: str
    version: str
    description: str
    technology: str
    runtime: str
    licence: str
    owner: str
    iconurl: str
    status: str
    source_url: str
    source: str
    created_by: str
    created_date: str
    updated_date: str
    ui_spec: dict | None = None
    updated_by: str | None = None
    livedate: datetime | None = None


@dataclass
class ConnectorInstance:
    id: str
    connector_id: str
    dataset_id: str
    operations_config: dict
    connector_runtime: str
    connector_source: dict
    technology: str