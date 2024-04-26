import { NextFunction, Request, Response } from "express";
import _ from "lodash";
import { v4 as uuidv4 } from 'uuid';

export const setResmsgid = async (req: Request, res: Response, next: NextFunction) => {
    const uniqId = uuidv4();
    _.set(res,"resmsgid", uniqId)
    next();
}