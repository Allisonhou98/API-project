const express = require('express');
const { Spot, Review, SpotImage } = require('../../../db/models'); // Adjust the path based on your project structure
const router = express.Router();

// Get all Spots
router.get('/', async (req, res) => {
  try {
    // Fetch all spots
    const spots = await Spot.findAll({
      include: [
        {
          model: Review,
          attributes: ['stars'],
        },
        {
          model: SpotImage,
          attributes: ['url', 'previewImage'],
          where: { previewImage: true },
          required: false,
        },
      ],
    });

    // Transform the spots data to include avgRating and previewImage
    const spotsWithDetails = spots.map((spot) => {
      // Calculate the average rating
      const avgRating =
        spot.Reviews.length > 0
          ? spot.Reviews.reduce((acc, review) => acc + review.stars, 0) /
            spot.Reviews.length
          : null;

      // Extract the preview image URL
      const previewImage = spot.SpotImages.length
        ? spot.SpotImages[0].url
        : null;

      return {
        id: spot.id,
        ownerId: spot.ownerId,
        address: spot.address,
        city: spot.city,
        state: spot.state,
        country: spot.country,
        lat: spot.lat,
        lng: spot.lng,
        name: spot.name,
        description: spot.description,
        price: spot.price,
        createdAt: spot.createdAt,
        updatedAt: spot.updatedAt,
        avgRating,
        previewImage,
      };
    });

    // Respond with the transformed data
    return res.status(200).json({ Spots: spotsWithDetails });
  } catch (error) {
    console.error('Error fetching spots:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Get all Spots owned by the Current User
router.get('/session/spots', restoreUser, async (req, res) => {
    try {
      const userId = req.user.id; // Assumes `req.user` is populated by the `restoreUser` middleware
  
      // Fetch all spots owned by the current user
      const spots = await Spot.findAll({
        where: { ownerId: userId },
        include: [
          {
            model: Review,
            attributes: ['stars'],
          },
          {
            model: SpotImage,
            attributes: ['url', 'previewImage'],
            where: { previewImage: true },
            required: false,
          },
        ],
      });
  
      // Transform the spots data to include avgRating and previewImage
      const spotsWithDetails = spots.map((spot) => {
        // Calculate the average rating
        const avgRating =
          spot.Reviews.length > 0
            ? spot.Reviews.reduce((acc, review) => acc + review.stars, 0) /
              spot.Reviews.length
            : null;
  
        // Extract the preview image URL
        const previewImage = spot.SpotImages.length
          ? spot.SpotImages[0].url
          : null;
  
        return {
          id: spot.id,
          ownerId: spot.ownerId,
          address: spot.address,
          city: spot.city,
          state: spot.state,
          country: spot.country,
          lat: spot.lat,
          lng: spot.lng,
          name: spot.name,
          description: spot.description,
          price: spot.price,
          createdAt: spot.createdAt,
          updatedAt: spot.updatedAt,
          avgRating,
          previewImage,
        };
      });
  
      // Respond with the transformed data
      return res.status(200).json({ Spots: spotsWithDetails });
    } catch (error) {
      console.error('Error fetching user-owned spots:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
// Get details of a Spot from an id
router.get('/:id', async (req, res) => {
    const spotId = req.params.id;
  
    try {
      // Fetch the spot with associated data
      const spot = await Spot.findByPk(spotId, {
        include: [
          {
            model: SpotImage,
            attributes: ['id', 'url', 'preview'],
          },
          {
            model: User,
            as: 'Owner',
            attributes: ['id', 'firstName', 'lastName'],
          },
          {
            model: Review,
            attributes: ['stars'],
          },
        ],
      });
  
      // If the spot doesn't exist
      if (!spot) {
        return res.status(404).json({ message: "Spot couldn't be found" });
      }
  
      // Calculate average star rating and number of reviews
      const reviews = spot.Reviews;
      const numReviews = reviews.length;
      const avgStarRating =
        reviews.length > 0
          ? reviews.reduce((acc, review) => acc + review.stars, 0) / reviews.length
          : null;
  
      // Transform the response
      const spotDetails = {
        id: spot.id,
        ownerId: spot.ownerId,
        address: spot.address,
        city: spot.city,
        state: spot.state,
        country: spot.country,
        lat: spot.lat,
        lng: spot.lng,
        name: spot.name,
        description: spot.description,
        price: spot.price,
        createdAt: spot.createdAt,
        updatedAt: spot.updatedAt,
        numReviews,
        avgStarRating,
        SpotImages: spot.SpotImages,
        Owner: spot.Owner,
      };
  
      return res.status(200).json(spotDetails);
    } catch (error) {
      console.error('Error fetching spot details:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
// Create a Spot
router.post('/', restoreUser, async (req, res) => {
    const {
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    } = req.body;
  
    const errors = {};
  
    // Validate the request body
    if (!address) errors.address = 'Street address is required';
    if (!city) errors.city = 'City is required';
    if (!state) errors.state = 'State is required';
    if (!country) errors.country = 'Country is required';
    if (!lat || lat < -90 || lat > 90)
      errors.lat = 'Latitude must be within -90 and 90';
    if (!lng || lng < -180 || lng > 180)
      errors.lng = 'Longitude must be within -180 and 180';
    if (!name || name.length > 50)
      errors.name = 'Name must be less than 50 characters';
    if (!description) errors.description = 'Description is required';
    if (!price || price <= 0)
      errors.price = 'Price per day must be a positive number';
  
    // If validation errors exist
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Bad Request',
        errors,
      });
    }
  
    try {
      // Create the spot
      const spot = await Spot.create({
        ownerId: req.user.id, // Assumes `restoreUser` populates `req.user`
        address,
        city,
        state,
        country,
        lat,
        lng,
        name,
        description,
        price,
      });
  
      return res.status(201).json({
        id: spot.id,
        ownerId: spot.ownerId,
        address: spot.address,
        city: spot.city,
        state: spot.state,
        country: spot.country,
        lat: spot.lat,
        lng: spot.lng,
        name: spot.name,
        description: spot.description,
        price: spot.price,
        createdAt: spot.createdAt,
        updatedAt: spot.updatedAt,
      });
    } catch (error) {
      console.error('Error creating spot:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

module.exports = router;
