import { Request, Response } from "express";
import { schemaValidation } from "../../services/ValidationService";
import DatasetCreate from "./DatasetListValidationSchema.json";
import { ResponseHandler } from "../../helpers/ResponseHandler";
import { ErrorObject } from "../../types/ResponseModel";
import { DatasetDraft } from "../../models/DatasetDraft";
import logger from "../../logger";
import _ from "lodash";

const datasetList = async (req: Request, res: Response) => {
    try {
        const requestBody = req.body;
        const isRequestValid: Record<string, any> = schemaValidation(requestBody, DatasetCreate)
        if (!isRequestValid.isValid) {
            return ResponseHandler.errorResponse({
                message: isRequestValid.message,
                statusCode: 400,
                errCode: "BAD_REQUEST"
            } as ErrorObject, req, res);
        }

        const { filters, offset, limits } = requestBody || {}

        const datasetRecords=await DatasetDraft.findAll({where:{}})
    } catch (error:any) {
        logger.error(error);
        let errorMessage = error;
        const statusCode = _.get(error, "statusCode")
        if(!statusCode || statusCode == 500){
            errorMessage={ message : "Failed to create dataset" }
        }
        ResponseHandler.errorResponse(errorMessage, req, res);
    }
}

export default datasetList;