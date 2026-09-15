const fs = require('fs');
const path = require('path');
const multer = require('multer');

const hasCloudinaryCredentials = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_API_SECRET.includes('<your_api_secret>') &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

let upload;

if (hasCloudinaryCredentials) {
  try {
    const cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'campus_maintenance_complaints',
        allowed_formats: ['jpg', 'jpeg', 'png']
      }
    });
    upload = multer({ storage: storage });
    console.log('☁️ Cloudinary storage configured successfully.');
  } catch (err) {
    console.warn('⚠️ Cloudinary init failed, falling back to disk storage:', err.message);
  }
}

if (!upload) {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
    }
  });

  upload = multer({ storage: localStorage });
  console.log('📁 Using local disk storage for file uploads (/uploads).');
}

module.exports = upload;

