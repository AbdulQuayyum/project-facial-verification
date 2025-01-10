import { Router } from "express"
const router = Router()

import { GetAllVerifications, GetVerification } from "../controllers/user.controller.js"
import AuthMiddleware from "../middlewares/auth.middleware.js"

router.route("/verifications/all").post(AuthMiddleware, GetAllVerifications)
router.route("/verification/:matricnumber").post(AuthMiddleware, GetVerification)

export default router