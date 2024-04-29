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

export const listTemplates = async (limit: number, offset: number): Promise<any> => {
    const template = await QueryTemplate.findAll({
        where: {
        },
        limit: limit || 100,
        offset: offset || 0,
    });
    return template
}