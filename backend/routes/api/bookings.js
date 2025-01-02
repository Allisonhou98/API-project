const express = require('express');
const { Booking, Spot, SpotImage } = require('../../db/models'); // Adjust the path based on your project structure
const { requireAuth } = require('../../utils/auth'); // Middleware for authentication
const router = express.Router();
const { Op } = require('sequelize'); // For query filtering

// Get all of the Current User's Bookings
router.get('/current', requireAuth, async (req, res) => {
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
              attributes: ['imageURL'],
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
        spot && spot.SpotImages.length > 0 ? spot.SpotImages[0].imageURL : null;

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



  // Edit a Booking
router.put('/:id', requireAuth, async (req, res) => {
    const { id: bookingId } = req.params;
    const { startDate, endDate } = req.body;
  
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
      // Check if the booking exists
      const booking = await Booking.findByPk(bookingId);
  
      if (!booking) {
        return res.status(404).json({ message: "Booking couldn't be found" });
      }
  
      // Check if the current user owns the booking
      if (booking.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
  
      // Check if the booking's end date is in the past
      if (new Date(booking.endDate) < new Date()) {
        return res.status(403).json({ message: "Past bookings can't be modified" });
      }
  
      // Check for booking conflicts
      const conflictingBookings = await Booking.findAll({
        where: {
          spotId: booking.spotId,
          id: { [Op.ne]: booking.id }, // Exclude the current booking
          [Op.or]: [
            {
              startDate: {
                [Op.between]: [startDate, endDate],
              },
            },
            {
              endDate: {
                [Op.between]: [startDate, endDate],
              },
            },
            {
              startDate: {
                [Op.lte]: startDate,
              },
              endDate: {
                [Op.gte]: endDate,
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
  
      // Update the booking
      await booking.update({ startDate, endDate });
  
      // Respond with the updated booking
      return res.status(200).json(booking);
    } catch (error) {
      console.error('Error updating booking:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  
  // Delete a Booking
router.delete('/:id', requireAuth, async (req, res) => {
    const { id: bookingId } = req.params;
  
    try {
      // Find the booking by ID
      const booking = await Booking.findByPk(bookingId, {
        include: {
          model: Spot,
          attributes: ['ownerId'], // Include the Spot's owner ID
        },
      });
  
      if (!booking) {
        return res.status(404).json({ message: "Booking couldn't be found" });
      }
  
      // Check if the booking has already started
      if (new Date(booking.startDate) <= new Date()) {
        return res.status(403).json({
          message: "Bookings that have been started can't be deleted",
        });
      }
  
      // Check if the current user owns the booking or the spot
      if (booking.userId !== req.user.id && booking.Spot.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
  
      // Delete the booking
      await booking.destroy();
  
      return res.status(200).json({ message: 'Successfully deleted' });
    } catch (error) {
      console.error('Error deleting booking:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

module.exports = router;
