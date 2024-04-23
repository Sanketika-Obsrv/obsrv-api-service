export interface Labels {
    entity: string,
    id: string,
    dataset_id: string | null,
    endpoint: string,
    status: number,
    request_size: number,
    response_size: string | number | string[] | undefined
}

export interface Metric {
    metricLabels: Labels,
    duration: number
}

export enum Entity {
    Data_in = "data-in", Data_out = "data-out", Management = "management"
}