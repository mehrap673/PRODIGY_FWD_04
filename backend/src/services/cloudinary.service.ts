import cloudinary from '../config/cloudinary';
import fs from 'fs';

export const uploadImage = async (filePath: string): Promise<string> => {
  try {
    console.log('🔄 Starting Cloudinary upload...');
    console.log('File path:', filePath);
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'chatsphere/images',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
      ],
    });

    console.log('✅ Cloudinary upload successful!');
    console.log('Result:', result);

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return result.secure_url;
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error details:', error.error);
    
    // Clean up file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

export const uploadAudio = async (filePath: string): Promise<string> => {
  try {
    console.log('🔄 Starting Cloudinary audio upload...');
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'chatsphere/audio',
      resource_type: 'video', // Cloudinary uses 'video' for audio files
    });

    console.log('✅ Cloudinary audio upload successful!');
    fs.unlinkSync(filePath);
    
    return result.secure_url;
  } catch (error: any) {
    console.error('❌ Cloudinary audio upload error:', error);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

export const deleteFile = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete file from Cloudinary:', error);
  }
};
