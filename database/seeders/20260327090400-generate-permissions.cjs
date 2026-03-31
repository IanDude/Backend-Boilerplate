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
      { name: "user:create", created_at: new Date() }, // 1
      { name: "user:view", created_at: new Date() }, // 2
      { name: "user:view_any", created_at: new Date()}, // 3
      { name: "user:view_all", created_at: new Date() }, // 4
      { name: "user:update", created_at: new Date() }, // 5
      { name: "user:update_any", created_at: new Date() }, // 6
      { name: "user:delete", created_at: new Date() }, // 7
      { name: "user:delete_any", created_at: new Date() }, // 8
      // { name: "user:manage_roles", created_at: new Date() }, // 9
      // { name: "user:manage_permissions", created_at: new Date()} //10
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
