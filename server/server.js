import express from "express";
import cors from "cors";
import 'dotenv/config'

import ConnectDB from "./configurations/connect.js";
import VerificationRoutes from "./routes/verification.js"
import AuthRoutes from "./routes/auth.js"
import UserRoutes from "./routes/user.js"

const app = express()
const port = 8888

ConnectDB();
app.use(cors());
app.set('trust proxy', false)
app.get('/', (req, res) => res.json("Hey There, Welcome to Abdul-Quayyum's Final Year Project A Facial Verfication Service!"));
app.use("/v1/verification", VerificationRoutes)
app.use("/v1/auth", AuthRoutes)
app.use("/v1/user", UserRoutes)

app.listen(port)