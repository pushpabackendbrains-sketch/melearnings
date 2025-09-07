const mongoose = require('mongoose');
const fs = require('fs');
const Country  = require('./models/Country.js');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/s3-project';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    // Read the country data from the JSON file
    const countries = JSON.parse(fs.readFileSync('./data/country-list.json', 'utf-8'));

    // Insert countries into the database
    Country.insertMany(countries)
      .then(() => {
        console.log('Countries inserted successfully');
        mongoose.connection.close();
      })
      .catch(err => console.log('Error inserting countries:', err));
  })
  .catch(err => console.log('Error connecting to MongoDB:', err));
