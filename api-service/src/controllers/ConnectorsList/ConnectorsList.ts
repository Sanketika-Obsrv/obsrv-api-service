import { Request, Response } from "express";
import ConnectorListSchema from "./ConnectorsListValidationSchema.json";
import { obsrvError } from "../../types/ObsrvError";
import { schemaValidation } from "../../services/ValidationService";
import _ from "lodash";
import logger from "../../logger";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import httpStatus from "http-status";
import { connectorService } from "../../services/ConnectorService";
import { Op } from "sequelize";

export const apiId = "api.connectors.list";
export const errorCode = "CONNECTORS_LIST_FAILURE";
const defaultFeilds = ["id","connector_id","name", "type", "category", "version", "description", "technology", "runtime", "licence", "owner", "iconurl", "status", "created_by", "updated_by", "created_date", "updated_date"];

const validateRequest = (req: Request)=>{
    const isRequestValid: Record<string, any> = schemaValidation(req.body, ConnectorListSchema)
    if (!isRequestValid.isValid) {
        throw obsrvError("", "CONNECTORS_LIST_INPUT_INVALID", isRequestValid.message, "BAD_REQUEST", 400)
    }
}

const connectorsList = async (req: Request, res: Response) => {
    validateRequest(req);
     
    const connectorBody = req.body.request;
    const connectorList = await listConnectors(connectorBody)
    const responseData = { data: connectorList, count: _.size(connectorList) }
    logger.info({req: req.body, resmsgid: _.get(res, "resmsgid"), message: `Connectors are listed successfully with a connectors count (${_.size(connectorList)})` })
    ResponseHandler.successResponse(req, res, { status: httpStatus.OK, data: responseData });
}

const listConnectors = async (request: Record<string, any>): Promise<Record<string, any>> => {
    const { filters = {} } = request || {};
    const connectorStatus = _.get(filters, "status");
    const connectorCategory = _.get(filters,"category");
    const filterOptions ={ ...!_.isEmpty(connectorStatus)? { status: { [Op.in]: connectorStatus } } : {},
                        ...!_.isEmpty(connectorCategory)? {category: {[Op.in]: connectorCategory}}: {} }
    const filteredconnectorList = await connectorService.findConnectors(filterOptions,defaultFeilds);
    return filteredconnectorList ;    
}

export default connectorsList;