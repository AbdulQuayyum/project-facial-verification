import VerificationSchema from "../models/verifications.js"
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_CONFLICT, HTTP_STATUS_CREATED, HTTP_STATUS_FORBIDDEN, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_NOT_FOUND, HTTP_STATUS_OK } from "../utilities/Status.js";

export async function CreateVerification(req, res) {
    try {
        const verification = new VerificationSchema(req.body);
        await verification.save();
        res.status(HTTP_STATUS_CREATED).json({
            success: true,
            status: HTTP_STATUS_CREATED,
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

export async function GetVerification(req, res) {
    const { matricNumber } = req.params;

    if (!matricNumber) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({
            success: false,
            status: HTTP_STATUS_BAD_REQUEST,
            message: "Error occurred",
            error: "Matric Number parameter is missing"
        });
    }
    try {
        const allverification = await VerificationSchema.find({ matricNumber: req.params.matricNumber }).sort({ verificationTime: -1 });
        return res.status(HTTP_STATUS_OK).json({
            success: true,
            status: HTTP_STATUS_OK,
            message: "Verification information fetched successfully",
            data: { allverification }
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

export async function GetAllVerifications(req, res) {
    try {
        const allverifications = await VerificationSchema.find();

        if (!allverifications.length) {
            return res.status(HTTP_STATUS_OK).json({
                success: true,
                status: HTTP_STATUS_OK,
                message: "No Verification Information found",
                data: []
            });
        }

        res.status(HTTP_STATUS_OK).json({
            success: true,
            status: HTTP_STATUS_OK,
            message: "All Verification information fetched successfully",
            data: allverifications
        });
    } catch (error) {
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
            success: false,
            status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Error occurred",
            error: error.message
        });
    }
}
