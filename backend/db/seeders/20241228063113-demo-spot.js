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
    await queryInterface.bulkInsert('Spots', [
      {
        ownerId: 1, // Ensure User ID 1 exists
        address: '123 Main St',
        city: 'Los Angeles',
        state: 'California',
        country: 'USA',
        lat: 34.0522,
        lng: -118.2437,
        name: 'Cozy Cottage',
        description: 'A charming and cozy cottage in the heart of the city.',
        price: 150.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ownerId: 2, // Ensure User ID 2 exists
        address: '456 Elm St',
        city: 'San Francisco',
        state: 'California',
        country: 'USA',
        lat: 37.7749,
        lng: -122.4194,
        name: 'Luxury Apartment',
        description: 'An upscale apartment with a stunning view of the bay.',
        price: 300.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        ownerId: 3, // Ensure User ID 3 exists
        address: '789 Oak Ave',
        city: 'Seattle',
        state: 'Washington',
        country: 'USA',
        lat: 47.6062,
        lng: -122.3321,
        name: 'Urban Loft',
        description: 'A modern loft in the heart of downtown.',
        price: 200.00,
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
    await queryInterface.bulkDelete('Spots', null, {});
  }
};
