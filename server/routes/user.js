import { Router } from "express"
const router = Router()

import { GetAllVerifications, GetVerification, GetSuspiciousLogins } from "../controllers/user.controller.js"
import AuthMiddleware from "../middlewares/auth.middleware.js"
import AdminMiddleware from "../middlewares/admin.middleware.js"

router.route("/verifications").post(GetAllVerifications)
router.route("/verification").post(AuthMiddleware, GetVerification)
router.route("/suspicious-logins").post(GetSuspiciousLogins)

export default router