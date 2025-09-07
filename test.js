require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

const Product = require('./models/product');
const { uploadToS3, getFromS3 } = require('./services/s3Service');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
// app.get('/', (req, res) => {
//   res.send('Hello from /create!');
// });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅MongoDB Connected'))
  .catch(err => console.error(' MongoDB Error:', err));

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
app.get('/', async (req, res) => {
    res.send('Hello from /create!');
//   const searchQuery = req.query.q?.toLowerCase() || '';
//   const dbProducts = await Product.find();
//   const products = [];

//   for (let p of dbProducts) {
//     const data = await getFromS3(p.s3Key);
//     if (
//       !searchQuery ||
//       data.name.toLowerCase().includes(searchQuery) ||
//       data.description.toLowerCase().includes(searchQuery)
//     ) {
//       products.push({ ...data, _id: p._id });
//     }
//   }

//   res.render('index', { products, searchQuery });
});
app.listen(8000, () => console.log('Listening on http://localhost:8000'));
