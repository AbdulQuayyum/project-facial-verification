import VerificationSchema from "../models/verifications.js"
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_OK } from "../utilities/status.js";

export async function GetVerification(req, res) {
    const { matricnumber } = req.body;

    if (!matricnumber) {
        return res.status(HTTP_STATUS_BAD_REQUEST).json({
            success: false,
            status: HTTP_STATUS_BAD_REQUEST,
            message: "Error occurred",
            error: "Matric Number parameter is missing"
        });
    }
    try {
        const allverification = await VerificationSchema.find({ matricnumber: req.params.matricnumber }).sort({ verificationTime: -1 });
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
        const allVerifications = await VerificationSchema.find().sort({ timestamp: -1 }).limit(100);

        if (!allVerifications.length) {
            return res.status(HTTP_STATUS_OK).json({
                success: true,
                status: HTTP_STATUS_OK,
                message: "No Verification Information found",
                data: []
            });
        }

        const suspiciousLogins = trackSuspiciousLogins(allVerifications);

        res.status(HTTP_STATUS_OK).json({
            success: true,
            status: HTTP_STATUS_OK,
            message: "All Verification information fetched successfully",
            data: allVerifications
        });

        return suspiciousLogins;
    } catch (error) {
        res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
            success: false,
            status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: "Error occurred",
            error: error.message
        });
    }
}

export function trackSuspiciousLogins(verifications) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failureTracker = new Map();
    const suspiciousLogins = [];

    verifications.forEach(verification => {
        if (verification.verificationStatus === 'failure') {
            const { matricNumber, timestamp } = verification;

            if (timestamp < oneHourAgo) {
                failureTracker.delete(matricNumber);
            }

            if (!failureTracker.has(matricNumber)) {
                failureTracker.set(matricNumber, {
                    failureCount: 1,
                    firstFailureTime: timestamp
                });
            } else {
                const currentAttempt = failureTracker.get(matricNumber);

                if (currentAttempt.firstFailureTime >= oneHourAgo) {
                    currentAttempt.failureCount++;

                    if (currentAttempt.failureCount >= 3) {
                        const suspiciousLogin = {
                            matricNumber,
                            failureCount: currentAttempt.failureCount,
                            firstFailureTime: currentAttempt.firstFailureTime
                        };

                        if (!suspiciousLogins.some(login => login.matricNumber === matricNumber)) {
                            suspiciousLogins.push(suspiciousLogin);
                        }
                    }
                } else {
                    currentAttempt.failureCount = 1;
                    currentAttempt.firstFailureTime = timestamp;
                }
            }
        }
    });

    return suspiciousLogins;
}

export async function GetSuspiciousLogins(req, res) {
    const suspiciousLogins = trackSuspiciousLogins(
        await VerificationSchema.find().sort({ timestamp: -1 }).limit(100)
    );

    res.status(HTTP_STATUS_OK).json({
        success: true,
        status: HTTP_STATUS_OK,
        message: "Suspicious logins retrieved",
        data: suspiciousLogins
    });
}