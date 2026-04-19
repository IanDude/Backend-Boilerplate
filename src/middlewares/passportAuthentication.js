import passport from "passport";

export const authenticate = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Unauthorized. Please provide a valid token",
        code: "UNAUTHORIZED",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};
