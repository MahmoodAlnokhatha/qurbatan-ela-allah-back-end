# Qurbatan Ela Allah - Backend

This is the backend API for the **Qurbatan Ela Allah** volunteer vehicle coordination platform.  
It is built with **Node.js**, **Express.js**, and **MongoDB** and provides authentication, vehicle management, and booking features to help coordinate vehicles for volunteer activities.

---

## 🚀 Features

- **User Authentication**  
  - Sign up, sign in with JWT authentication  
  - Password hashing with bcrypt  
  - Protected routes using middleware

- **Vehicle Management**  
  - Volunteers can add their available vehicles (with image upload to Cloudinary)  
  - Update or remove owned vehicles  
  - Public route to see all available vehicles  
  - View single vehicle details  
  - View only user’s own registered vehicles

- **Booking Management**  
  - Reserve a volunteer vehicle for a specific date range  
  - View a user’s own bookings  
  - Prevent overlapping bookings

---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/your-username/qurbatan-backend.git
cd qurbatan-backend

# Install dependencies
npm install
```

- **⚙️ Environment Variables**
#### Create a .env file in the project root:
```javaScript
PORT=3000
MONGO_URI=mongodb
JWT_SECRET=your_jwt_secret_here
//Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
#### ▶️ Running the Server
```bash
nodemon
```
- The API will run at : http://localhost:3000
---

## 📂 Project Structure
---
```
backend/
  ├── config/
  │   └── cloudinary.js        # Cloudinary configuration
  ├── middleware/
  │   ├── cloudinary.js        # Cloudinary storage
  │   └── verify-token.js      # JWT verification middleware
  ├── models/
  │   ├── user.js              # User schema
  │   ├── vehicle.js           # Vehicle schema
  │   └── booking.js           # Booking schema
  ├── controllers/
  │   ├── auth.js              # Auth routes (sign up, sign in)
  │   ├── vehicles.js          # Vehicle CRUD routes
  │   └── bookings.js          # Booking routes
  ├── server.js                # Express app entry point
  └── package.json

```
---

## 📌 API Endpoints

### Auth

| Method | Endpoint | Auth? | Description |
| :----: | :-------: | :---: | :----------:|
| POST   | /auth/sign-up | ❌ | Create account |
| POST   | /auth/sign-in | ❌ | Login and get Token |

### Vehicles

| Method | Endpoint | Auth? | Description |
| :----: | :-------: | :---: | :----------:|
| GET   | /vehicles | ❌ | List all available vehicles |
| GET   | /vehicles/:vehicleId | ❌ | Get vehicle details |
| GET   | /vehicles/my-vehicles | ✅ | Get current user's vehicles |
| POST   | /vehicles | ✅ | Create vehicle (with image) |
| PUT   | /vehicles/:vehicleId | ✅ | Update vehicle |
| DELETE   | /vehicles/:vehicleId | ✅ | Delete vehicle |

### Booking

| Method | Endpoint | Auth? | Description |
| :----: | :-------: | :---: | :----------:|
| POST   | /bookings | ✅ | Create a booking |
| POST   | /bookings/my | ✅ | Get current user's bookings |
---

## 🖼️ Image Upload
---

- Images are uploaded directly to Cloudinary.

- Accepted formats: jpg, jpeg, png, webp, heic, heif.
---

## 🛠️ Tech Stack
---
- Backend: Node.js, Express.js

- Database: MongoDB + Mongoose

- Auth: JWT + bcrypt

- Image Hosting: Cloudinary

- Date Handling: Day.js

- File Upload: Multer