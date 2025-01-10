import { Router } from "express"
const router = Router()

import { CreateVerification } from "../controllers/verification.controller.js"

router.route("/record-verification").post(CreateVerification)

export default router