const express = require('express');
const { Review, User, Spot, SpotImage, ReviewImage } = require('../../db/models'); // Adjust the path based on your project structure
const { requireAuth } = require('../../utils/auth'); // Middleware for authentication
const router = express.Router();

// Get all Reviews of the Current User
router.get('/current', requireAuth, async (req, res) => {
  const userId = req.user.id; // Assumes requireAuth middleware populates req.user.id

  try {
    // Fetch all reviews written by the current user
    const reviews = await Review.findAll({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Spot,
          attributes: [
            'id',
            'ownerId',
            'address',
            'city',
            'state',
            'country',
            'lat',
            'lng',
            'name',
            'price',
          ],
          include: [
            {
              model: SpotImage,
              attributes: ['imageURL'],
              where: { previewImage: true },
              required: false, // Optional preview image
            },
          ],
        },
        {
          model: ReviewImage,
          attributes: ['id', 'imageURL'],
        },
      ],
    });

    // Format the response to include previewImage for Spots
    const formattedReviews = reviews.map((review) => {
      const spot = review.Spot;
      const previewImage =
        spot && spot.SpotImages.length > 0 ? spot.SpotImages[0].url : null;

      return {
        id: review.id,
        userId: review.userId,
        spotId: review.spotId,
        review: review.review,
        stars: review.stars,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        User: review.User,
        Spot: {
          id: spot.id,
          ownerId: spot.ownerId,
          address: spot.address,
          city: spot.city,
          state: spot.state,
          country: spot.country,
          lat: spot.lat,
          lng: spot.lng,
          name: spot.name,
          price: spot.price,
          previewImage,
        },
        ReviewImages: review.ReviewImages,
      };
    });

    // Respond with the formatted reviews
    return res.status(200).json({ Reviews: formattedReviews });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
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


// Add an Image to a Review based on the Review's id
router.post('/:id/images', requireAuth, async (req, res) => {
  const { id: reviewId } = req.params;
  const { url } = req.body;

  try {
    // Check if the review exists
    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }

    // Check if the current user owns the review
    if (review.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Check the number of images for the review
    const imageCount = await ReviewImage.count({ where: { reviewId } });

    if (imageCount >= 10) {
      return res.status(403).json({
        message: 'Maximum number of images for this resource was reached',
      });
    }

    // Create the review image
    const newReviewImage = await ReviewImage.create({
      reviewId,
      imageURL: url,
    });

    // Respond with the newly created review image
    return res.status(201).json({
      id: newReviewImage.id,
      url: newReviewImage.imageURL,
    });
  } catch (error) {
    console.error('Error adding image to review:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Edit a Review
router.put('/:id', requireAuth, async (req, res) => {
  const { id: reviewId } = req.params;
  const { review, stars } = req.body;

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
    // Check if the review exists
    const existingReview = await Review.findByPk(reviewId);

    if (!existingReview) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }

    // Check if the current user owns the review
    if (existingReview.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Update the review
    await existingReview.update({ review, stars });

    // Respond with the updated review
    return res.status(200).json(existingReview);
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Delete a Review
router.delete('/:id', requireAuth, async (req, res) => {
  const { id: reviewId } = req.params;

  try {
    // Check if the review exists
    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review couldn't be found" });
    }

    // Check if the current user owns the review
    if (review.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete the review
    await review.destroy();

    // Respond with a success message
    return res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Create a Booking from a Spot based on the Spot's id
router.post('/spots/:spotId/bookings', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const { startDate, endDate } = req.body;
  const userId = req.user.id;

  const errors = {};

  // Validate request body
  if (!startDate) errors.startDate = 'startDate is required';
  if (!endDate) errors.endDate = 'endDate is required';
  if (new Date(startDate) < new Date()) errors.startDate = 'startDate cannot be in the past';
  if (new Date(endDate) <= new Date(startDate))
    errors.endDate = 'endDate cannot be on or before startDate';

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
        [Booking.sequelize.Op.or]: [
          {
            startDate: {
              [Booking.sequelize.Op.between]: [startDate, endDate],
            },
          },
          {
            endDate: {
              [Booking.sequelize.Op.between]: [startDate, endDate],
            },
          },
          {
            startDate: {
              [Booking.sequelize.Op.lte]: startDate,
            },
            endDate: {
              [Booking.sequelize.Op.gte]: endDate,
            },
          },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
      return res.status(403).json({
        message: 'Sorry, this spot is already booked for the specified dates',
        errors: {
          startDate: 'Start date conflicts with an existing booking',
          endDate: 'End date conflicts with an existing booking',
        },
      });
    }

    // Create the booking
    const newBooking = await Booking.create({
      spotId,
      userId,
      startDate,
      endDate,
    });

    return res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
