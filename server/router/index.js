import { Router } from "express"
const router = Router()

import { CreateVerification, GetAllVerifications, GetVerification } from "../controllers/verification.controller.js"

router.route("/verification").post(CreateVerification)
router.route("/verifications/all").post(GetAllVerifications)
router.route("/verification/:matricnumber").post(GetVerification)

export default router