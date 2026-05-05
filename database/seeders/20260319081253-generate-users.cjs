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
    const now = new Date();
    await queryInterface.bulkInsert("users", [
      {
        user_uuid: uuidv4(),
        first_name: "Ian",
        last_name: "Dudley",
        email: "iandudley012@gmail.com",
        password: "$argon2id$v=19$m=4096,t=3,p=1$ofLDP+MutVCEU6MKDrOF/w$DozS3SrV/docLCNQvdtJhbJEN9r9ltVqv34p7WGHROc",
        salt: "a1f2c33fe32eb5508453a30a0eb385ff",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_uuid: uuidv4(),
        first_name: "spn",
        last_name: "part2",
        email: "spnpart2@gmail.com",
        password: "$argon2id$v=19$m=4096,t=3,p=1$ofLDP+MutVCEU6MKDrOF/w$DozS3SrV/docLCNQvdtJhbJEN9r9ltVqv34p7WGHROc",
        salt: "a1f2c33fe32eb5508453a30a0eb385ff",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_uuid: uuidv4(),
        first_name: "John",
        last_name: "Adams",
        email: "johnadams@email.com",
        password: "$argon2id$v=19$m=4096,t=3,p=1$ofLDP+MutVCEU6MKDrOF/w$DozS3SrV/docLCNQvdtJhbJEN9r9ltVqv34p7WGHROc",
        salt: "a1f2c33fe32eb5508453a30a0eb385ff",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_uuid: uuidv4(),
        first_name: "Hugh",
        last_name: "Campbell",
        email: "hughcampbell@email.com",
        password: "$argon2id$v=19$m=4096,t=3,p=1$ofLDP+MutVCEU6MKDrOF/w$DozS3SrV/docLCNQvdtJhbJEN9r9ltVqv34p7WGHROc",
        salt: "a1f2c33fe32eb5508453a30a0eb385ff",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        user_uuid: uuidv4(),
        first_name: "Lone",
        last_name: "Hermit",
        email: "lonehermimt03@gmail.com",
        password: "$argon2id$v=19$m=4096,t=3,p=1$ofLDP+MutVCEU6MKDrOF/w$DozS3SrV/docLCNQvdtJhbJEN9r9ltVqv34p7WGHROc",
        salt: "a1f2c33fe32eb5508453a30a0eb385ff",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("users", null, {});
  },
};
