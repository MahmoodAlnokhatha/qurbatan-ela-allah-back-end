const express = require('express');
const router = express.Router();
const multer = require('multer');
const validateImageType = require('validate-image-type');
const dayjs = require('dayjs');


const Vehicle = require('../models/vehicle');
const Booking = require('../models/booking');
const verifyToken = require('../middleware/verify-token');
const cloudinary = require('../config/cloudinary');

// Setup multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET /vehicles - Public: Available vehicles only
router.get('/', async (req, res) => {
  try {
    const today = dayjs();
    const vehicles = await Vehicle.find({
      'availability.startDate': { $lte: today.toDate() },
      'availability.endDate': { $gte: today.toDate() }
    });

    const availableVehicles = [];

    for (let vehicle of vehicles) {
      const bookings = await Booking.find({ vehicle: vehicle._id });

      const bookedDates = new Set();
      bookings.forEach(booking => {
        let current = dayjs(booking.startDate);
        const end = dayjs(booking.endDate);
        while (current.isBefore(end.add(1, 'day'))) {
          bookedDates.add(current.format('YYYY-MM-DD'));
          current = current.add(1, 'day');
        }
      });

      const availableRange = [];
      let current = dayjs(vehicle.availability.startDate);
      const end = dayjs(vehicle.availability.endDate);
      while (current.isBefore(end.add(1, 'day'))) {
        availableRange.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
      }

      const remainingDates = availableRange.filter(date => !bookedDates.has(date));

      if (remainingDates.length > 0) {
        availableVehicles.push(vehicle);
      }
    }

    res.status(200).json(availableVehicles);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// GET /vehicles/my-vehicles - Get vehicles created by authenticated user
router.get('/my-vehicles', verifyToken, async (req, res) => {
  try {
    const myVehicles = await Vehicle.find({ owner: req.user._id });
    res.status(200).json(myVehicles);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// GET /vehicles/:vehicleId - Get single vehicle details
router.get('/:vehicleId', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ err: 'Vehicle not found' });
    res.status(200).json(vehicle);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// POST /vehicles - Create new vehicle
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { location, availability } = req.body;

    // Validate availability dates
    if (!availability || !availability.startDate || !availability.endDate) {
      return res.status(400).json({ err: 'Availability dates are required' });
    }

    if (!req.file) return res.status(400).json({ err: 'Image is required' });

    // Validate image file type
    const result = await validateImageType(req.file.buffer, {
      originalFilename: req.file.originalname
    });

    if (!result.ok) {
      return res.status(400).json({ err: 'Invalid image file' });
    }

    // Upload to Cloudinary
    const cloudUpload = await cloudinary.uploader.upload_stream(
      { folder: 'vehicles' },
      async (error, result) => {
        if (error) return res.status(500).json({ err: error.message });

        const newVehicle = await Vehicle.create({
          owner: req.user._id,
          imageUrl: result.secure_url,
          location,
          availability: {
            startDate: new Date(availability.startDate),
            endDate: new Date(availability.endDate)
          }
        });

        res.status(201).json(newVehicle);
      }
    );

    // pipe image data to cloudinary
    require('streamifier').createReadStream(req.file.buffer).pipe(cloudUpload);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// PUT /vehicles/:vehicleId - Update existing vehicle (must be owner)
router.put('/:vehicleId', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ err: 'Vehicle not found' });
    if (vehicle.owner.toString() !== req.user._id) {
      return res.status(403).json({ err: 'Forbidden' });
    }

    const { location, availability } = req.body;

    let updatedFields = {
      location: location || vehicle.location,
      availability: {
        startDate: availability?.startDate || vehicle.availability.startDate,
        endDate: availability?.endDate || vehicle.availability.endDate
      }
    };

    // If image is included, validate and re-upload
    if (req.file) {
      const result = await validateImageType(req.file.buffer, {
        originalFilename: req.file.originalname
      });

      if (!result.ok) return res.status(400).json({ err: 'Invalid image file' });

      const cloudUpload = await cloudinary.uploader.upload_stream(
        { folder: 'vehicles' },
        async (error, result) => {
          if (error) return res.status(500).json({ err: error.message });

          updatedFields.imageUrl = result.secure_url;
          const updated = await Vehicle.findByIdAndUpdate(vehicle._id, updatedFields, { new: true });
          res.status(200).json(updated);
        }
      );

      require('streamifier').createReadStream(req.file.buffer).pipe(cloudUpload);
    } else {
      const updated = await Vehicle.findByIdAndUpdate(vehicle._id, updatedFields, { new: true });
      res.status(200).json(updated);
    }
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// DELETE /vehicles/:vehicleId - Delete vehicle
router.delete('/:vehicleId', verifyToken, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ err: 'Vehicle not found' });
    if (vehicle.owner.toString() !== req.user._id) {
      return res.status(403).json({ err: 'Forbidden' });
    }

    await vehicle.deleteOne();
    res.status(200).json({ msg: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;