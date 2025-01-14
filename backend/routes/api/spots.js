const express = require('express');
const { User, Spot, Review, SpotImage, ReviewImage, Booking } = require('../../db/models'); // Adjust the path based on your project structure
const { requireAuth } = require('../../utils/auth'); // Middleware for authentication
const { Op } = require('sequelize'); // For query filtering

const router = express.Router();

// Get all Spots
router.get('/', async (req, res) => {

    const {
        page = 1,
        size = 20,
        minLat,
        maxLat,
        minLng,
        maxLng,
        minPrice,
        maxPrice,
      } = req.query;
    
      const errors = {};
      const filters = {};
    
      // Validate and set page and size
      const validatedPage = parseInt(page, 10);
      const validatedSize = parseInt(size, 10);

      if (isNaN(validatedPage) || validatedPage < 1) {
        errors.page = 'Page must be greater than or equal to 1';
      }
      if (isNaN(validatedSize) || validatedSize < 1 || validatedSize > 20) {
        errors.size = 'Size must be between 1 and 20';
      }
    
    // Validate and set filters for latitude and longitude
    if (minLat && isNaN(parseFloat(minLat))) {
    errors.minLat = 'Minimum latitude is invalid';
    } else if (minLat) {
    filters.lat = { ...filters.lat, [Op.gte]: parseFloat(minLat) };
    }
    if (maxLat && isNaN(parseFloat(maxLat))) {
    errors.maxLat = 'Maximum latitude is invalid';
    } else if (maxLat) {
    filters.lat = { ...filters.lat, [Op.lte]: parseFloat(maxLat) };
    }
    if (minLng && isNaN(parseFloat(minLng))) {
    errors.minLng = 'Minimum longitude is invalid';
    } else if (minLng) {
    filters.lng = { ...filters.lng, [Op.gte]: parseFloat(minLng) };
    }
    if (maxLng && isNaN(parseFloat(maxLng))) {
    errors.maxLng = 'Maximum longitude is invalid';
    } else if (maxLng) {
    filters.lng = { ...filters.lng, [Op.lte]: parseFloat(maxLng) };
    }

    // Validate and set filters for price
    if (minPrice && (isNaN(parseFloat(minPrice)) || parseFloat(minPrice) < 0)) {
    errors.minPrice = 'Minimum price must be greater than or equal to 0';
    } else if (minPrice) {
    filters.price = { ...filters.price, [Op.gte]: parseFloat(minPrice) };
    }
    if (maxPrice && (isNaN(parseFloat(maxPrice)) || parseFloat(maxPrice) < 0)) {
    errors.maxPrice = 'Maximum price must be greater than or equal to 0';
    } else if (maxPrice) {
    filters.price = { ...filters.price, [Op.lte]: parseFloat(maxPrice) };
    }

    // If there are validation errors, respond with a 400 error
    if (Object.keys(errors).length > 0) {
    return res.status(400).json({
        message: 'Bad Request',
        errors,
    });
    }

    try {
      // Fetch all spots
      const spots = await Spot.findAll({
        where: filters,
        limit: validatedSize,
        offset: (validatedPage - 1) * validatedSize,
        include: [
          {
            model: Review,
            attributes: ['stars'],
          },
          {
            model: SpotImage,
            attributes: ['imageURL', 'previewImage'],
            where: { previewImage: true },
            required: false,
          },
        ],
      });
  
      // Transform the spots data to include avgRating and previewImage
      const formattedSpots = spots.map((spot) => {
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
      return res.status(200).json({
        Spots: formattedSpots,
        page: validatedPage,
        size: validatedSize,
      });
    } catch (error) {
      console.error('Error fetching spots:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  
  // Get all Spots owned by the Current User
  router.get('/current', requireAuth, async (req, res) => {
      try {
        ;
        const userId = req.user.id; // Assumes `req.user` is populated by the `requireAuth` middleware
    
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
              attributes: ['imageURL', 'previewImage'],
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
            ? spot.SpotImages[0].imageURL
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
              attributes: ['id', ['imageURL', 'url'], ['previewImage', 'preview']],
            },
            {
              model: User,
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
          Owner: spot.User,
        };
    
        console.log(spotDetails)
        return res.status(200).json(spotDetails);
      } catch (error) {
        console.error('Error fetching spot details:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });
    
  // Create a Spot
  router.post('/', requireAuth, async (req, res) => {
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
          ownerId: req.user.id, // Assumes `requireAuth` populates `req.user`
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
  
  
  
    // Add an Image to a Spot based on the Spot's id
  router.post('/:id/images', requireAuth, async (req, res) => {
      const { id: spotId } = req.params;
      const { url, preview } = req.body;
    
      try {
        // Fetch the spot by ID
        const spot = await Spot.findByPk(spotId);
    
        // If the spot doesn't exist
        if (!spot) {
          return res.status(404).json({ message: "Spot couldn't be found" });
        }
    
        // Check if the current user owns the spot
        if (spot.ownerId !== req.user.id) {
          return res.status(403).json({ message: 'Forbidden' });
        }
    
        // Create the new image for the spot
        const spotImage = await SpotImage.create({
          spotId: spot.id,
          imageURL: url,
          previewImage: preview,
        });
    
        // Respond with the newly created image
        return res.status(201).json({
          id: spotImage.id,
          url: spotImage.imageURL,
          preview: spotImage.previewImage,
        });
      } catch (error) {
        console.error('Error adding image to spot:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });
  
  // Edit a Spot
  router.put('/:id', requireAuth, async (req, res) => {
      const { id: spotId } = req.params;
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
        // Fetch the spot by ID
        const spot = await Spot.findByPk(spotId);
    
        // If the spot doesn't exist
        if (!spot) {
          return res.status(404).json({ message: "Spot couldn't be found" });
        }
    
        // Check if the current user owns the spot
        if (spot.ownerId !== req.user.id) {
          return res.status(403).json({ message: 'Forbidden' });
        }
    
        // Update the spot with new data
        await spot.update({
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
    
        // Respond with the updated spot
        return res.status(200).json(spot);
      } catch (error) {
        console.error('Error updating spot:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });
    
  
    // Delete a Spot
  router.delete('/:id', requireAuth, async (req, res) => {
      const { id: spotId } = req.params;
    
      try {
        // Fetch the spot by ID
        const spot = await Spot.findByPk(spotId);
    
        // If the spot doesn't exist
        if (!spot) {
          return res.status(404).json({ message: "Spot couldn't be found" });
        }
    
        // Check if the current user owns the spot
        if (spot.ownerId !== req.user.id) {
          return res.status(403).json({ message: 'Forbidden' });
        }
    
        // Delete the spot
        await spot.destroy();
    
        // Respond with a success message
        return res.status(200).json({ message: 'Successfully deleted' });
      } catch (error) {
        console.error('Error deleting spot:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    // Create a Review for a Spot based on the Spot's id
    router.post('/:spotId/reviews', requireAuth, async (req, res) => {
      const { spotId } = req.params;
      const { review, stars } = req.body;
      const userId = req.user.id;
    
      const errors = {};
    
      // Validate request body
      if (!review) errors.review = 'Review text is required';
      if (!stars || stars < 1 || stars > 5) errors.stars = 'Stars must be an integer from 1 to 5';
    
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          message: 'Bad Request',
          errors,
        });
      }
    
      try {
        // Check if the spot exists
        const spot = await Spot.findByPk(spotId);
    
        if (!spot) {
          return res.status(404).json({ message: "Spot couldn't be found" });
        }
    
        // Check if the user already has a review for this spot
        const existingReview = await Review.findOne({
          where: {
            userId,
            spotId,
          },
        });
    
        if (existingReview) {
          return res.status(500).json({
            message: 'User already has a review for this spot',
          });
        }
    
        // Create the review
        const newReview = await Review.create({
          userId,
          spotId,
          review,
          stars,
        });
    
        // Respond with the newly created review
        return res.status(201).json(newReview);
      } catch (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    // Get all Reviews by a Spot's id
    router.get('/:spotId/reviews', async (req, res) => {
      const { spotId } = req.params;
    
      try {
        // Check if the spot exists
        const spot = await Spot.findByPk(spotId);
    
        if (!spot) {
          return res.status(404).json({ message: "Spot couldn't be found" });
        }
    
        // Fetch all reviews for the spot
        const reviews = await Review.findAll({
          where: { spotId },
          include: [
            {
              model: User,
              attributes: ['id', 'firstName', 'lastName'],
            },
            {
              model: ReviewImage,
              attributes: ['id', 'imageURL'],
            },
          ],
        });
    
        // Respond with the reviews
        return res.status(200).json({ Reviews: reviews });
      } catch (error) {
        console.error('Error fetching reviews by spot ID:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });
    

    // Get all Bookings for a Spot based on the Spot's id
    router.get('/:spotId/bookings', requireAuth, async (req, res) => {
        const { spotId } = req.params;
      
        try {
          // Check if the spot exists
          const spot = await Spot.findByPk(spotId);
      
          if (!spot) {
            return res.status(404).json({ message: "Spot couldn't be found" });
          }
      
          // Check if the current user is the owner of the spot
          const isOwner = spot.ownerId === req.user.id;
      
          const bookings = await Booking.findAll({
            where: { spotId },
            include: isOwner
              ? [
                  {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName'],
                  },
                ]
              : [],
          });
      
          if (isOwner) {
            return res.status(200).json({
              Bookings: bookings.map((booking) => ({
                User: booking.User,
                id: booking.id,
                spotId: booking.spotId,
                userId: booking.userId,
                startDate: booking.startDate,
                endDate: booking.endDate,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
              })),
            });
          } else {
            return res.status(200).json({
              Bookings: bookings.map((booking) => ({
                spotId: booking.spotId,
                startDate: booking.startDate,
                endDate: booking.endDate,
              })),
            });
          }
        } catch (error) {
          console.error('Error fetching bookings for spot:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
      });


      // Create a Booking from a Spot based on the Spot's id
router.post('/:spotId/bookings', requireAuth, async (req, res) => {
    const { spotId } = req.params;
    const { startDate, endDate } = req.body;
    const userId = req.user.id;
  
    let newstartDate = new Date(startDate).toISOString();
    let newendDate = new Date(endDate).toISOString();

    const errors = {};
  
    // Validate dates
    if (!startDate) errors.startDate = 'startDate is required';
    if (!endDate) errors.endDate = 'endDate is required';
    if (new Date(startDate) < new Date()) errors.startDate = 'startDate cannot be in the past';
    if (new Date(endDate) <= new Date(startDate)) {
      errors.endDate = 'endDate cannot be on or before startDate';
    }
  
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Bad Request',
        errors,
      });
    }
  
    try {
      // Check if the spot exists
      const spot = await Spot.findByPk(spotId);
  
      if (!spot) {
        return res.status(404).json({ message: "Spot couldn't be found" });
      }
  
      // Ensure the current user is not the owner of the spot
      if (spot.ownerId === userId) {
        return res.status(403).json({ message: 'Forbidden: Cannot book your own spot' });
      }
      

      // Check for booking conflicts
      const conflictingBookings = await Booking.findAll({
        where: {
          spotId,
          [Op.or]: [
            {
              startDate: {
                [Op.between]: [newstartDate, newendDate],
              },
            },
            {
              endDate: {
                [Op.between]: [newstartDate, newendDate],
              },
            },
            {
              startDate: {
                [Op.lte]: newstartDate,
              },
              endDate: {
                [Op.gte]: newendDate,
              },
            },
          ],
        },
      });
      
      console.log(conflictingBookings.length)

      if (conflictingBookings.length > 0) {
        let startDateConflict = false;
        let endDateConflict = false;
        conflictingBookings.forEach((booking) => {
          //console.log(booking.startDate)
          console.log(booking.endDate)
          console.log(newstartDate)
          //console.log(newendDate)
          console.log(newstartDate<=new Date(booking.endDate).toISOString())
          if (
            newstartDate >=  new Date(booking.startDate).toISOString() &&
            newstartDate <= new Date(booking.endDate).toISOString()
          ) {
            startDateConflict = true;
          }
          if (
            newendDate >= new Date(booking.startDate).toISOString() &&
            newendDate <= new Date(booking.endDate).toISOString()
          ) {
            endDateConflict = true;
          }
          if (
            newstartDate <= new Date(booking.startDate).toISOString()  &&
            newendDate >= new Date(booking.endDate).toISOString()
          ) {
            startDateConflict = true;
            endDateConflict = true;
          }
        });
      
        const errors = {};
        //errors.message = 'Sorry, this spot is already booked for the specified dates';

        if (startDateConflict) {
          console.log('hey')
          errors.startDate = 'Start date conflicts with an existing booking';
        }
        if (endDateConflict) {
          errors.endDate = 'End date conflicts with an existing booking';
        }
      
        return res.status(403).json({
          message: 'Sorry, this spot is already booked for the specified dates',
          errors,
          title: 'Booking Conflict'
        });
      }
  
      // Create the booking
      const newBooking = await Booking.create({
        spotId: parseInt(spotId),
        userId,
        startDate,
        endDate,
      });

      console.log(newBooking)
      // Respond with the newly created booking
      return res.status(201).json(newBooking);
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
    
module.exports = router;
