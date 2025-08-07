const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(logger('dev'));

const authRouter = require('./controllers/auth');
const userRouter = require('./controllers/users');
const vehicleRouter = require('./controllers/vehicles');

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/vehicles', vehicleRouter);

app.listen(3000, () => {
  console.log('The express app is ready and running on port 3000!');
});