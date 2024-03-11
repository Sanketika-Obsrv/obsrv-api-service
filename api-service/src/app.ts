import express, { Application } from "express";
import { config } from "./configs/Config";
import { ResponseHandler } from "./helpers/ResponseHandler";
import { router } from "./routes/Router";
import bodyParser from "body-parser";
import { interceptAuditEvents } from "./services/telemetry";
import { queryService } from "./routes/Router";
import { routesConfig } from "./configs/RoutesConfig";
import { QueryValidator } from "./validators/QueryValidator";
import logger from "./logger";
const app: Application = express();
const queryValidator = new QueryValidator();

const services = {
  queryService,
  validationService: queryValidator,
  nativeQueryId: routesConfig.query.native_query.api_id,
  sqlQueryId: routesConfig.query.sql_query.api_id,
}

app.use(bodyParser.json({ limit: config.body_parser_limit }));
app.use(express.text());
app.use(express.json());
app.set("queryServices", services);
app.use(interceptAuditEvents())
app.use("/", router);
app.use("*", ResponseHandler.routeNotFound);
app.use(ResponseHandler.errorResponse);

app.listen(config.api_port, () => {
  logger.info(`listening on port ${config.api_port}`);
});

export default app;
