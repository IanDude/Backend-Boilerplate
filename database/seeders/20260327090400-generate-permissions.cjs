"use strict";

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
      { name: "user:create", created_at: new Date() }, // 1 - Create new user
      { name: "user:view", created_at: new Date() }, // 2 - View own user data
      { name: "user:view_any", created_at: new Date()}, // 3 - View any user data
      { name: "user:view_all", created_at: new Date() }, // 4 - View all user data
      { name: "user:update", created_at: new Date() }, // 5 - Update user data
      { name: "user:update_any", created_at: new Date() }, // 6 - Update any user data
      { name: "user:delete", created_at: new Date() }, // 7 - Delete own user
      { name: "user:delete_any", created_at: new Date() }, // 8 - Delete any user
      { name: "user:assign_role", created_at: new Date() }, // 9 - Assign user roles
      { name: "user:remove_role", created_at: new Date() }, // 10 - Remove user roles
      // File Module
      { name: "file:upload", created_at: new Date()}, // 11 - Upload a file
      { name: "file:view", created_at: new Date()}, // 12 - View own file
      { name: "file:view_any", created_at: new Date()}, // 13 - View any file
      { name: "file:view_all", created_at: new Date()}, // 14 - View all files
      { name: "file:update", created_at: new Date()}, // 15 - Update own file
      { name: "file:update_any", created_at: new Date()}, // 16 - Update any file
      { name: "file:delete", created_at: new Date()}, // 17 - Delete own file
      { name: "file:delete_any", created_at: new Date() }, // 18 - Delete any file
      { name: "file:download", created_at: new Date() }, // 19 - Download own file
      { name: "file:download_any", created_at: new Date() }, // 20 - Download any file
      
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
