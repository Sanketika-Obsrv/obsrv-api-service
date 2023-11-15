export interface IDataSourceRules {
  dataset: string;
  queryRules: IQueryTypeRules;
}

export interface ICommonRules {
  maxResultThreshold: number;
  maxResultRowLimit: number;
}

export interface IQueryTypeRules {
  groupBy: IRules;
  scan: IRules;
  topN: IRules;
  timeseries: IRules;
  timeBoundary: IRules;
  search: IRules;
}

export interface IRules {
  maxDateRange?: number;
}

export interface IFilter {
  type?: string;
  fields?: IFilter[];
  field?: IFilter;
  dimension?: string;
  dimensions?: string[];
}

interface ISqlQueryObject {
  query: string;
}

interface ISqlQuery {
  context: object;
  querySql: ISqlQueryObject;
  query: never;
}

interface INativeQueryObj {
  queryType: string;
  dataSource: string;
  dimension?: string;
  dimensions?: string[];
  filter?: IFilter;
  aggregations?: any[];
  postAggregations?: any[];
  granularity: string;
  limit?: number;
  threshold?: number;
  intervals: string[] | string;
}

interface INativeQuery {
  context: object;
  query: INativeQueryObj;
  querySql: never;
}

export interface ILimits {
  common: ICommonRules;
  rules: IDataSourceRules[];
}
export type IQuery = ISqlQuery | INativeQuery;
