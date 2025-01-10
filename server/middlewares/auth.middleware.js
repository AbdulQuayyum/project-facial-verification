import jwt from 'jsonwebtoken';

import { HTTP_STATUS_UNAUTHORIZED, HTTP_STATUS_FORBIDDEN, HTTP_STATUS_INTERNAL_SERVER_ERROR } from '../utilities/status.js';

export default function (req, res, next) {
    try {
        const token = req.headers.authorization.split(' ')[1];

        if (!token) {
            return res.status(HTTP_STATUS_UNAUTHORIZED).json({
                success: false,
                status: HTTP_STATUS_UNAUTHORIZED,
                message: 'Error occurred',
                error: 'No token provided',
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
            if (err) {
                console.error(err);
                return res.status(HTTP_STATUS_FORBIDDEN).json({
                    success: false,
                    status: HTTP_STATUS_FORBIDDEN,
                    message: 'Error occurred',
                    error: err,
                });
            }

            req.body._id = decoded.id;
            next();
        });
    } catch (error) {
        return res.status(HTTP_STATUS_INTERNAL_SERVER_ERROR).json({
            success: false,
            status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
            message: 'Error occurred',
            error: 'Internal server error',
        });
    }
}
