import { Router } from "express";
import { catchAsync } from "../../util/catchAsync.js";
import * as roleService from "../../services/roleService.js";
import { validateBody, validateParams } from "../../util/validation.js";
import { roleUUIDParam, roleBody } from "../../schemas/role.schema.js";

const router = Router();

// GET / - Get all roles
router.get(
  "/",
  catchAsync(async (req, res) => {
    const result = await roleService.getRoles(req.db);
    res.sendSuccess("Success in getting all roles", result);
  }),
);

//POST / - Create new role
router.post(
  "/",
  validateBody(roleBody),
  catchAsync(async (req, res) => {
    await roleService.addRole(req.body, req.db);
    res.sendSuccess("Success in creating new role");
  }),
);

//PUT / - Update an existing role
router.put(
  "/:roleUUID",
  validateParams(roleUUIDParam),
  validateBody(roleBody),
  catchAsync(async (req, res) => {
    await roleService.updateRole(req.params.roleUUID, req.body, req.db);
    res.sendSuccess("Success in updating a role");
  }),
);

//DELETE / - Delete an existing role
router.delete(
  "/:roleUUID",
  validateParams(roleUUIDParam),
  catchAsync(async (req, res) => {
    await roleService.deleteRole(req.params.roleUUID, req.db);
    res.sendSuccess("Success in deleting a role");
  }),
);

export default router;
