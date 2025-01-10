import VerificationSchema from "../models/verifications.js"
import {  HTTP_STATUS_CREATED, HTTP_STATUS_INTERNAL_SERVER_ERROR } from "../utilities/status.js";

export async function CreateVerification(req, res) {
    try {
        const verification = new VerificationSchema(req.body);
        await verification.save();
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