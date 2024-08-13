import { ConnectorInstances } from "../models/ConnectorInstances";
import logger from "../logger";
import _ from "lodash";
import { integer } from "aws-sdk/clients/cloudfront";

class ConnectorInstance {

    createConnectorInstance = async (connectorData: Record<string, any>): Promise<Record<string, any>> => {

        await ConnectorInstances.create(connectorData);
        const responseData = { message: "connector instance created successfully",id: _.get(connectorData,"id") };
        logger.info({ connectorData, message: `connectorInstance Created Successfully with id:${responseData}`, response: responseData });
        return responseData;
    }

    updateConnectorInstance = async (connectorData: Record<string, any>): Promise<Record<string, any>> => {

        await ConnectorInstances.update(connectorData, { where: { id: connectorData.id } });
        const responseData = { message: "connector instance is updated successfully", id: connectorData.id };
        logger.info({ connectorData, message: `connector instance updated successfully with id:${connectorData.id}`, response: responseData });
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