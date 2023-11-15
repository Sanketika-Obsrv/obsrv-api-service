export interface ExtractionConfig {
  is_batch_event: boolean;
  extraction_key: string;
  dedup_config: DedupConfig;
}

export interface DedupConfig {
  drop_duplicates: boolean;
  dedup_key: string;
  dedup_period: number;
}

export interface ValidationConfig {
  validate: boolean;
  mode: string;
}

export interface DenormConfig {
  redis_db_host: string;
  redis_db_port: string;
  denorm_fields: DenormFieldConfig;
}

export interface DenormFieldConfig {
  denorm_key: string;
  redis_db: number;
  denorm_out_field: string;
}

export interface RouterConfig {
  topic: string;
}

export interface DatasetConfig {
  data_key: string;
  timestamp_key: string;
  exclude_fields: string[];
  entry_topic: string;
  redis_db_host: string;
  redis_db_port: number;
  redis_db: number;
  index_data: boolean;
}

