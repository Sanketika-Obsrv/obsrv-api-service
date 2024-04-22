import { Request } from "express";
import { v4 } from "uuid";
import * as _ from "lodash"
import { config } from "../../configs/Config"
import { cloudProvider } from "../../services/CloudServices";

export const container = _.get(config, "cloud_config.container");
export const template_path = _.get(config, "cloud_config.template_container_prefix");
export const globalCache: any = new Map();

//COMMON METHODS FOR DIFFERENT SERVICE PROVIDERS
const fileExists = async (container: string, fileName: string, prefix: string) => {
    return new Promise((resolve, reject) => {
        cloudProvider.fileExists(container, fileName, prefix, (err: any) => {
            if (err && err["$metadata"]?.httpStatusCode === 404) resolve(false);
            else if (err && err["$metadata"]?.httpStatusCode !== 404) reject(err);
            resolve(true);
        });
    });
}

export const uploadFile = (container: string, fileName: string, prefix: string, data: any) => {
    return new Promise((resolve, reject) => {
        cloudProvider.uploadFileToBucket(container, fileName, prefix, data, (err: any, data: any) => {
            if (err) reject(err);
            resolve(data);
        });
    });
}

//HELPER METHODS AND QUERY VALIDATIONS
const getTemplateName = (templateName: string) => {
    return _.toUpper(templateName.replace(/ /g, '_').replace(/[^\w-]+/g, ''));
}

const requiredVariablesExist = (requiredVars: string[], templateVariables: string[]) => {
    if (_.size(_.difference(requiredVars, templateVariables)) === 0)
        return true;
    else return false;
}

export const getFileName = (templateName: string) => {
    return `${templateName}.json`;
}

export const existingTemplate = async (templateName: string) => {
    const fileExist = await fileExists(container, templateName, template_path);
    return fileExist;
}

export const formatFileData = (templateName: string, templateData: string, type: string) => {
    let fileData: Record<string, any> = {};
    if (type === "sql") fileData = {
        template_id: v4(),
        template_name: templateName,
        query: templateData.toString(),
        query_type: type
    };
    else if (type === "json") fileData = {
        template_id: v4(),
        template_name: templateName,
        query: JSON.parse(templateData),
        query_type: type
    };
    return fileData;
}

const getTemplateVariables = (templateData: string) => {
    let templateVars = _.map([...templateData.matchAll(/{{.*?}}/ig)], (requiredVar: any) => {
        return _.toUpper(requiredVar[0].replace("{{", "").replace("}}", ""));
    });
    templateVars = _.uniq(templateVars);
    return templateVars;
}

const stringifyVars = (templateData: string, queryType: string) => {
    getTemplateVariables(templateData).map((variable: string) => {
        const varRegex = new RegExp(`{{${variable}}}`, 'ig');
        if (queryType === "json" && (variable === "STARTDATE" || variable === "ENDDATE"))
            return templateData = templateData.replace(varRegex, `{{${variable}}}`);
        return templateData = templateData.replace(varRegex, `"{{${variable}}}"`);
    });
    return templateData;
}

const isValidTemplate = (templateData: string, type: string) => {
    let validTemplate = false;
    const requiredVars = requiredVariablesExist(config.cloud_config.template_required_variables, getTemplateVariables(templateData));
    if (!requiredVars) return validTemplate;
    if (type === "json") {
        let data = _.cloneDeep(stringifyVars(templateData, type));
        getTemplateVariables(data).map((variable: string) => {
            const varRegex = new RegExp(`"{{${variable}}}"`, 'ig');
            data = data.replace(varRegex, `""`);
            data = data.replace(/"""/g, `"`);
        });
        try {
            JSON.parse(data);
            validTemplate = true;
        } catch (err: any) { console.log(err); validTemplate = false; }
        return validTemplate;
    }
    else {
        return !validTemplate
    }
}

export const validateTemplate = async (req: Request, validateData: boolean) => {
    let { templateName } = req.params;
    let { type = "json" } = req.query;
    let templateData: string = req.body.toString()
    type = _.toLower(type.toString());
    templateName = getTemplateName(templateName);

    let validTemplate = isValidTemplate(templateData, type);
    if (!config.cloud_config.template_supported_queries.includes(type)) validTemplate = false;
    if (validateData && !validTemplate)
        return { templateData, templateName, fileExists: null, validTemplate, type };
    templateData = stringifyVars(templateData, type);
    const fileExists = await existingTemplate(getFileName(templateName));
    return { templateData, templateName, fileExists, validTemplate, type };
}
