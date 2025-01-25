import { Router } from "express"
const router = Router()

import { CreateVerification, FetchImageWithMatric } from "../controllers/verification.controller.js"

router.route("/record-verification").post(CreateVerification)
router.route("/fetch-image").post(FetchImageWithMatric)

export default router