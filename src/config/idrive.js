require('dotenv').config();
const { S3Client } = require('@aws-sdk/client-s3');

// Configure iDrive S3-compatible storage
const s3Client = new S3Client({
  endpoint: process.env.IDRIVE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.IDRIVE_ACCESS_KEY,
    secretAccessKey: process.env.IDRIVE_SECRET_KEY,
  },
  forcePathStyle: true,
  region: 'us-east-1' // Required for S3Client
});

module.exports = s3Client; 