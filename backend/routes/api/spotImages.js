const express = require('express');
const { SpotImage, Spot } = require('../../db/models'); // Adjust the path based on your project structure
const { restoreUser } = require('../../utils/auth'); // Middleware for authentication
const router = express.Router();

// Delete a Spot Image
router.delete('/:imageId', restoreUser, async (req, res) => {
  const { imageId } = req.params;

  try {
    // Find the spot image by ID
    const spotImage = await SpotImage.findByPk(imageId, {
      include: {
        model: Spot,
        attributes: ['ownerId'], // Include the Spot's owner ID
      },
    });

    if (!spotImage) {
      return res.status(404).json({ message: "Spot Image couldn't be found" });
    }

    // Check if the current user owns the spot
    if (spotImage.Spot.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Delete the spot image
    await spotImage.destroy();

    return res.status(200).json({ message: 'Successfully deleted' });
  } catch (error) {
    console.error('Error deleting spot image:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
