const express = require('express');
const { Booking, Spot, SpotImage } = require('../../db/models'); // Adjust the path based on your project structure
const { restoreUser } = require('../../utils/auth'); // Middleware for authentication
const router = express.Router();

// Get all of the Current User's Bookings
router.get('/session/bookings', restoreUser, async (req, res) => {
  const userId = req.user.id;

  try {
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
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
      ],
    });

    // Format response to include `previewImage`
    const formattedBookings = bookings.map((booking) => {
      const spot = booking.Spot;
      const previewImage =
        spot && spot.SpotImages.length > 0 ? spot.SpotImages[0].url : null;

      return {
        id: booking.id,
        spotId: booking.spotId,
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
        userId: booking.userId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      };
    });

    return res.status(200).json({ Bookings: formattedBookings });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all Bookings for a Spot based on the Spot's id
router.get('/spots/:spotId/bookings', restoreUser, async (req, res) => {
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

module.exports = router;
