import express, { Application } from "express";
import { druidProxyRouter } from "./routes/DruidProxyRouter";
import { metricRouter } from "./routes/MetricRouter";
import { router as v2Router } from "./routes/Router";

import bodyParser from "body-parser";
import { config } from "./configs/Config";
import { ResponseHandler } from "./helpers/ResponseHandler";
import { errorHandler, obsrvErrorHandler } from "./middlewares/errors";
import { OTelService } from "./otel/OTelService";
import { alertsRouter } from "./routes/AlertsRouter";
import { interceptAuditEvents } from "./services/telemetry";



const app: Application = express();
OTelService.init() // Initialisation of Open telemetry Service.

app.use(bodyParser.json({ limit: config.body_parser_limit}));
app.use(express.text());
app.use(express.json());
app.use(errorHandler)

app.use(interceptAuditEvents());
app.use("/v2/", v2Router);
app.use("/", druidProxyRouter);
app.use("/alerts/v1", alertsRouter);
app.use("/", metricRouter);
app.use(/(.*)/, ResponseHandler.routeNotFound);
app.use(obsrvErrorHandler);

app.listen(config.api_port, () => {
  console.log(`listening on port ${config.api_port}`);
});

export default app;