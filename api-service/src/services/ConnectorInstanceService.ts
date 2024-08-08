import { ConnectorInstances } from "../models/ConnectorInstances";
import logger from "../logger";
import _ from "lodash";

class ConnectorInstance {

    createConnectorInstance = async (reqbody: Record<string, any>): Promise<Record<string, any>> => {

        const response = await ConnectorInstances.create(reqbody);
        const responseData = { id: _.get(response, ["id"]) };
        logger.info({ reqbody, message: `connectorInstance Created Successfully with id:${_.get(response, ["id"])}`, response: responseData });
        return responseData;
    }

    updateConnectorInstance = async (reqbody: Record<string, any>): Promise<Record<string, any>> => {

        await ConnectorInstances.update(reqbody, { where: { id: reqbody.id } });
        const responseData = { message: "connector instance is updated successfully", id: reqbody.id };
        logger.info({ reqbody, message: `connector instance updated successfully with id:${reqbody.id}`, response: responseData });
        return responseData;

    }

    checkConnectorInstanceExists = async (connector_Instance_Id: string): Promise<boolean> => {
        const response = await ConnectorInstances.findByPk(connector_Instance_Id);
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
}

export const connectorInstance = new ConnectorInstance()