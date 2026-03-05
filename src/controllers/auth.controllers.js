import { Router } from "express";
import { catchAsync } from "../util/catchAsync.js";

const router = Router();

router.get(
  "/check",
  catchAsync(async (req, res) => {
    // res.sendSuccess("AuthRoutes", { name: "sample data" }, 200);
    res.sendError("Error message", null, 400, "SAMPLE_ERROR");
  }),
);

export default router;
