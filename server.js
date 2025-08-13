const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('morgan');
const webpush = require('web-push')
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

webpush.setVapidDetails(
  'mailto:example@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: Not allowed by policy'));
  },
  credentials: true
}));

app.use(express.json());
app.use(logger('dev'));

const authRouter = require('./controllers/auth');
const userRouter = require('./controllers/users');
const vehicleRouter = require('./controllers/vehicles');
const bookingRouter = require('./controllers/bookings');
const pushRouter = require('./controllers/push')

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/vehicles', vehicleRouter);
app.use('/bookings', bookingRouter);
app.use('/push',pushRouter);

app.listen(process.env.PORT|| 3000, () => {
  console.log('The express app is ready and running on port 3000!');
});