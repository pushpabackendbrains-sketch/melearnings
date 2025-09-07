const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Readable } = require('stream');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Upload product JSON to S3
const uploadToS3 = async (data, id) => {
  const key = `products/${id}-${uuidv4()}.json`;

  const uploadParams = {
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "image/jpg,jpeg,png",
    ContentType: 'application/json'
    
  };

  await s3.send(new PutObjectCommand(uploadParams));
  return key;
};

// Retrieve product JSON from S3
const getFromS3 = async (key) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key
  });

  const response = await s3.send(command);
  const stream = response.Body;

  return new Promise((resolve, reject) => {
    let data = '';
    stream.on('data', chunk => data += chunk);
    stream.on('end', () => resolve(JSON.parse(data)));
    stream.on('error', reject);
  });
};

module.exports = { uploadToS3, getFromS3 };
