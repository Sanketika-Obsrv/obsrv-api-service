import { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { v4 as uuidv4 } from 'uuid';

 export const setDataToRequestObject = (apiId: string) => async (req: Request, res: Response, next: NextFunction) => {
     (req as any).id = apiId;
     const uniqId = uuidv4();
    _.set(res,"resmsgid", uniqId)
     next();
 }