const express = require('express');
const bcrypt = require('bcryptjs');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

// backend/routes/api/users.js
// ...
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
// ...

const router = express.Router();

// backend/routes/api/users.js
// ...

// Sign up
router.post(
    '/',
    async (req, res) => {
      const { firstName, lastName, email, username, password } = req.body;
  
        // Validate the request body
      const errors = {};
      if (!firstName) errors.firstName = 'First Name is required';
      if (!lastName) errors.lastName = 'Last Name is required';
      if (!email) errors.email = 'Email is required';
      if (!username) errors.username = 'Username is required';
      if (!password) errors.password = 'Password is required';

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          message: 'Bad Request',
          errors,
        });
      }

      try {

        // Check if the user already exists
        const existingUser = await User.findOne({
          where: {
            [User.sequelize.Op.or]: [{ email }, { username }],
          },
        });

        if (existingUser) {
          const duplicateErrors = {};
          if (existingUser.email === email) duplicateErrors.email = 'User with that email already exists';
          if (existingUser.username === username) duplicateErrors.username = 'User with that username already exists';

          return res.status(500).json({
            message: 'User already exists',
            errors: duplicateErrors,
          });
        }


        const hashedPassword = bcrypt.hashSync(password);
        const user = await User.create({ firstName, lastName, email, username, hashpassword: hashedPassword });

        const safeUser = {
          id: user.id,
          firstname: user.firstName,
          lastname: user.lastName,
          email: user.email,
          username: user.username,
        };
    
        await setTokenCookie(res, safeUser);
    
        return res.json({
          user: safeUser
        });
      } catch (error) {
        console.error('Error during sign up:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    }
  );

  // backend/routes/api/users.js
// ...

// backend/routes/api/users.js
// ...
const validateSignup = [
    check('email')
      .exists({ checkFalsy: true })
      .isEmail()
      .withMessage('Please provide a valid email.'),
    check('username')
      .exists({ checkFalsy: true })
      .isLength({ min: 4 })
      .withMessage('Please provide a username with at least 4 characters.'),
    check('username')
      .not()
      .isEmail()
      .withMessage('Username cannot be an email.'),
    check('password')
      .exists({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('Password must be 6 characters or more.'),
    handleValidationErrors
  ];

  // backend/routes/api/users.js
// ...

// Sign up
router.post(
    '/',
    validateSignup,
    async (req, res) => {
      const { email, password, username } = req.body;
      const hashedPassword = bcrypt.hashSync(password);
      const user = await User.create({ email, username, hashedPassword });
  
      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
      };
  
      await setTokenCookie(res, safeUser);
  
      return res.json({
        user: safeUser
      });
    }
  );
module.exports = router;