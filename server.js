require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const Product = require('./models/product');
const { uploadToS3, getFromS3 } = require('./services/s3Service');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅MongoDB Connected'))
  .catch(err => console.error(' MongoDB Error:', err));
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
app.get('/', async (req, res) => {
  const searchQuery = req.query.q?.toLowerCase() || '';
  const dbProducts = await Product.find();
  const products = [];

  for (let p of dbProducts) {
    const data = await getFromS3(p.s3Key);
    if (
      !searchQuery ||
      data.name.toLowerCase().includes(searchQuery) ||
      data.description.toLowerCase().includes(searchQuery)
    ) {
      products.push({ ...data, _id: p._id });
    }
  }

  res.render('index', { products, searchQuery });
});

app.get('/create', (req, res) => {
  res.render('create');
});

app.post('/create', async (req, res) => {
  const { name, price, description } = req.body;
  const product = new Product({ name, price, description });
  await product.save();

  const s3Key = await uploadToS3({ name, price, description }, product._id);
  product.s3Key = s3Key;
  await product.save();

  res.redirect('/');
});

app.get('/edit/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  const data = await getFromS3(product.s3Key);
  res.render('edit', { product: { ...data, _id: product._id } });
});

app.post('/edit/:id', async (req, res) => {
  const { name, price, description } = req.body;
  const product = await Product.findById(req.params.id);

  product.name = name;
  product.price = price;
  product.description = description;

  const s3Key = await uploadToS3({ name, price, description }, product._id);
  product.s3Key = s3Key;
  await product.save();

  res.redirect('/');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 App running on http://localhost:${PORT}`));
