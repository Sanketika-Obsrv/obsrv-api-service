import { QueryTemplate } from "../models/QueryTemplate";

export const getQueryTemplate = async (template_name: string): Promise<any> => {
    const template = await QueryTemplate.findOne({
        where: {
            template_name: template_name,
        },
    });
    return template
}