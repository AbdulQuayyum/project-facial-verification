import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import UserSchema from '../models/user.js';
import { HTTP_STATUS_OK, HTTP_STATUS_CREATED, HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_UNAUTHORIZED } from '../utilities/status.js';

export async function CreateAccount(req, res) {
    const { matricnumber, password } = req.body;

    try {
        if (!matricnumber && !password) {
            return res.status(HTTP_STATUS_BAD_REQUEST).json({
                success: false,
                status: HTTP_STATUS_BAD_REQUEST,
                message: "Error occurred",
                error: 'Matric Number and Password are required'
            });
        }

        if (!matricnumber) {
            return res.status(HTTP_STATUS_BAD_REQUEST).json({
                success: false,
                status: HTTP_STATUS_BAD_REQUEST,
                message: "Error occurred",
                error: 'Matric Number field is required'
            });
        }

        if (!password) {
            return res.status(HTTP_STATUS_BAD_REQUEST).json({
                success: false,
                status: HTTP_STATUS_BAD_REQUEST,
                message: "Error occurred",
                error: ' Password field is required'
            });
        }

        const existingUser = await UserSchema.findOne({ matricnumber });
        if (existingUser) {
            return res.status(HTTP_STATUS_BAD_REQUEST).json({
                success: false,
                status: HTTP_STATUS_BAD_REQUEST,
                message: "Error occurred",
                error: 'Matric Number already in use'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        new UserSchema({ matricnumber, password: hashedPassword });


        res.status(HTTP_STATUS_CREATED).json({
            success: true,
            status: HTTP_STATUS_CREATED,
            message: 'User created successfully.',
            data: []
        });
    } catch (error) {
        res.status(HTTP_STATUS_BAD_REQUEST).json({
            success: false,
            status: HTTP_STATUS_BAD_REQUEST,
            message: "Error occurred",
            message: error.message
        });
    }
};

export async function LoginAccount(req, res) {
    const { matricnumber, password } = req.body;

    try {
        if (!matricnumber && !password) {
            return res.status(HTTP_STATUS_BAD_REQUEST).json({
                success: false,
                status: HTTP_STATUS_BAD_REQUEST,
                message: "Error occurred",
                error: 'Matric Number and Password are required'
            });
        }

        if (!matricnumber) {
            return res.status(HTTP_STATUS_BAD_REQUEST).json({
                success: false,
                status: HTTP_STATUS_BAD_REQUEST,
                message: "Error occurred",
                error: 'Matric Number field is required'
            });
        }

        if (!password) {
            return res.status(HTTP_STATUS_BAD_REQUEST).json({
                success: false,
                status: HTTP_STATUS_BAD_REQUEST,
                message: "Error occurred",
                error: ' Password field is required'
            });
        }

        const user = await UserSchema.findOne({ matricnumber });
        if (!user) {
            return res.status(HTTP_STATUS_UNAUTHORIZED).json({
                success: false,
                status: HTTP_STATUS_UNAUTHORIZED,
                message: "Error occurred",
                error: 'Invalid credentials'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(HTTP_STATUS_UNAUTHORIZED).json({
                success: false,
                status: HTTP_STATUS_UNAUTHORIZED,
                message: "Error occurred",
                error: 'Invalid password'
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign({ id: user._id, matricnumber: user.matricnumber }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(HTTP_STATUS_OK).json({
            success: true,
            status: HTTP_STATUS_OK,
            message: 'Login successful',
            data: { matricnumber: user.matricnumber, token: token },
        });
    } catch (error) {
        res.status(HTTP_STATUS_BAD_REQUEST).json({
            success: false,
            status: HTTP_STATUS_BAD_REQUEST,
            message: 'Error occurred',
            error: error.message
        });
    }
};
