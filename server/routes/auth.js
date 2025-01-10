import { Router } from "express"

import { CreateAccount, LoginAccount } from "../controllers/auth.controller.js"

const router = Router()

router.route('/create-account').post(CreateAccount);
router.route('/signin').post(LoginAccount);

export default router