import axios from "axios";

import VerificationSchema from "../models/verifications.js"
import { HTTP_STATUS_CREATED, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_BAD_REQUEST } from "../utilities/status.js";
import { getIO } from "../server.js";
import { trackSuspiciousLogins } from "./user.controller.js";

export async function CreateVerification(req, res) {
    try {
        const verification = new VerificationSchema(req.body);
        await verification.save();

        const io = getIO();
        io.emit('newVerification', verification);

        const allVerifications = await VerificationSchema.find().sort({ timestamp: -1 }).limit(100);
        const suspiciousLogins = trackSuspiciousLogins(allVerifications);

        if (suspiciousLogins.length > 0) {
            io.emit('suspiciousLogins', suspiciousLogins);
        }

        res.status(HTTP_STATUS_CREATED).json({
            success: true,
            status: HTTP_STATUS_CREATED,
            message: "Verification saved successfully",
            data: {
                id: verification._id
            }
        });
    } catch (error) {
        return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
            success: false,
            status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Error occurred",
            error: error.message
        });
    }
}

export async function FetchImageWithMatric(req, res) {
    try {
        const { matric } = req.query;

        if (!matric) {
            return res.status(400).json({
                success: false,
                message: "Matric number is required",
            });
        }

        const baseUrl = "https://schooltry-tertiary-2.s3.eu-west-1.amazonaws.com/Unilorin/profilePictures/";
        const imageUrl = `${baseUrl}${matric}.jpg`;

        const response = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 5000 });

        res.writeHead(200, {
            "Content-Type": "image/jpeg",
            "Content-Length": response.data.byteLength,
        });
        res.end(response.data);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({
                success: false,
                message: "Image not found",
            });
        }

        console.error("Error fetching image:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch image",
            error: error.message,
        });
    }
}
