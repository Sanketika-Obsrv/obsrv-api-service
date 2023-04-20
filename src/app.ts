import express, { Application } from "express";
import { config } from "./configs/Config";
import { ResponseHandler } from "./helpers/ResponseHandler";
import { loadExtensions } from "./managers/Extensions";
import { router } from "./routes/Router";
 import bodyParser from "body-parser";
const app: Application = express();
 
app.use(bodyParser.json({ limit: '100mb'}));
app.use(express.json());
 
loadExtensions(app)
  .finally(() => {
    app.use("/", router);
    app.use("*", ResponseHandler.routeNotFound);
    app.use(ResponseHandler.errorResponse);

    app.listen(config.api_port, () => {
      console.log(`listening on port ${config.api_port}`);
    });
  });


export default app;
