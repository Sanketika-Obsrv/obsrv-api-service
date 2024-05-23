import { Request, Response } from "express";
import { validateQuery } from "../DataOut/QueryValidator";
import * as _ from "lodash"
import { ErrorObject } from "../../types/ResponseModel";
import { executeNativeQuery, executeSqlQuery } from "../../connections/druidConnection";
import { config } from "../../configs/Config";
import logger from "../../logger";
import { apiId } from "./QueryTemplateController";
const requiredVariables: any = _.get(config, "template_config.template_required_variables") || [];
const additionalVariables: any = _.get(config, "template_config.template_additional_variables") || [];

export const handleTemplateQuery = async (req: Request, res: Response, templateData: Record<string, any>, queryType: string,) => {
    const queryParams: any = _.get(req, "body.request");
    const template_id = _.get(req, "params.templateId");
    const resmsgid: any = _.get(res, "resmsgid");
    Object.entries(queryParams).map(([key, value]) => { queryParams[_.toUpper(key)] = value });
    let query = replaceVariables(queryParams, templateData, queryType, resmsgid, template_id);
    let body: any = {};
    if (queryType === "json") {
        query = JSON.stringify(query)
        body = {
            query: JSON.parse(query.replace(/\\/g, "")),
            context: { datasetId: _.get(queryParams, "DATASET"), aggregationLevel: _.get(queryParams, "AGGREGATIONLEVEL") },
        };
    }
    if (queryType === "sql") {
        body = {
            query: query.replace(/\\/g, ""),
            context: { datasetId: _.get(queryParams, "DATASET"), aggregationLevel: _.get(queryParams, "AGGREGATIONLEVEL") },
        };
    }
    const validationStatus = await validateQuery(body, _.get(queryParams, "DATASET"));

    if (queryType === "json" && validationStatus === true) {
        return await executeNativeQuery(body?.query)
    }
    if (queryType === "sql" && validationStatus === true) {
        const query = body?.query
        return await executeSqlQuery({ query })
    }
}

const replaceVariables = (queryParams: Record<string, any>, templateData: Record<string, any>, queryType: string, resmsgid: string, template_id: string) => {
    let query: any = templateData;
    requiredVariables.forEach((variable: string) => {
        if (queryType === "json" && (variable === "STARTDATE" || variable === "ENDDATE")) {
            const varRegex = new RegExp(`{{${variable}}}`, 'ig');
            return query = query.replace(varRegex, `${queryParams[variable]}`);
        }

        const varRegex = new RegExp(`{{${variable}}}`, 'ig');
        if (queryType === "sql" && (variable === "STARTDATE" || variable === "ENDDATE")) {
            return query = query.replace(varRegex, `'${queryParams[variable]}'`);
        }

        if (queryType === "sql" && variable === "DATASET") {
            query = query.replaceAll('"', "")
            return query = query.replace(varRegex, `"${queryParams[variable]}"`);
        }

        if (variable === "DATASET") {
            return query = query.replace(varRegex, `${queryParams[variable]}`);
        }
    });

    additionalVariables.forEach((variable: string) => {
        const varRegex = new RegExp(`{{${variable}}}`, 'ig');
        if ((queryType === "json" || queryType === "sql") && variable === "LIMIT") {
            query = query.replace(varRegex, `${queryParams[variable]}`);
        }
    })

    if (queryType === "json")
        try {
            query = JSON.parse(query);
        }
        catch (err) {
            logger.error({ err, apiId, resmsgid, template_id, message: `Failed to parse the query`, code: "QUERY_TEMPLATE_INVALID_INPUT" })
            throw {
                code: "QUERY_TEMPLATE_INVALID_INPUT",
                message: "Failed to parse the query",
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject
        }
    return query;
}