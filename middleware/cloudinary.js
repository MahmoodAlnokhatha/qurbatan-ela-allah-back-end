const multer = require('multer')
const {CloudinaryStorage} = require ('multer-storage-cloudinary')
const cloudinary = require ('../config/cloudinary')

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'vehicles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'heic','heif'],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`
  }
});

module.exports = storage;
