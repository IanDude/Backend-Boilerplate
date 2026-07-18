"use strict";
const { v4: uuidv4 } = require("uuid");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert("permissions", [
      //User Module
      { permission_uuid: uuidv4(), name: "user:create", created_at: new Date() }, // 1 - Create new user
      { permission_uuid: uuidv4(), name: "user:view", created_at: new Date() }, // 2 - View own user data
      { permission_uuid: uuidv4(), name: "user:view_any", created_at: new Date()}, // 3 - View any user data
      { permission_uuid: uuidv4(), name: "user:view_all", created_at: new Date() }, // 4 - View all user data
      { permission_uuid: uuidv4(), name: "user:update", created_at: new Date() }, // 5 - Update user data
      { permission_uuid: uuidv4(), name: "user:update_any", created_at: new Date() }, // 6 - Update any user data
      { permission_uuid: uuidv4(), name: "user:update_all", created_at: new Date() }, // 7 - Update any user data
      { permission_uuid: uuidv4(), name: "user:delete", created_at: new Date() }, // 8 - Delete own user
      { permission_uuid: uuidv4(), name: "user:delete_any", created_at: new Date() }, // 9 - Delete any user
      { permission_uuid: uuidv4(), name: "user:assign_role", created_at: new Date() }, // 10 - Assign user roles
      { permission_uuid: uuidv4(), name: "user:remove_role", created_at: new Date() }, // 11 - Remove user roles
      // File Module
      { permission_uuid: uuidv4(), name: "file:upload", created_at: new Date()}, // 12 - Upload a file
      { permission_uuid: uuidv4(), name: "file:view", created_at: new Date()}, // 13 - View own file
      { permission_uuid: uuidv4(), name: "file:view_any", created_at: new Date()}, // 14 - View any file
      { permission_uuid: uuidv4(), name: "file:view_all", created_at: new Date()}, // 15 - View all files
      { permission_uuid: uuidv4(), name: "file:update", created_at: new Date()}, // 16 - Update own file
      { permission_uuid: uuidv4(), name: "file:update_any", created_at: new Date()}, // 17 - Update any file
      { permission_uuid: uuidv4(), name: "file:delete", created_at: new Date()}, // 18 - Delete own file
      { permission_uuid: uuidv4(), name: "file:delete_any", created_at: new Date() }, // 19 - Delete any file
      { permission_uuid: uuidv4(), name: "file:download", created_at: new Date() }, // 20 - Download own file
      { permission_uuid: uuidv4(), name: "file:download_any", created_at: new Date() }, // 21 - Download any file
      // Role Module
      { permission_uuid: uuidv4(), name: "role:view", created_at: new Date()}, // 22 - View roles
      { permission_uuid: uuidv4(), name: "role:create", created_at: new Date()}, // 23 - Create new role
      { permission_uuid: uuidv4(), name: "role:update", created_at: new Date()}, // 24 - Update role
      { permission_uuid: uuidv4(), name: "role:delete", created_at: new Date()}, // 25 - Delete role
      // Permission Module
      { permission_uuid: uuidv4(), name: "permission:view", created_at: new Date()}, // 26 - View permissions
      { permission_uuid: uuidv4(), name: "permission:create", created_at: new Date()}, // 27 - Create new permission
      { permission_uuid: uuidv4(), name: "permission:update", created_at: new Date()}, // 28 - Update permission
      { permission_uuid: uuidv4(), name: "permission:delete", created_at: new Date()}, // 29 - Delete permission
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("permissions", null);
  },
};
