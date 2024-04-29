import * as _ from "lodash";
import { config } from "../../configs/Config";

export const validateTemplate = async (req: Request) => {
    const query = _.get(req, 'request.query');
    const templateData: any = _.isObject(query) ? JSON.stringify(query) : query;
    const validTemplate = isValidTemplate(templateData);
    return { validTemplate };
}

const isValidTemplate = (templateData: string) => {
    const validTemplate = false;
    const requiredVars = requiredVariablesExist(config?.template_config?.template_required_variables, getTemplateVariables(templateData));
    if (!requiredVars) {
        return validTemplate;
    }
    else {
        return !validTemplate
    }
}

const getTemplateVariables = (templateData: string) => {
    let templateVars = _.map([...templateData.matchAll(/{{.*?}}/ig)], (requiredVar: any) => {
        return _.toUpper(requiredVar[0].replace("{{", "").replace("}}", ""));
    });
    templateVars = _.uniq(templateVars);
    return templateVars;
}

const requiredVariablesExist = (requiredVars: string[], templateVariables: string[]) => {
    if (_.size(_.difference(requiredVars, templateVariables)) === 0) {

        return true;
    }
    else {
        return false;
    }
}