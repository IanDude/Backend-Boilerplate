import argon2 from "argon2";
import crypto from "node:crypto";
import APIError from "./APIError.js";

export const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  try {
    const hashedPassword = await argon2.hash(password, {
      salt: Buffer.from(salt, "hex"),
      type: argon2.argon2id,
      memoryCost: 4096,
      timeCost: 3,
      parallelism: 1,
    });
    return { hashedPassword, salt };
    // throw Error();
  } catch (error) {
    throw new APIError("An error occured while generating new hash password", 500);
    // console.error("Error in hashing: ", error);
  }
};

export const comparePassword = async (password, storedHashedPassword, storedSalt) => {
  try {
    const passwordMatched = await argon2.verify(storedHashedPassword, password, {
      salt: Buffer.from(storedSalt, "hex"),
      type: argon2.argon2id,
    });
    return passwordMatched;
  } catch (error) {
    console.error("Error in verifying password", error);
    return false;
  }
};
