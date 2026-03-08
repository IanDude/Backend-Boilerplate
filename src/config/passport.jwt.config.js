import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import passport from "passport";
import { ExtractJwt, Strategy as jwtStrategy } from "passport-jwt";

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
        const [rows] = await db.query("SELECT id, name, email, status FROM users where id = ?", [jwt_payload.userId]);
        const user = rows?.[0] ?? rows;

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
