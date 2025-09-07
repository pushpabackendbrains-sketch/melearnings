const mongoose = require('mongoose');
require('dotenv').config();

const backendtoolConnection = mongoose.connect(process.env.BACKENDOPSTOOL_MONGO_URI)
.then(() => console.log('BACKENDOPSTOOL_MONGO_URI MongoDB Connected'))
.catch(err => console.error('BACKENDOPSTOOL MongoDB Error:', err));

module.exports = backendtoolConnection;
