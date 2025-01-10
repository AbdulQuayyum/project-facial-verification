import express from "express";
import cors from "cors";
import 'dotenv/config'

import ConnectDB from "./configurations/connect.js";
import routes from "./router/index.js"

const app = express()
const port = 8888

ConnectDB();
app.use(cors());
app.set('trust proxy', false)
app.get('/', (req, res) => res.json("Hey There, Welcome to Abdul-Quayyum's Final Year Project A Facial Verfication Service!"));
app.use("/v1", routes)

app.listen(port)