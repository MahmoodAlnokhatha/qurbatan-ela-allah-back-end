const express = require('express');
const router = express.Router();
const multer = require('multer');
const { fileTypeFromBuffer } = require('file-type');
const dayjs = require('dayjs');

const Vehicle = require('../models/vehicle');
const Booking = require('../models/booking');
const verifyToken = require('../middleware/verify-token');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', async (req, res) => {
  try {
    const today = dayjs();
    const vehicles = await Vehicle.find().populate('owner', 'username');

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
    console.error('GET /vehicles error:', err);
    res.status(500).json({ err: err.message });
  }
});

router.get('/my-vehicles', verifyToken, async (req, res) => {
  try {
    const myVehicles = await Vehicle.find({ owner: req.user._id }).populate('owner', 'username');
    res.status(200).json(myVehicles);
  } catch (err) {
    console.error('GET /vehicles/my-vehicles error:', err);
    res.status(500).json({ err: err.message });
  }
});

router.get('/:vehicleId', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId).populate('owner', 'username');
    if (!vehicle) return res.status(404).json({ err: 'Vehicle not found' });
    res.status(200).json(vehicle);
  } catch (err) {
    console.error('GET /vehicles/:vehicleId error:', err);
    res.status(500).json({ err: err.message });
  }
});

router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const { location, availability } = req.body;

    if (!availability || !availability.startDate || !availability.endDate) {
      return res.status(400).json({ err: 'Availability dates are required' });
    }
    if (!req.file) return res.status(400).json({ err: 'Image is required' });

    const result = await fileTypeFromBuffer(req.file.buffer);
    if (!result || !['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(result.mime)) {
      return res.status(400).json({ err: 'Invalid image file' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'vehicles' },
      async (error, result) => {
        try {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ err: error.message });
          }

          // normalize to UTC midnight to avoid day shifts
          const startISO = dayjs(availability.startDate).format('YYYY-MM-DD');
          const endISO = dayjs(availability.endDate).format('YYYY-MM-DD');

          const newVehicle = await Vehicle.create({
            owner: req.user._id,
            imageUrl: result.secure_url,
            location,
            availability: {
              startDate: new Date(`${startISO}T00:00:00.000Z`),
              endDate: new Date(`${endISO}T00:00:00.000Z`)
            }
          });

          const populated = await Vehicle.findById(newVehicle._id).populate('owner', 'username');
return res.status(201).json(populated);
        } catch (innerErr) {
          console.error('POST /vehicles create error:', innerErr);
          return res.status(500).json({ err: innerErr.message });
        }
      }
    );

    uploadStream.on('error', (streamErr) => {
      console.error('Cloudinary stream error:', streamErr);
      if (!res.headersSent) {
        return res.status(500).json({ err: 'Image upload failed' });
      }
    });

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (err) {
    console.error('POST /vehicles error:', err);
    res.status(500).json({ err: err.message });
  }
});

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

    if (availability?.startDate) {
      const startISO = dayjs(availability.startDate).format('YYYY-MM-DD');
      updatedFields.availability.startDate = new Date(`${startISO}T00:00:00.000Z`);
    }
    if (availability?.endDate) {
      const endISO = dayjs(availability.endDate).format('YYYY-MM-DD');
      updatedFields.availability.endDate = new Date(`${endISO}T00:00:00.000Z`);
    }

    if (req.file) {
      const result = await fileTypeFromBuffer(req.file.buffer);
      if (!result || !['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(result.mime)) {
        return res.status(400).json({ err: 'Invalid image file' });
      }

      const cloudUpload = cloudinary.uploader.upload_stream(
        { folder: 'vehicles' },
        async (error, result) => {
          try {
            if (error) {
              console.error('Cloudinary upload (PUT) error:', error);
              return res.status(500).json({ err: error.message });
            }

            updatedFields.imageUrl = result.secure_url;
            const updated = await Vehicle.findByIdAndUpdate(
  vehicle._id,
  updatedFields,
  { new: true }
);
const populated = await Vehicle.findById(updated._id).populate('owner', 'username');
return res.status(200).json(populated);

          } catch (innerErr) {
            console.error('PUT /vehicles update error:', innerErr);
            return res.status(500).json({ err: innerErr.message });
          }
        }
      );

      cloudUpload.on('error', (streamErr) => {
        console.error('Cloudinary stream (PUT) error:', streamErr);
        if (!res.headersSent) {
          return res.status(500).json({ err: 'Image upload failed' });
        }
      });

      streamifier.createReadStream(req.file.buffer).pipe(cloudUpload);
    } else {
      const updated = await Vehicle.findByIdAndUpdate(
        vehicle._id,
        updatedFields,
        { new: true }
      );
      res.status(200).json(updated);
    }
  } catch (err) {
    console.error('PUT /vehicles/:vehicleId error:', err);
    res.status(500).json({ err: err.message });
  }
});

// START OF THE VALIDATION OF THE DATE BOOKING

router.get('/:vehicleId/availability', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ err: 'Vehicle not found' });
const bookings = await Booking.find({ vehicle: vehicle._id }).select('startDate endDate');
res.status(200).json({
      availability: {
        startDate: vehicle.availability.startDate,
        endDate: vehicle.availability.endDate,
      },
      bookings: bookings.map(b => ({
        startDate: b.startDate,
        endDate: b.endDate,
      })),
    });
  } catch (err) {
    console.error('GET /vehicles/:vehicleId/availability error:', err);
    res.status(500).json({ err: err.message });
  }
});

// END OF THE VALIDATION

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
    console.error('DELETE /vehicles/:vehicleId error:', err);
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;