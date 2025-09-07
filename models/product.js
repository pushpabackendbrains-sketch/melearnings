const mongoose = require('mongoose');
//const s3productConnection = require('../db_infra/s3-product');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  s3Key: String
});

module.exports = mongoose.model('s3-product', productSchema);
