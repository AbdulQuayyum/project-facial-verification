import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from 'http';
import { Server } from 'socket.io';
import 'dotenv/config'

import ConnectDB from "./configurations/connect.js";
import VerificationRoutes from "./routes/verification.js"
import AuthRoutes from "./routes/auth.js"
import UserRoutes from "./routes/user.js"
import "./utilities/cronjob.js"

const app = express()
const port = 8888
const server = http.createServer(app)
let io;

export function initIO() {
    io = new Server(server, {
        cors: {
            origin: [
                "http://127.0.0.1:5500",
                "https://project-facial-verification.vercel.app"
            ],
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    return io;
}

export function getIO() {
    if (!io) {
        throw new Error("Socket.IO not initialized. Call initIO() first.");
    }
    return io;
}

ConnectDB();
app.use(cors());
app.set('trust proxy', false)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

initIO();

app.get('/', (req, res) => res.json("Hey There, Welcome to Abdul-Quayyum's Final Year Project A Facial Verfication Service!"));
app.use("/v1/verification", VerificationRoutes)
app.use("/v1/auth", AuthRoutes)
app.use("/v1/user", UserRoutes)

server.listen(port)