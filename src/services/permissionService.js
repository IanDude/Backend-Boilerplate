import * as permissionRepository from "../repository/permissionRepository.js";
import APIError, { ERROR_CODES } from "../util/APIError.js";
import generateUUID from "../util/generateUUID.js";

export async function getPermissions(db) {
  const result = await permissionRepository.getAll(db);
  if (!result) throw new APIError("Failed to get permissions", 400, ERROR_CODES.DATABASE_ERROR);
  return result;
}

export async function addPermission(permissionName, db) {
  const permissionData = {
    permission_uuid: generateUUID(),
    name: permissionName,
  };
  const result = await permissionRepository.createNewPermission(permissionData, db);
  if (!result) throw new APIError("Failed to add new permission", 400, ERROR_CODES.DATABASE_ERROR);
}

export async function updatePermission(permissionUUID, permissionName, db) {
  const result = await permissionRepository.updateByUUID(permissionUUID, permissionName, db);
  if (!result) throw new APIError("Failed to update permission", 400, ERROR_CODES.DATABASE_ERROR);
}

export async function deletePermission(permissionUUID, db) {
  const result = await permissionRepository.deleteByUUID(permissionUUID, db);
  if (!result) throw new APIError("Failed to delete permissions", 400, ERROR_CODES.DATABASE_ERROR);
}
