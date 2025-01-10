import jwt from 'jsonwebtoken';

import UserSchema from '../models/user.js';
import { HTTP_STATUS_UNAUTHORIZED, HTTP_STATUS_FORBIDDEN, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '../utilities/status.js';

export default async function (req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(HTTP_STATUS_UNAUTHORIZED).json({
                success: false,
                status: HTTP_STATUS_UNAUTHORIZED,
                message: 'Error occurred',
                error: 'No token provided',
            });
        }

        const token = authHeader.split(' ')[1]; 
        if (!token) {
            return res.status(HTTP_STATUS_UNAUTHORIZED).json({
                success: false,
                status: HTTP_STATUS_UNAUTHORIZED,
                message: 'Error occurred',
                error: 'No token provided',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = decoded;

        const user = await UserSchema.findById(id);

        if (!user) {
            return res.status(HTTP_STATUS_FORBIDDEN).json({
                success: false,
                status: HTTP_STATUS_FORBIDDEN,
                message: 'Permission denied',
                error: 'User not found in the database.',
            });
        }

        if (user.isAdmin) {
            req.body.UserID = id;
            next();
        } else {
            return res.status(HTTP_STATUS_FORBIDDEN).json({
                success: false,
                status: HTTP_STATUS_FORBIDDEN,
                message: 'Permission denied',
                error: 'User does not have sufficient privileges.',
            });
        }
    } catch (error) {
        return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
            success: false,
            status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: 'Error occurred',
            error: error.message,
        });
    }
}
