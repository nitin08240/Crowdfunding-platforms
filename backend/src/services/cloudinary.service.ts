import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const PLACEHOLDER_IMAGE = `https://placehold.co/800x450/7c3aed/fff?text=Image`;
const PLACEHOLDER_DOC = `https://placehold.co/200x200/1e1b4b/fff?text=Document`;

export const cloudinaryService = {
  async uploadBuffer(
    buffer: Buffer,
    mimetype: string,
    folder: string
  ): Promise<string> {
    if (!env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_CLOUD_NAME === 'placeholder_cloud') {
      return mimetype.startsWith('image/') ? PLACEHOLDER_IMAGE : PLACEHOLDER_DOC;
    }

    const resourceType: 'image' | 'video' | 'raw' = mimetype.startsWith('image/')
      ? 'image'
      : mimetype.startsWith('video/')
      ? 'video'
      : 'raw';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'));
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  },

  async deleteByUrl(url: string): Promise<void> {
    if (!url || !url.includes('cloudinary')) return;
    const publicId = url.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
  },
};
