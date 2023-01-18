import express, { Application } from "express";
import { config } from "./configs/config";
import { ResponseHandler } from "./helpers/responseHandler";
import { router } from "./routes/router";
const app: Application = express();
const responseHandler = new ResponseHandler();
const globalErrorHandler = responseHandler.errorResponse;

app.use(express.json());

app.use("/", router);
app.use("*", responseHandler.routeNotFound);
app.use(globalErrorHandler);

app.listen(config.api_port, () => {
  console.log(`listening on port ${config.api_port}`);
});

export default app;
