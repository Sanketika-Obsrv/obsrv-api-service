import { DataSetConfig } from "./ConfigModels";
import { IngestionConfig } from "./IngestionModels";

export interface DataSetSchemaResponse {
    schema: any;
    suggestions: SuggestionsTemplate[];
    configurations: DataSetConfig
}

export interface DataSetSchemeRequest {
    data: Map<string, any>[],
    config: IngestionConfig
}

export interface SuggestionsTemplate {
    property: string;
    suggestions: Suggestion[];
}

export interface Suggestion {
    message: string;
    advice: string;
    resolutionType: string;
    priority: string;
}

export interface ConflictTypes {
    schema: Conflict;
    required: Conflict;
    formats: Conflict;
    absolutePath: string;
}

export interface Conflict {
    property: string,
    type: string,
    conflicts: any,
    resolution: any
}

export interface FlattenSchema {
    property: string 
    dataType: string 
    isRequired: boolean 
    path: string | any;
    absolutePath: string
    formate: string 
}

export interface Occurance {
    property: { [key: string]: number };
    dataType: { [key: string]: number };
    isRequired: { [key: string]: number };
    path: { [key: string]: number };
    absolutePath: { [key: string]: number };
    format: { [key: string]: number };
}
