import { ConnectorInstances } from "../models/ConnectorInstances";
import logger from "../logger";
import _ from "lodash";
import { integer } from "aws-sdk/clients/cloudfront";

class ConnectorInstance {

    createConnectorInstance = async (connectorInstance: Record<string, any>): Promise<Record<string, any>> => {

        await ConnectorInstances.create(connectorInstance);
        const responseData = { message: "connector instance created successfully",id: _.get(connectorInstance,"id") };
        logger.info({ connectorInstance, message: `connectorInstance Created Successfully with id:${responseData}`, response: responseData });
        return responseData;
    }

    updateConnectorInstance = async (connectorInstance: Record<string, any>): Promise<Record<string, any>> => {

        await ConnectorInstances.update(connectorInstance, { where: { id: connectorInstance.id } });
        const responseData = { message: "connector instance is updated successfully", id: connectorInstance.id };
        logger.info({ connectorInstance, message: `connector instance updated successfully with id:${connectorInstance.id}`, response: responseData });
        return responseData;

    }

    checkConnectorInstanceExists = async (id: string): Promise<boolean> => {
        const response = await ConnectorInstances.findByPk(id);
        return response !== null;

    }

    deleteConnectorInstance = async (id: string): Promise<integer> => {
        const response = await ConnectorInstances.destroy({
            where: {
                id: id,
            },
        });
        return response
    }

    getConnectorInstances = async (where?: Record<string, any>, attributes?: string[], order?: any): Promise<any> => {
        return ConnectorInstances.findAll({ where, attributes, order, raw: true })
    }

    getConnectorInstance = async (id: string,columns: any): Promise<any> => {
        return ConnectorInstances.findOne({ where: { id }, attributes: columns, raw: true });
    }
}

export const connectorInstance = new ConnectorInstance()