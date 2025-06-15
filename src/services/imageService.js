const s3Client = require('../config/idrive');
const { PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class ImageService {
  constructor() {
    this.bucketName = process.env.IDRIVE_BUCKET || 'profile-pictures';
    this.allowedTypes = process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB
  }

  /**
   * Validate image file
   * @param {Object} file - File object from multer
   * @returns {Object} Validation result
   */
  validateImage(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      errors.push(`Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Upload image to iDrive storage
   * @param {Object} file - File object from multer
   * @param {string} userId - User ID for organizing files
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(file, userId) {
    try {
      // Validate file
      const validation = this.validateImage(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${userId}/${uuidv4()}${fileExtension}`;

      // Upload parameters
      const uploadParams = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
      };

      // Upload to iDrive
      const command = new PutObjectCommand(uploadParams);
      const result = await s3Client.send(command);

      return {
        success: true,
        fileName: fileName,
        publicUrl: this.getImageUrl(fileName),
        size: file.size,
        mimetype: file.mimetype
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete image from iDrive storage
   * @param {string} fileName - File name to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(fileName) {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: fileName
      };

      const command = new DeleteObjectCommand(deleteParams);
      await s3Client.send(command);

      return {
        success: true,
        message: 'Image deleted successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get image URL from iDrive storage
   * @param {string} fileName - File name
   * @returns {string} Public URL
   */
  getImageUrl(fileName) {
    if (!fileName) return null;

    return `${process.env.IDRIVE_ENDPOINT}/${this.bucketName}/${fileName}`;
  }

  /**
   * List user images
   * @param {string} userId - User ID
   * @returns {Promise<Object>} List of images
   */
  async listUserImages(userId) {
    try {
      const listParams = {
        Bucket: this.bucketName,
        Prefix: `${userId}/`
      };

      const command = new ListObjectsV2Command(listParams);
      const result = await s3Client.send(command);

      return {
        success: true,
        images: (result.Contents || []).map(file => ({
          name: file.Key.split('/').pop(),
          size: file.Size,
          lastModified: file.LastModified,
          url: this.getImageUrl(file.Key)
        }))
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ImageService(); 