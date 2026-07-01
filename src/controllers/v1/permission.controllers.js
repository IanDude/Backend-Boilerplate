import { Router } from "express";
import catchAsync from "../../util/catchAsync.js";
import * as permissionService from "../../services/permissionService.js";
import { validateBody, validateParams } from "../../util/validation.js";
import { permissionUUIDParams, permissionBody } from "../../schemas/permission.schema.js";

const router = Router();

//GET / - Get all permissions
router.get(
  "/",
  catchAsync(async (req, res) => {
    const result = await permissionService.getPermissions(req.db);
    res.sendSuccess("Successfully retrieved permissions", result);
  }),
);

// POST / - Create new permission
router.post(
  "/",
  validateBody(permissionBody),
  catchAsync(async (req, res) => {
    await permissionService.addPermission(req.body.permissionName, req.db);
    res.sendSuccess("Successfully created new permission");
  }),
);

// PUT / - Update an existing permission
router.put(
  "/permissionUUID",
  validateParams(permissionUUIDParams),
  validateBody(permissionBody),
  catchAsync(async (req, res) => {
    await permissionService.updatePermission(req.params.permissionUUID, req.body.permissionName, req.db);
    res.sendSuccess("Successfully updated a permission");
  }),
);

// DELETE / - Delete an existing permission
router.delete(
  "/permissionUUID",
  validateBody(permissionUUIDParams),
  catchAsync(async (req, res) => {
    await permissionService.deletePermission(req.params.permissionUUID, req.db);
    res.sendSuccess("Successfully deleted a permissions");
  }),
);

export default router;
