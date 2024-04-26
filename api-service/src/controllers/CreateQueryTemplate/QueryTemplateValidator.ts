import * as _ from "lodash";
import { config } from "../../configs/Config";

export const validateTemplate = async (req: Request) => {
    const type: any = _.get(req, "request.query_type");
    const query = _.get(req, 'request');
    const templateData: string = JSON.stringify(query);
    const validTemplate = isValidTemplate(templateData, type);
    return { validTemplate };
}

const isValidTemplate = (templateData: string, type: string) => {
    let validTemplate = false;
    const requiredVars = requiredVariablesExist(config?.template_config?.template_required_variables, getTemplateVariables(templateData));
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
        } catch (err: any) { validTemplate = false; }
        return validTemplate;
    }
    else {
        return !validTemplate
    }
}

const stringifyVars = (templateData: string, queryType: string) => {
    getTemplateVariables(templateData).map((variable: string) => {
        const varRegex = new RegExp(`{{${variable}}}`, 'ig');
        if (queryType === "json" && (variable === "STARTDATE" || variable === "ENDDATE")) {
            return templateData = templateData.replace(varRegex, `{{${variable}}}`);
        }
        return templateData = templateData.replace(varRegex, `"{{${variable}}}"`);
    });
    return templateData;
}

const getTemplateVariables = (templateData: string) => {
    let templateVars = _.map([...templateData.matchAll(/{{.*?}}/ig)], (requiredVar: any) => {
        return _.toUpper(requiredVar[0].replace("{{", "").replace("}}", ""));
    });
    templateVars = _.uniq(templateVars);
    return templateVars;
}

const requiredVariablesExist = (requiredVars: string[], templateVariables: string[]) => {
    if (_.size(_.difference(requiredVars, templateVariables)) === 0)
        return true;
    else return false;
}