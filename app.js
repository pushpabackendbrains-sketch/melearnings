require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const https = require('https');

const User = require('./models/user');
const Product = require('./models/product');
const Country  = require('./models/Country.js');
const { uploadToS3, getFromS3 } = require('./services/s3Service');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, "public")));

//app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect(process.env.S3_MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(' MongoDB Error:', err));


const upload = multer({ dest: 'uploads/' });
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.redirect('/login');
    req.user = decoded;
    next();
  });
}
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
app.get('/mybucket', verifyToken, async (req, res) => {
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

  res.redirect('/mybucket');
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

  res.redirect('/mybucket');
});








// --- Routes ---

// Register
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) return res.send('Username and password are required');

  const userExists = await User.findOne({ username });
  if (userExists) return res.send('User already exists');

  const newUser = new User({ username, password }); // Warning: Plain password here for demo only
  await newUser.save();

  res.redirect('/login');
});

// Login
app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user || user.password !== password) return res.send('Invalid username or password');

  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.cookie('token', token, { httpOnly: true });
  res.redirect('/dashboard');
});

// Dashboard with 3 cards
app.get('/dashboard', verifyToken, (req, res) => {
  res.render('dashboard', { user: req.user.username });
});

// Individual card pages
// app.get('/mybucket', verifyToken, (req, res) => {
//   res.render('mybucket', { user: req.user.username });
// });

app.get('/timesheet', verifyToken, (req, res) => {
  res.render('timesheet', { user: req.user.username });
});

app.get('/backendtool', verifyToken, (req, res) => {
  //res.send('index.html', { user: req.user.username });
  //res.sendFile(path.join(__dirname, '/index.html'), { user: req.user.username });
  res.sendFile(path.join(__dirname, 'public', 'index.html'),{ user: req.user.username });

});

// File upload (S3)
app.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  const file = req.file;
  const fileStream = path.createReadStream(file.path);
  const key = `${Date.now()}-${file.originalname}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);

    path.unlinkSync(file.path);

    const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    res.send(`File uploaded successfully. <a href="${fileUrl}" target="_blank">View File</a>`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to upload file');
  }
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});


// Simulate a city data API (replace with real API)
const fetchCityData = (country) => {
  const cities = {
    USA: ['New York', 'Los Angeles', 'Chicago'],
    Germany: ['Berlin', 'Munich', 'Hamburg'],
    India: ['Delhi', 'Mumbai', 'Bangalore']
  };
  return cities[country] || ['New York', 'Los Angeles', 'Chicago'];
};

// Routes
app.get('/countries', async (req, res) => {
 
    try {
      const countries = 
      await Country.find(); // Fetch countries from DB
      res.json(countries); // Send the countries as JSON
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch countries' }); // Handle errors
    }
  });

  app.get('/get-client-configs', async (req, res) => {
    try{
      const agent = new https.Agent({rejectUnauthorized : false})
      const response = await fetch("https://shop.samsung.com/cl/api/v2/mobile/get-client-configs?country_code=CL&app_version_code=2955&storeId=cl&siteId=cl",{agent});
      const data = await response.json();
      res.json(data); // send back to frontend
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
     
    });

app.get('/cities/:country', (req, res) => {
  const cities = fetchCityData(req.params.country);
  res.json(cities);
});

app.get('/appTypes', async (req, res) => {
  try {
    // Static App Types
    const appTypes = ['Android', 'iOS', 'Web'];
    res.json(appTypes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch app types' });
  }
});
// Endpoint to save user input
app.post('/add-input', async (req, res) => {
  const { country, city, apptype, userInput } = req.body;

  // You can implement storing input into the database here
  res.status(200).json({ message: 'Input saved successfully!' });
});

// Endpoint to simulate API calls on list item click
app.get('/expand-item/:id', (req, res) => {
  // Simulate calling 2 APIs here and returning the results
  res.json({
    apiData1: 'https://api1.com/endpoint',
    apiData2: 'https://api2.com/endpoint'
  });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(` App running on http://localhost:${PORT}`));
