import express from "express";
import {
  signup,
  signin,
  getCurrent,
  signout,
  updateSubscription,
  updateAvatar,
  repeadVerify,
  verifyEmail
} from "../../controllers/auth-controller.js";
import authenticate from "../../middlewares/authenticate.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { userSignupSchema, userSigninSchema,repeadVerifySchema } from "../../models/User.js";
import upload from "../../middlewares/upload.js";

import validateBody from "../../decorators/validaterBody.js";
const authRouter = express.Router();
authRouter.post(
  "/register",
  isEmptyBody,
  validateBody(userSignupSchema),
  signup
);
authRouter.post("/login", isEmptyBody, validateBody(userSigninSchema), signin);

authRouter.post(
  "/verify",
  isEmptyBody,
  validateBody(repeadVerifySchema),
  repeadVerify
);
authRouter.get("/verify/:verificationToken", verifyEmail);
authRouter.get("/current", authenticate, getCurrent);

authRouter.post("/logout", authenticate, signout);

authRouter.patch(
  "/avatars",
  authenticate,
  upload.single("avatarURL"),
  updateAvatar
);
authRouter.patch("/", isEmptyBody, authenticate, updateSubscription);
export default authRouter;
