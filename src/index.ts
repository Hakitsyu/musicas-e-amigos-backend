import * as express from "express";
import * as http from "http";
import * as cors from "cors";
import routes from "./routes";
import { init, initSocketConnection } from "./room";

const app = express();
const instance = init();

app.use(express.json());
app.use(cors());
app.use(routes(instance.manager, instance.controller));

const server = http.createServer(app);
const socketConnection = initSocketConnection(instance.manager, server);
const port = process.env.PORT || 5050;
server.listen(port, () => console.log(`Running server on port ${port}...`));