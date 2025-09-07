const mongoose = require('mongoose');
require('dotenv').config();

const s3productConnection = mongoose.connect('mongodb://localhost:27017/s3-project')
.then(() => console.log('BACKENDOPSTOOL_MONGO_URI MongoDB Connected'))
.catch(err => console.error('BACKENDOPSTOOL MongoDB Error:', err));

module.exports = s3productConnection;