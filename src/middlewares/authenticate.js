import passport from "passport";
import { ERROR_CODES } from "../util/APIError.js";

const authenticate = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.sendError(info?.message || "Unauthorized.", "Invalid Token", 401, ERROR_CODES.TOKEN_INVALID);
      // return res.status(401).json({ success: false, message: info?.message, code: "UNAUTHORIZED" });
    }

    req.user = user;
    // console.log(user);
    next();
  })(req, res, next);
};

export default authenticate;