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
    await queryInterface.bulkInsert("role_permissions", [
      // Admin (role_id = 1) Permissions
      { role_id: 1, permission_id: 1 }, 
      { role_id: 1, permission_id: 2 },
      { role_id: 1, permission_id: 3 },
      { role_id: 1, permission_id: 4 },
      { role_id: 1, permission_id: 5 },
      { role_id: 1, permission_id: 6 },
      { role_id: 1, permission_id: 7 },
      { role_id: 1, permission_id: 8 },
      { role_id: 1, permission_id: 9 },
      { role_id: 1, permission_id: 10 },
      { role_id: 1, permission_id: 11 },
      { role_id: 1, permission_id: 12 },
      { role_id: 1, permission_id: 13 },
      { role_id: 1, permission_id: 14 },
      { role_id: 1, permission_id: 15 },
      { role_id: 1, permission_id: 16 },
      { role_id: 1, permission_id: 17 },
      { role_id: 1, permission_id: 18 },
      { role_id: 1, permission_id: 19 },
      { role_id: 1, permission_id: 20 },
      // Moderator (role_id = 2) Permissions
      { role_id: 2, permission_id: 2 }, // View own user data
      { role_id: 2, permission_id: 3 }, // View any user data
      { role_id: 2, permission_id: 4 }, // View all user data
      { role_id: 2, permission_id: 5 }, // Update own user data
      { role_id: 2, permission_id: 6 }, // Update any user data
      { role_id: 2, permission_id: 7 }, // Delete own user
      // { role_id: 2, permission_id: 9 },
      // { role_id: 2, permission_id: 10 },
      { role_id: 2, permission_id: 11 }, // Upload a file
      { role_id: 2, permission_id: 12 }, // View own file
      { role_id: 2, permission_id: 13 }, // View any file
      { role_id: 2, permission_id: 14 }, // View all files
      { role_id: 2, permission_id: 15 }, // Update own file
      { role_id: 2, permission_id: 16 }, // Update any file
      { role_id: 2, permission_id: 17 }, // Delete own file
      { role_id: 2, permission_id: 18 }, // Delete any file
      { role_id: 2, permission_id: 19 }, // Download own file
      // User (role_id = 3) Permissions
      { role_id: 3, permission_id: 2 }, // View own user data
      { role_id: 3, permission_id: 5 }, // Update own user data
      { role_id: 3, permission_id: 7 }, // Delete own user
      { role_id: 3, permission_id: 11 }, // Upload a file
      { role_id: 3, permission_id: 12 }, // View own file
      { role_id: 3, permission_id: 15 }, // Update own file
      { role_id: 3, permission_id: 17 }, // Delete own file
      { role_id: 3, permission_id: 19 }, // Download own file
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("role_permissions", null);
  },
};
