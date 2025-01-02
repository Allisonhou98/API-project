const express = require('express');
const { ReviewImage, Review } = require('../../db/models'); // Adjust the path based on your project structure
const { restoreUser } = require('../../utils/auth'); // Middleware for authentication
const router = express.Router();

// Delete a Review Image
router.delete('/:reviewId', restoreUser, async (req, res) => {
  const { reviewId } = req.params;

  try {
    // Find the review image by ID
    const reviewImage = await ReviewImage.findByPk(reviewId, {
      include: {
        model: Review,
        attributes: ['userId'], // Include the Review's user ID
      },
    });

    if (!reviewImage) {
      return res.status(404).json({ message: "Review Image couldn't be found" });
    }

    // Check if the current user owns the review
    if (reviewImage.Review.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete the review image
    await reviewImage.destroy();

    return res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error('Error deleting review image:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
