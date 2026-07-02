import * as roleRepository from "../repository/roleRepository.js";
import APIError, { ERROR_CODES } from "../util/APIError.js";
import generateUUID from "../util/generateUUID.js";

export async function getRoles(db) {
  const roles = await roleRepository.getAll(db);
  if (!roles) throw new APIError("No data found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
  return roles;
}

export async function addRole(roleName, db) {
  const roleData = { role_uuid: generateUUID(), name: roleName };
  const result = await roleRepository.createNewRole(roleData, db);
  if (result.affectedRows === 0) throw new APIError("Failed to create new role", 400, ERROR_CODES.DATABASE_ERROR);
}

export async function updateRole(roleUUID, { roleName }, db) {
  const result = await roleRepository.updateByUUID(roleUUID, roleName, db);
  if (result.affectedRows === 0) throw new APIError("Failed to update role", 400, ERROR_CODES.DATABASE_ERROR);
}

export async function deleteRole(roleUUID, db) {
  const result = await roleRepository.deleteByUUID(roleUUID, db);
  if (result.affectedRows === 0) throw new APIError("Failed to delete role", 400, ERROR_CODES.DATABASE_ERROR);
}