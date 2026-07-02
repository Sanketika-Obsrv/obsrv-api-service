import { Request } from "express";
import { IQueryTypeRules } from "../../types/QueryModels";
import { queryRules } from "./QueryRules";
import * as _ from "lodash";
import moment from "moment";
import { getDatasourceList } from "../../services/DatasourceService";
import logger from "../../logger";
import { druidHttpService, getDatasourceListFromDruid } from "../../connections/druidConnection";
import { apiId } from "./DataOutController";
import { Parser } from "node-sql-parser";
import { obsrvError } from "../../types/ObsrvError";
import { datasetService } from "../../services/DatasetService";
const parser = new Parser();

const momentFormat = "YYYY-MM-DD HH:MM:SS";
let datasourceId: string;
let dataset_id: string;
let requestBody: any;
let msgid: string;
const errCode = {
    notFound: "DATASOURCE_NOT_FOUND",
    invalidDateRange: "DATA_OUT_INVALID_DATE_RANGE"
}

export const validateQuery = async (requestPayload: any, datasetId: string, datasourceRef: string = "") => {
    requestBody = requestPayload;
    datasourceId = datasourceRef;
    dataset_id = datasetId;
    msgid = _.get(requestPayload, "params.msgid");
    const query = requestPayload?.query;
    const isValid = (_.isObject(query)) ? validateNativeQuery(requestPayload) : (_.isString(query)) ? validateSqlQuery(requestPayload) : false;
    const datasetName = getDataSourceFromPayload(requestPayload);
    if (isValid === true) {
        return setDatasourceRef(datasetName, requestPayload);
    }
    return isValid;
}

const validateNativeQuery = (data: any) => {
    setQueryLimits(data)
    const dataSourceLimits: any = getDataSourceLimits(getDataSourceFromPayload(data));
    if (!_.isEmpty(dataSourceLimits) && dataSourceLimits !== undefined) {
        const isValidDate = validateQueryRules(data, dataSourceLimits.queryRules[data.query.queryType as keyof IQueryTypeRules])
        return isValidDate
    }
    return true;
}

const validateSqlQuery = (data: any) => {
    setQueryLimits(data);
    const dataSourceLimits: any = getDataSourceLimits(getDataSourceFromPayload(data));
    if (!_.isEmpty(dataSourceLimits) && dataSourceLimits !== undefined) {
        const isValidDate = validateQueryRules(data, dataSourceLimits.queryRules.scan)
        return isValidDate
    }
    return true;
}

const getLimit = (queryLimit: number, maxRowLimit: number) => {
    return queryLimit > maxRowLimit ? maxRowLimit : queryLimit;
};

const parseSqlQuery = (queryPayload: any) => {
    try {
        const vocabulary: any = parser.astify(queryPayload?.query, { database: "postgresql" });
        const isLimitIncludes = JSON.stringify(vocabulary);
        if (_.includes(isLimitIncludes, "{{LIMIT}}")) {
            return queryPayload?.query
        }
        const limit = _.get(vocabulary, "limit")
        if (limit === null) {
            _.set(vocabulary, "limit.value[0].value", queryRules.common.maxResultRowLimit)
            _.set(vocabulary, "limit.value[0].type", "number")
            let convertToSQL = parser.sqlify(vocabulary, { database: "postgresql" });
            convertToSQL = convertToSQL.replace(/`/g, "\"");
            queryPayload.query = convertToSQL
        } else if (Array.isArray(limit.value) && limit.value.length > 0) {
            const limitIndex = limit.seperator === "," && limit.value.length > 1 ? 1 : 0;
            const userLimit = limit.value[limitIndex].value;
            if (typeof userLimit === "number" && userLimit > queryRules.common.maxResultRowLimit) {
                limit.value[limitIndex].value = queryRules.common.maxResultRowLimit;
                let convertToSQL = parser.sqlify(vocabulary, { database: "postgresql" });
                convertToSQL = convertToSQL.replace(/`/g, "\"");
                queryPayload.query = convertToSQL;
            }
        }
        return true
    } catch (error) {
        logger.warn("Sql parser error", error)
        return false
    }
}
export const setQueryLimits = (queryPayload: any) => {
    if (_.isObject(queryPayload?.query)) {
        const threshold = _.get(queryPayload, "query.threshold")
        if (threshold) {
            const maxThreshold = getLimit(threshold, queryRules.common.maxResultThreshold)
            _.set(queryPayload, "query.threshold", maxThreshold)
        }
        else {
            _.set(queryPayload, "query.threshold", queryRules.common.maxResultThreshold)
        }

        const scanLimit = _.get(queryPayload, "query.limit");
        if (scanLimit) {
            const maxSacnLimit = getLimit(scanLimit, queryRules.common.maxResultRowLimit)
            _.set(queryPayload, "query.limit", maxSacnLimit)
        }
        else {
            _.set(queryPayload, "query.threshold", queryRules.common.maxResultRowLimit)
        }
    }

    if (_.isString(queryPayload?.query)) {
        const validDruidSql = parseSqlQuery(queryPayload)
        if (!validDruidSql) {
            let query = queryPayload.query;
            if (/\blimit\b/i.test(query)) {
                return query;
            }
            const limitRegex = /\bLIMIT\b\s+\d+/i;
            if (!limitRegex.test(query)) {
                const maxLimit = _.get(queryRules, "common.maxResultRowLimit");
                query += ` LIMIT ${maxLimit}`;
                queryPayload.query = query;
            }
        }
    }
}

const getDataSourceFromPayload = (queryPayload: any) => {
    if (_.isString(queryPayload.query)) {
        queryPayload.query = queryPayload.query.replace(/from\s+["'`]?[\w-]+["'`]?(\s+where\s+)/i, ` from "${dataset_id}"$1`);
        return dataset_id
    }
    if (_.isObject(queryPayload.query)) {
        const dataSourceField: any = _.get(queryPayload, "query.datasetId", "");
        return dataset_id || dataSourceField;
    }
}

const getDataSourceLimits = (datasource: string) => {
    const rules = _.get(queryRules, "rules") || [];
    return _.find(rules, { dataset: datasource });
};

const getIntervals = (payload: any) => {
    if (_.isObject(payload.intervals) && !_.isArray(payload.intervals)) {
        return payload.intervals.intervals;
    } else {
        return payload.intervals;
    }
};

const isValidDateRange = (
    fromDate: moment.Moment, toDate: moment.Moment, allowedRange: number = 0
): boolean => {
    const differenceInDays = Math.abs(fromDate.diff(toDate, "days"));
    const isValidDates = differenceInDays > allowedRange ? false : true;
    return isValidDates;
};

const validateDateRange = (fromDate: moment.Moment, toDate: moment.Moment, allowedRange: number = 0) => {
    const isValidDates = isValidDateRange(fromDate, toDate, allowedRange);
    if (isValidDates) {
        return true
    }
    else {
        logger.error({ apiId, requestBody, msgid, dataset_id, message: `Data range cannnot be more than ${allowedRange} days.`, code: errCode.invalidDateRange })
        throw obsrvError("", errCode.invalidDateRange, `Invalid date range! make sure your range cannot be more than ${allowedRange} days`, "BAD_REQUEST", 400);
    }
};

const validateQueryRules = (queryPayload: any, limits: any) => {
    let fromDate: any, toDate: any;
    const allowedRange = limits.maxDateRange;
    const query = queryPayload.query;
    if (query && _.isObject(query)) {
        const dateRange = getIntervals(query);
        const extractedDateRange = Array.isArray(dateRange) ? dateRange[0].split("/") : dateRange.toString().split("/");
        fromDate = moment(extractedDateRange[0], momentFormat);
        toDate = moment(extractedDateRange[1], momentFormat);
    }
    else {
        // need to add query date validations for maximum query limit
        return true
    }
    const isValidDates = fromDate && toDate && fromDate.isValid() && toDate.isValid()
    return isValidDates ? validateDateRange(fromDate, toDate, allowedRange)
        : { message: "Invalid date range! the date range cannot be a null value", statusCode: 400, errCode: "BAD_REQUEST", code: errCode.invalidDateRange };
};

const getDataSourceRef = async (datasetId: string, requestGranularity?: string) => {
    const dataSources = await getDatasourceList(datasetId)
    if (_.isEmpty(dataSources)) {
        logger.error({ apiId, requestBody, msgid, dataset_id, message: `Datasource ${datasetId} not available in datasource live table`, code: errCode.notFound })
        throw obsrvError("", errCode.notFound, `Datasource ${datasetId} not available for querying`, "NOT_FOUND", 404);
    }
    const record = dataSources.find((record: any) => {
        const metadata = _.get(record, "dataValues.metadata", {});
        const { aggregated, granularity } = metadata;
        if (!aggregated) {
            return true;
        }
        return aggregated && requestGranularity ? granularity === requestGranularity : false;
    });
    return _.get(record, ["dataValues", "datasource_ref"])
}

export const checkSupervisorAvailability = async (datasourceRef: string, requestPayload?: any, messageId?: string, datasetId?: string) => {
    const { data } = await druidHttpService.get("/druid/coordinator/v1/loadstatus");
    const datasourceAvailability = _.get(data, datasourceRef)

    const reqBody = requestPayload || requestBody;
    const msgId = messageId || msgid;
    const dId = datasetId || dataset_id;

    if (_.isUndefined(datasourceAvailability)) {
        const logMsg = "Segments not published to the metadata store yet, please check the coordinator load status";
        const errorMsg = "Datasource not available for querying";
        logger.error({ apiId, requestBody: reqBody, msgid: msgId, dataset_id: dId, message: logMsg, code: errCode.notFound })
        throw obsrvError("", "DATASOURCE_NOT_AVAILABLE", errorMsg, "NOT_FOUND", 404)
    }
    if (datasourceAvailability !== 100) {
        const logMsg = `Segments not fully published to the metadata store yet, current load: ${datasourceAvailability}%`;
        const errorMsg = "Data is still loading. Please try after some time.";
        logger.error({ apiId, requestBody: reqBody, msgid: msgId, dataset_id: dId, message: logMsg, code: errCode.notFound })
        throw obsrvError("", "DATASOURCE_NOT_FULLY_AVAILABLE", errorMsg, "RANGE_NOT_SATISFIABLE", 416)
    }
}

const setDatasourceRef = async (datasetId: string, payload: any): Promise<any> => {
    const granularity = _.get(payload, "context.aggregationLevel")
    const datasourceRef = _.isEmpty(datasourceId) ? await getDataSourceRef(datasetId, granularity) : datasourceId;
    if (!datasourceRef) {
        throw obsrvError("", "DATASOURCE_NOT_FOUND", "Datasource not found to query", "NOT_FOUND", 404)
    }
    await checkSupervisorAvailability(datasourceRef)
    const existingDatasources = await getDatasourceListFromDruid();

    if (!_.includes(existingDatasources.data, datasourceRef)) {
        logger.error({ apiId, requestBody, msgid, dataset_id, message: `Dataset ${datasetId} with table ${granularity} is not available for querying`, code: errCode.notFound })
        throw obsrvError("", errCode.notFound, `Dataset ${datasetId} with table ${granularity} is not available for querying`, "NOT_FOUND", 404);
    }
    if (_.isString(payload?.query)) {
        payload.query = payload.query.replace(datasetId, datasourceRef)
    }
    if (_.isObject(payload?.query)) {
        _.set(payload, "query.dataSource", datasourceRef);
        _.set(payload, "query.granularity", granularity);
    }
    return true;
}

export const buildSqlQuery = async (req: Request, query: string) => {
    const ast: any = parser.astify(query, { database: "postgresql" });
    const fromList = _.castArray(_.get(ast, "from", [])).filter(Boolean);
    const tableParams = _.omit(_.get(req, "query", {}), ["alias"]) as Record<string, any>;
    const useAlias = String(_.get(req, "query.alias", "true")).toLowerCase() !== "false";

    const missingParams: string[] = [];
    _.forEach(fromList, (entry: any) => {
        const table = _.get(entry, "table");
        const ref = tableParams[table];
        if (!_.isString(ref) || _.isEmpty(ref)) {
            missingParams.push(table);
        }
    });
    if (!_.isEmpty(missingParams)) {
        const logMsg = `Missing query param(s) for table(s): ${_.uniq(missingParams).join(", ")}`;
        const errorMsg = "Invalid request: table mapping parameter is missing.";
        logger.error({ apiId, message: logMsg });
        throw obsrvError("", "DATA_OUT_MISSING_TABLE_PARAM", errorMsg, "BAD_REQUEST", 400);
    }

    const tableToRef: Record<string, string> = {};

    if (useAlias) {
        const aliases = _.uniq(_.map(fromList, entry => tableParams[_.get(entry, "table")]));
        const rows = await datasetService.getDatasourceRefsByAlias(aliases);
        const aliasToRef = _.fromPairs(_.map(rows, r => [r.datasource, r.datasource_ref]));

        const notFound = _.filter(aliases, alias => !aliasToRef[alias]);
        if (!_.isEmpty(notFound)) {
            throw obsrvError("", "DATASOURCE_NOT_FOUND", `Datasource(s) not found: ${notFound.join(", ")}`, "NOT_FOUND", 404);
        }

        _.forEach(fromList, (entry: any) => {
            const table = _.get(entry, "table");
            tableToRef[table] = aliasToRef[tableParams[table]];
        });
    } else {
        _.forEach(fromList, (entry: any) => {
            const table = _.get(entry, "table");
            tableToRef[table] = tableParams[table];
        });

        const datasourceRefs = _.uniq(_.values(tableToRef));
        const existing = await datasetService.getExistingDatasourceRefs(datasourceRefs);
        const notFound = _.difference(datasourceRefs, _.map(existing, "datasource_ref"));
        if (!_.isEmpty(notFound)) {
            throw obsrvError("", "DATASOURCE_NOT_FOUND", `Datasource(s) not found: ${notFound.join(", ")}`, "NOT_FOUND", 404);
        }
    }

    const datasourceRefs = _.uniq(_.values(tableToRef));

    // Verify each mapped datasource_ref load status in Druid.
    const msgid = _.get(req, "body.params.msgid");
    for (const ref of datasourceRefs) {
        await checkSupervisorAvailability(ref, req.body, msgid);
    }

    // Verify each mapped datasource_ref exists in Druid.
    const druidDatasources = await getDatasourceListFromDruid();
    const notInDruid = _.difference(datasourceRefs, druidDatasources.data);
    if (!_.isEmpty(notInDruid)) {
        throw obsrvError("", "DATASOURCE_NOT_FOUND", `Datasource(s) not available for querying: ${notInDruid.join(", ")}`, "NOT_FOUND", 404);
    }

    // Replace table names with the param values and emit SQL.
    _.forEach(fromList, (entry: any) => {
        const originalTable = entry.table;
        entry.table = tableToRef[originalTable];
        if (!entry.as || _.isEmpty(entry.as)) {
            entry.as = originalTable;
        }
    });
    const rewrittenQuery = parser.sqlify(ast, { database: "postgresql" }).replace(/`/g, "\"");
    _.set(req, "body.query", rewrittenQuery);
    return rewrittenQuery;
};