'use strict';

const { User } = require('../models');
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await User.bulkCreate([
      {
        firstName: 'demo',
        lastName: 'user',
        email: 'demo@user.io',
        username: 'Demo-lition',
        hashpassword: bcrypt.hashSync('password'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'user',
        lastName: 'FakeUser1',
        email: 'user1@user.io',
        username: 'FakeUser1',
        hashpassword: bcrypt.hashSync('password2'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'user2',
        lastName: 'FakeUser2',
        email: 'user2@user.io',
        username: 'FakeUser2',
        hashpassword: bcrypt.hashSync('password3'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { validate: true });
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Users';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ['Demo-lition', 'FakeUser1', 'FakeUser2'] }
    }, {});
  }
};