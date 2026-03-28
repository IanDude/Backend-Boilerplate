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
    await queryInterface.bulkInsert("user_roles", [
      { user_id: 1, role_id: 1, created_at: new Date() },
      { user_id: 2, role_id: 2, created_at: new Date() },
      { user_id: 3, role_id: 2, created_at: new Date() },
      { user_id: 4, role_id: 3, created_at: new Date() },
      { user_id: 5, role_id: 3, created_at: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
