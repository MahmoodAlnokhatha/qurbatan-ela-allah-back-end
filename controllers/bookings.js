const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Vehicle = require('../models/vehicle');
const verifyToken = require('../middleware/verify-token');
const dayjs = require('dayjs');
const webpush = require('web-push');
const PushSub = require('../models/pushSub');

const notifyBookingStatus = async (booking) => {
  const subs = await PushSub.find({ user: booking.requester });

  const payload = JSON.stringify({
    title: 'Booking update',
    body: `Your booking is ${booking.status}.`,
    url: '/bookings'             // where to open on click (adjust if needed)
  });

  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: s.keys },
        payload
      );
    } catch (err) {
      // cleanup expired/invalid subs
      if (err.statusCode === 410 || err.statusCode === 404) {
        try { await s.deleteOne(); } catch (_) {}
      }
    }
  }
};

router.post('/', verifyToken, async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.body;

    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({ err: 'All fields are required.' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ err: 'Vehicle not found.' });

    const vehicleStart = dayjs(vehicle.availability.startDate);
    const vehicleEnd = dayjs(vehicle.availability.endDate);
    const requestStart = dayjs(startDate);
    const requestEnd = dayjs(endDate);

    if (
      requestStart.isBefore(vehicleStart) ||
      requestEnd.isAfter(vehicleEnd) ||
      requestStart.isAfter(requestEnd)
    ) {
      return res.status(400).json({ err: 'Invalid booking dates.' });
    }

    const existingBookings = await Booking.find({
      vehicle: vehicleId,
      status: 'approved',
      $or: [
        { startDate: { $lte: requestEnd }, endDate: { $gte: requestStart } }
      ]
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({ err: 'Vehicle is already booked during this period.' });
    }

    const booking = await Booking.create({
      vehicle: vehicleId,
      requester: req.user._id,
      startDate,
      endDate,
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get('/my', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ requester: req.user._id }).populate('vehicle');
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get('/owner', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: 'vehicle',
        match: { owner: req.user._id },
      })
      .populate('requester');

    const ownerBookings = bookings.filter(b => b.vehicle !== null);

    res.status(200).json(ownerBookings);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ err: 'Status must be approved or rejected.' });
    }

    const booking = await Booking.findById(req.params.id).populate('vehicle');
    if (!booking) return res.status(404).json({ err: 'Booking not found.' });

    if (booking.vehicle.owner.toString() !== req.user._id) {
      return res.status(403).json({ err: 'Only the vehicle owner can change the status.' });
    }

    if (status === 'approved') {
      const overlap = await Booking.findOne({
        vehicle: booking.vehicle._id,
        status: 'approved',
        _id: { $ne: booking._id },
        $or: [
          { startDate: { $lte: booking.endDate }, endDate: { $gte: booking.startDate } }
        ]
      });
      if (overlap) {
        return res.status(400).json({ err: 'Vehicle already approved for an overlapping period.' });
      }
    }

    booking.status = status;
    await booking.save();

    notifyBookingStatus(booking).catch(e =>
      console.error('Push notify failed:', e.message)
    );

    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
