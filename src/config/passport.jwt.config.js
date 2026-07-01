import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import passport from "passport";
import { ExtractJwt, Strategy as jwtStrategy } from "passport-jwt";
import * as userRepository from "../repository/userRepository.js";
import * as permissionRepository from "../repository/permissionRepository.js";
import APIError, { ERROR_CODES } from "../util/APIError.js";

const publicKey = fs.readFileSync(path.resolve(`${process.env.JWT_PUBLIC_PATH}`), "utf-8");
// console.log("Public Key", publicKey);

const configurePassport = (db) => {
  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: publicKey,
    algorithm: "RS256",
  };

  passport.use(
    new jwtStrategy(options, async (jwt_payload, done) => {
      try {
        const rows = await userRepository.findByUUID(jwt_payload.user_uuid, db);
        // console.log("User from payload", rows);
        if (!rows) throw new APIError("Invalid Token", 400, ERROR_CODES.TOKEN_EXPIRED);
        const user = rows?.[0] ?? rows;
        // console.log("User:", user);
        const permissions = await permissionRepository.getUserPermissionsById(user.id, db);
        user.permissions = new Set(permissions.map((p) => p.name));
        // console.log(user.permissions);

        if (!user || (Array.isArray(rows) && rows.length === 0)) {
          return done(null, false, { message: "User not found" });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }),
  );
};

export default configurePassport;
