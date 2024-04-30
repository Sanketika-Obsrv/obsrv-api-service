import { Request, Response } from "express";
import { validateQuery } from "../DataOut/QueryValidator";
import * as _ from "lodash"
import { ErrorObject } from "../../types/ResponseModel";
import { executeNativeQuery, executeSqlQuery } from "../../connections/druidConnection";
import { config } from "../../configs/Config";
const requiredVariables: any = _.get(config, "template_config.template_required_variables") || [];
const additionalVariables: any = _.get(config, "template_config.template_additional_variables") || [];

export const handleTemplateQuery = async (req: Request, res: Response, templateData: Record<string, any>, queryType: string,) => {
    const qParams: any = req.query;
    Object.entries(req.query).map(([key, value]) => { qParams[_.toUpper(key)] = value });
    const query = replaceVariables(qParams, templateData, queryType);
    if (queryType === "json") {
        req.body = {
            query: JSON.parse(query.replace(/\\/g, "")),
            context: { datasetId: _.get(qParams, "DATASET"), table: _.get(qParams, "TABLE") },
        };
    }
    if (queryType === "sql") {
        req.body = {
            query: query.replace(/\\/g, ""),
            context: { datasetId: _.get(qParams, "DATASET"), table: _.get(qParams, "TABLE") },
        };
    }
    const validationStatus = await validateQuery(req.body, _.get(qParams, "DATASET"));
    if (typeof validationStatus === 'object') {
        throw {
            code: validationStatus?.code,
            message: validationStatus?.message,
            statusCode: validationStatus?.statusCode,
            errCode: validationStatus?.errCode
        } as ErrorObject
    }

    if (queryType === "json" && validationStatus === true) {
        return await executeNativeQuery(req.body.query)
    }
    if (queryType === "sql" && validationStatus === true) {
        const query = req?.body?.query
        return await executeSqlQuery({ query })
    }
}

const replaceVariables = (qParams: Record<string, any>, templateData: Record<string, any>, queryType: string) => {
    let query: any = templateData;
    if (queryType === "json")
        query = JSON.stringify(templateData);

    requiredVariables.forEach((variable: string) => {
        if (queryType === "json" && (variable === "STARTDATE" || variable === "ENDDATE")) {
            const varRegex = new RegExp(`{{${variable}}}`, 'ig');
            return query = query.replace(varRegex, `${qParams[variable]}`);
        }

        const varRegex = new RegExp(`{{${variable}}}`, 'ig');
        if (queryType === "sql" && (variable === "STARTDATE" || variable === "ENDDATE")) {
            return query = query.replace(varRegex, `'${qParams[variable]}'`);
        }

        if (queryType === "sql" && variable === "DATASET") {
            query = query.replaceAll('"', "")
            return query = query.replace(varRegex, `"${qParams[variable]}"`);
        }

        if (variable === "DATASET") {
            return query = query.replace(varRegex, `${qParams[variable]}`);
        }

        else {
            return query = query.replace(varRegex, `${qParams[variable]}`);
        }
    });

    additionalVariables.forEach((variable: string) => {
        const varRegex = new RegExp(`{{${variable}}}`, 'ig');
        if ((queryType === "json" || queryType === "sql") && variable === "LIMIT") {
            query = query.replace(varRegex, `${qParams[variable]}`);
        }
    })

    if (queryType === "json")
        query = JSON.parse(query);
    return query;
}