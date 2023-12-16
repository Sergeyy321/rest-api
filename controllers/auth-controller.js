import User from "../models/User.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { HttpError } from "../helpers/index.js";
import jsonwebtoken from "jsonwebtoken";
import ctrlWrapper from "../decorators/ctrlWrapper.js";
import gravatar from "gravatar";
import path from "path";
import fs from "fs/promises";
import "dotenv/config";
import jimp from "jimp";
import sendEmail from "../helpers/sendEmail.js";
const avatarsPath = path.resolve("public", "avatars");
const { JWT_SECRET, BASE_URL } = process.env;
import { nanoid } from "nanoid";
const verify = (email, verificationToken) => {
  return {
    to: email,
    subject: "Veification email",
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">please verify your email by clicking the following link</a>`,
  };
};
export const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const avatarURL = gravatar.url(email);
    if (user) {
      throw HttpError(409, "Such email is exist");
    }
    const verificationToken = nanoid();
    const hashPassword = await bcryptjs.hash(password, 10);
    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      verificationToken,
      avatarURL,
    });
      await sendEmail(verify(email, verificationToken));
    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const verifyEmail = async (req, res,next) => {
  try {
    
    const { verificationToken } = req.params;
 
    const user = await User.findOne({ verificationToken });
  
    if (!user) {
      throw HttpError(404, "User not found");
      
    }
  
    await User.updateOne(
      { verificationToken: user.verificationToken },
      {
        verify: true,
        verificationToken: "",
      }
    );
  
    res.json({
      message: "Verification successful",
    });
  }
  catch (error) {
    next(error)
  }
};

export const repeadVerify = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  await sendEmail(verify(email, user.verificationToken));

  res.json({
    message: "Verification email sent",
  });
};
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw HttpError(401, "Email or password invalid");
    }
    const passwordCompare = await bcryptjs.compare(password, user.password);
    if (!passwordCompare) {
      throw HttpError(401, "Email or password invalid");
    }
    const payload = {
      id: user._id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
    await User.findByIdAndUpdate(user._id, { token });
    res.status(200).json({
      token,
      user: {
        email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signout = async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: " " });
  res.status(204).json({
    message: "No content",
  });
};

export const updateSubscription = async (req, res, next) => {
  const { subscription } = req.body;
  const { token } = req.user;

  const { id } = jsonwebtoken.verify(token, JWT_SECRET);

  const updateUser = await User.findByIdAndUpdate(
    id,
    { subscription },
    { new: true, runValidators: true }
  );
  if (!updateUser) {
    throw HttpError(404, "User not found");
  }

  res.status(200).json(updateUser);
};

export const updateAvatar = async (req, res, next) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: "something went wrong" });
}
    const { _id } = req.user;
    const { path: oldPath, filename } = req.file;
    const newPath = path.join(avatarsPath, filename);

    (await jimp.read(oldPath)).resize(250, 250).write(oldPath);

    await fs.rename(oldPath, newPath);

    const avatarURL = path.join("avatars", filename);

    await User.findByIdAndUpdate(_id, { avatarURL });

    res.status(200).json({ avatarURL });
  } catch (error) {
    next(error)
  }
};
export const getCurrent = async (req, res, next) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};
export default {
 signout: ctrlWrapper(signout),


}
