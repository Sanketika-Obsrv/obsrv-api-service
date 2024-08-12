import { ConnectorInstances } from "../models/ConnectorInstances";
import logger from "../logger";
import _ from "lodash";

class ConnectorInstance {

    createConnectorInstance = async (id: Record<string, any>): Promise<Record<string, any>> => {

        const response = await ConnectorInstances.create(id);
        const responseData = { id: id };
        logger.info({ id, message: `connectorInstance Created Successfully with id:${responseData}`, response: responseData });
        return responseData;
    }

    updateConnectorInstance = async (id: Record<string, any>): Promise<Record<string, any>> => {

        await ConnectorInstances.update(id, { where: { id: id } });
        const responseData = { message: "connector instance is updated successfully", id: id };
        logger.info({ id, message: `connector instance updated successfully with id:${id}`, response: responseData });
        return responseData;

    }

    checkConnectorInstanceExists = async (id: string): Promise<boolean> => {
        const response = await ConnectorInstances.findByPk(id);
        return response !== null;

    }

    deleteConnectorInstance = async (id: string): Promise<any> => {
        const response = await ConnectorInstances.destroy({
            where: {
                id: id,
            },
        });
        return response
    }

    findConnectorInstance = async (where?: Record<string, any>, attributes?: string[], order?: any): Promise<any> => {
        return ConnectorInstances.findAll({ where, attributes, order, raw: true })
    }

    getConnectorInstance = async (id: string,columns: any): Promise<any> => {
        return ConnectorInstances.findOne({ where: { id }, attributes: columns, raw: true });
    }

    
}

export const connectorInstance = new ConnectorInstance()