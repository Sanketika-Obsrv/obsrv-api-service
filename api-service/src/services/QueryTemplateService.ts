import { QueryTemplate } from "../models/QueryTemplate";

export const getQueryTemplate = async (template_id: string): Promise<any> => {
    const template = await QueryTemplate.findOne({
        where: {
            template_id: template_id,
        },
    });
    return template
}

export const deleteTemplate = async (template_id: string): Promise<any> => {
    const template = await QueryTemplate.destroy({
        where: {
            template_id: template_id,
        },
    });
    return template
}