import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Explicitly load .env file
dotenv.config();

// Debug logging
console.log('\n🔍 === CLOUDINARY DEBUG ===');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT FOUND');
console.log('API Key:', process.env.CLOUDINARY_API_KEY || '❌ NOT FOUND');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Found' : '❌ NOT FOUND');
console.log('=========================\n');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ ERROR: Cloudinary credentials are missing in .env file!');
  console.error('Please add these to your .env file:');
  console.error('CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.error('CLOUDINARY_API_KEY=your_api_key');
  console.error('CLOUDINARY_API_SECRET=your_api_secret');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;
