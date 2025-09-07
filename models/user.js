const mongoose = require('mongoose');
//const backendtoolConnection = require('../db_infra/backendopstooldb');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});

module.exports = mongoose.model('User', userSchema);
