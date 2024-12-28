'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('Bookings', [
      {
        spotId: 1, // Ensure Spot ID 1 exists
        userId: 2, // Ensure User ID 2 exists
        startDate: '2024-12-20',
        endDate: '2024-12-25',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        spotId: 2, // Ensure Spot ID 2 exists
        userId: 3, // Ensure User ID 3 exists
        startDate: '2024-12-26',
        endDate: '2024-12-30',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        spotId: 3, // Ensure Spot ID 3 exists
        userId: 1, // Ensure User ID 1 exists
        startDate: '2025-01-01',
        endDate: '2025-01-07',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Bookings', null, {});
  }
};
