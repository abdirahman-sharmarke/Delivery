require('dotenv').config();
const AWS = require('aws-sdk');

// Configure iDrive S3-compatible storage
const s3 = new AWS.S3({
  endpoint: process.env.IDRIVE_ENDPOINT,
  accessKeyId: process.env.IDRIVE_ACCESS_KEY,
  secretAccessKey: process.env.IDRIVE_SECRET_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

module.exports = s3; 