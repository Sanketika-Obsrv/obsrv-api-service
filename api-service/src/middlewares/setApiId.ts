import { NextFunction, Request, Response } from "express";

 export const setApiId = (apiId: string) => async (req: Request, res: Response, next: NextFunction) => {
     (req as any).id = apiId;
     next();
 }