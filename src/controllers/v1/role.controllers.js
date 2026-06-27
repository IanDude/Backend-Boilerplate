import { Router } from "express";
import { catchAsync } from "../../util/catchAsync.js";
import * as roleService from "../../services/roleService.js";

const router = Router();

router.get(
  "/",
  catchAsync(async (req, res) => {
    const result = await roleService.getRoles(req.db);
    res.sendSuccess("Success in getting all roles", result);
  }),
);

router.post(
  "/",
  catchAsync(async (req, res) => {
    res.sendSuccess("Success in creating new role");
  }),
);

router.put(
  "/",
  catchAsync(async (req, res) => {
    res.sendSuccess("Success in updating a role");
  }),
);

router.delete(
  "/",
  catchAsync(async (req, res) => {
    res.sendSuccess("Success in deleting a role");
  }),
);

export default router;
