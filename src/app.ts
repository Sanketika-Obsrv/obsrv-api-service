import express, { Application } from "express";
import { config } from "./configs/config";
import { ResponseHandler } from "./helpers/responseHandler";
import { router } from "./routes/router";
const app: Application = express();

app.use(express.json());

app.use("/", router);
app.use("*", ResponseHandler.routeNotFound);
app.use(ResponseHandler.errorResponse);

app.listen(config.api_port, () => {
    console.log(`listening on port ${config.api_port}`);
});

export default app;
