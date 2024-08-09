import { ConnectorInstances } from "../models/ConnectorInstances";
import logger from "../logger";
import _ from "lodash";

class ConnectorInstance {

    createConnectorInstance = async (connectorInstance: Record<string, any>): Promise<Record<string, any>> => {

        const response = await ConnectorInstances.create(connectorInstance);
        const responseData = { id: _.get(response, ["id"]) };
        logger.info({ connectorInstance, message: `connectorInstance Created Successfully with id:${_.get(response, ["id"])}`, response: responseData });
        return responseData;
    }

    updateConnectorInstance = async (connectorInstance: Record<string, any>): Promise<Record<string, any>> => {

        await ConnectorInstances.update(connectorInstance, { where: { id: connectorInstance.id } });
        const responseData = { message: "connector instance is updated successfully", id: connectorInstance.id };
        logger.info({ connectorInstance, message: `connector instance updated successfully with id:${connectorInstance.id}`, response: responseData });
        return responseData;

    }

    checkConnectorInstanceExists = async (connectorInstance: string): Promise<boolean> => {
        const response = await ConnectorInstances.findByPk(connectorInstance);
        return response !== null;

    }

    deleteConnectorInstance = async (param_id: string): Promise<any> => {
        const response = await ConnectorInstances.destroy({
            where: {
                id: param_id,
            },
        });
        return response
    }

    findConnectorInstance = async (where?: Record<string, any>, attributes?: string[], order?: any): Promise<any> => {
        return ConnectorInstances.findAll({ where, attributes, order, raw: true })
    }

    getConnectorInstanceStatus = async (id: string): Promise<any> => {
        const response = await ConnectorInstances.findOne({
            where: { id },
            attributes: ['status'],
            raw: true
        });
        return response
    }
}

export const connectorInstance = new ConnectorInstance()