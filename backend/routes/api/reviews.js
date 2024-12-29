const express = require('express');
const { Review, User, Spot, SpotImage, ReviewImage } = require('../../db/models'); // Adjust the path based on your project structure
const { restoreUser } = require('../../utils/auth'); // Middleware for authentication
const router = express.Router();

// Get all Reviews of the Current User
router.get('/session/reviews', restoreUser, async (req, res) => {
  const userId = req.user.id; // Assumes restoreUser middleware populates req.user.id

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
              attributes: ['url'],
              where: { previewImage: true },
              required: false, // Optional preview image
            },
          ],
        },
        {
          model: ReviewImage,
          attributes: ['id', 'url'],
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

module.exports = router;
