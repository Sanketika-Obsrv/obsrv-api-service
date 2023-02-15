import express, { Application } from "express";
import { config } from "./configs/Config";
import { ResponseHandler } from "./helpers/ResponseHandler";
import { router } from "./routes/Router";
const app: Application = express();

app.use(express.json());

app.use("/", router);
app.use("*", ResponseHandler.routeNotFound);
app.use(ResponseHandler.errorResponse);

app.listen(config.api_port, () => {
  console.log(`listening on port ${config.api_port}`);
});

export default app;
