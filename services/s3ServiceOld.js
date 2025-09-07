const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const uploadToS3 = async (data, id) => {
  const key = `products/${id}-${uuidv4()}.json`;

  await s3.putObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: 'application/json'
  }).promise();

  return key;
};

const getFromS3 = async (key) => {
  const res = await s3.getObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  }).promise();

  return JSON.parse(res.Body.toString());
};

module.exports = { uploadToS3, getFromS3 };
