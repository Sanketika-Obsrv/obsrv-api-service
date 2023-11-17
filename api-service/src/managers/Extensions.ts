import { Application } from "express";
import { extensions } from "../configs/Extensions";
import path from "path";

export const loadExtensions = async (app: Application) => {
    await loadRoutes(app)
}

const loadRoutes = async (app: Application) => {
    for (const extension of extensions) {
        try {
            const extensionPath = path.join(__dirname, "..", "..", "node_modules", extension.id, extension.routePath)
            let ExtensionRoute: any = await import(extensionPath)
            const extensionRoute: IRouter = new ExtensionRoute.Router()
            extensionRoute.init(app)
        } catch (error) {
            console.error(`Error while loading the extension of id ${extension.id} with path ${extension.routePath}`, error)
        }
    }
}

export interface IRouter {
    init(app: Application): void;
  }

export interface IRouterConstructor {
    new(): IRouter;
  }