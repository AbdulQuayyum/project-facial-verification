import { Router } from "express"
const router = Router()

import { GetAllVerifications, GetVerification } from "../controllers/user.controller.js"
import AuthMiddleware from "../middlewares/auth.middleware.js"
import AdminMiddleware from "../middlewares/admin.middleware.js"

router.route("/verifications").post(AuthMiddleware, AdminMiddleware, GetAllVerifications)
router.route("/verification").post(AuthMiddleware, GetVerification)

export default router