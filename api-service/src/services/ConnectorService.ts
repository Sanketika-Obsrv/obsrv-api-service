// import _ from "lodash";
import { ConnectorRegistry } from "../models/ConnectorRegistry";

class ConnectorService{

    findConnectors = async (where?: Record<string, any>, attributes?: string[]): Promise<any> => {
        return ConnectorRegistry.findAll({where, attributes, raw: true});
    }
  
}

export const connectorService = new ConnectorService();