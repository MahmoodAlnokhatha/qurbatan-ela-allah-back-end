# Qurbatan Ela Allah - Backend

This is the backend API for the **Qurbatan Ela Allah** volunteer vehicle coordination platform.  
It is built with **Node.js**, **Express.js**, and **MongoDB** and provides authentication, vehicle management, and booking features to help coordinate vehicles for volunteer activities.

---

## Front-End Repo
**[here](https://github.com/MahmoodAlnokhatha/qurbatan-ela-allah-front-end)**

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

- **Push Notifications (Web Push)**
  - Requester gets a browser notification when a booking is **approved** or **rejected**
  - Uses VAPID keys + Service Worker
  - Endpoints to fetch public key and save subscriptions


---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/your-username/qurbatan-backend.git
cd qurbatan-backend

# Install dependencies
npm install
```

### 🔑 How to Get Web Push VAPID Keys (from scratch)

1. Install the package:
   ```bash
   npm i web-push
   ```
2. Create a helper file (one-time) to generate keys:
```bash
touch tools/genVAPID.js
```
```js
const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log(keys);
```
3. Run it:
```bash
node tools/genVAPID.js
```
Copy the publicKey and privateKey.
4. Put them in your .env:
```
VAPID_PUBLIC_KEY=PASTE_PUBLIC_KEY
VAPID_PRIVATE_KEY=PASTE_PRIVATE_KEY
```
5. Delete the generator file (to keep repo clean):
```bash
rm tools/genVAPID.js
```


- **⚙️ Environment Variables**
#### Create a .env file in the project root:
```javaScript
PORT=3000
MONGODB_URI=mongodb
JWT_SECRET=your_jwt_secret_here
FRONTEND_ORIGIN=http://localhost:5173
//Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
//Web Push
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```
#### ▶️ Running the Server
```bash
nodemon
```
- The API will run at : http://localhost:3000
---

## 📂 Project Structure
---
``` bash
backend/
  ├── config/
  │   └── cloudinary.js        # Cloudinary configuration
  ├── middleware/
  │   └── verify-token.js      # JWT verification middleware
  ├── models/
  │   ├── user.js              # User schema
  │   ├── vehicle.js           # Vehicle schema
  │   └── booking.js           # Booking schema
  ├── controllers/
  │   ├── auth.js              # Auth routes (sign up, sign in)
  │   ├── vehicles.js          # Vehicle CRUD routes
  │   ├── push.js              # push notification
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

### Push Notifications

| Method | Endpoint         | Auth? | Description |
| ------ | ---------------- | ----- | ----------- |
| GET    | /push/public-key | ❌    | Get VAPID public key |
| POST   | /push/subscribe  | ✅    | Subscribe user to push notifications |

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
