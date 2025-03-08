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
        // const imageUrl = `${baseUrl}${matric}.jpg`;
        // const imageUrl = `https://schooltry-tertiary-2.s3.eu-west-1.amazonaws.com/Unilorin/profilePictures/${matric}.jpg?X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEAsaCWV1LXdlc3QtMSJHMEUCIEnLmS68sEfEknQSJyUfPPVX5i3JkmxLzDxcImt7MOhRAiEAz2tbLY4IhCkVvMj9WEr4Yw%2Bv%2FDa1R2rn7XQirpPVyaoquQUIVBABGgwzNTkyNDEwODA5MzUiDHAYybBjiP5%2BesJGAyqWBa4%2Bh7O40F0MgXydwnArA195deqX81awkGHw975vVvOpoyrLrgZMaTywkqjxVWwALkLIbsmkNy%2Bejcbcxd2y5zpEjBHvSaVp2EratX20Ij4t8Mrif8gnrMAwl3DDX2pA9HPvKdDl%2BTMNLHldxsTW3vA7p8VEaBxYdR5BaoaW11e5QyY8bm07T5E8e5joJt22J9%2BnyzZfi5vZQI%2FFVwCvegkXSgZralXe7M3hEzOSdPzCjHB4VgXZthWRohOlpcHRw1wiGGmryQ66lxEWbAGO%2FpB%2Fp7%2BnWjTce7awUHywBoE4CklrtMmgAZvMZf%2BiupH9n7LQGT%2FYdOSHHwDKJzu3MCu08avwkusCdVC3f0i31cUeI5zhZwUp0xmk%2Fq6Dn3BWaXLkXYVCECWKx0wgCbs5TuCGOfVKAEQnx3inYfoSraL5BYCMleli8AlF%2B5%2BoNyvWNgl2t6irLSu3abUqBQNwg0NJGFS2Ma34owDIerDsUPz5jBjLTDJxkm8QdYh%2BpEBWc0TN00QkDMs%2FMP9zyv61em8aVyDVfSHFd195fO8ea5dg8NWcFVOBWN2y9sRUAdgZ0IeLw%2FhPxbvFillvfi%2FHygJnQzWDWkBS%2FZU9cyVFtQC1QngbHamojXoPGQHHC2sXo2BM4kHm43TzJgPyVdzwgI4een2rNDJtZcJrlKoPw3DBmC3mOQu4frrBEaKVxRxdVxb7KDBWx4K%2FLws39z9dVjmmiVb6H0YnndYN%2FeJiI9am3Z1cDHdFrCTFNkGIsWjtyy6kwGXGLqBXOD2ULu4liexzZtuAn6J9hgZaWzOiJ%2BcgVSQYAeFsPgaXqC%2Bx34zgSNm6U1z06Vopm25OUVNMCpRP7LvDxYuuuDXp7fKDyOML2iKDEvl0MKXerr4GOrEBD%2FD1LXrjAZjPsX9jJF5XmcGb0SlJ1szPM9ouVFh4qItzFYjOGsJQi9BEcAh9RwgY7ByblN4xyZHwzeH3leRVHRGBBULvO0jGEqzUeiceaw3n6ixXCk4E5Kg%2BM4IqoocbPJ5I%2B7RhcEDn6OD5FPNGDzlN3M7Oykflfnnm%2BL7iNGT82syOU7p4dfXLxBpG%2BJDs2iDNtCQnDZQXslNslndqBdO%2Bu6O14gYh0XWfPg5eO01h&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAVHJDP4BT5BBXOGZW%2F20250308%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20250308T030817Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Signature=ef172ca02a66d0f63a3d2ff04b4c43799eba17729f1a60c28b087bf457fc82d4`;

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
