import * as roleRepository from "../repository/roleRepository.js";

export async function getRoles(db) {
  const roles = await roleRepository.getAll(db);
  return roles;
}

export async function addRole() {}
