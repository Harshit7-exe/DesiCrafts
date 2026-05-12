## DesiCrafts
DesiCrafts is a MERN stack artisan marketplace platform that connects local artisans with customers through a modern e-commerce experience. The platform enables artisans to showcase handmade products while providing customers with intelligent product discovery, secure authentication, cart management, and seamless order processing.

## Features
  Customer Features
  
  JWT-based authentication
  Email/password login and phone OTP demo
  User profile and address management
  Product search with autocomplete
  Category, price, rating, and location filters
  Product gallery, specifications, and reviews
  Related product recommendations
  Cart and save-for-later functionality
  Coupon support and checkout system
  Order history and return requests

 Seller Features

  Seller onboarding and verification
  Product and inventory management
  Earnings tracking
  Order fulfillment management
  Admin Features
  User and artisan management
  Category management
  Analytics dashboard
  Refund approval APIs



## AI Recommendation System

DesiCrafts includes a hybrid AI-powered recommendation system designed to improve product discovery and enhance artisan visibility.
Recommendation Features

  Personalized product recommendations
  Related product suggestions
  Trending and popular products
  Category-based recommendations
  Location-based recommendations
  Smart search ranking

Recommendation Model
Content-Based Filtering
Uses:

  Product categories
  Tags and materials
  Price range
  Artisan location
  Ratings and reviews

Collaborative Filtering
Learns from:

  Product views
  Cart activity
  Wishlist activity
  Purchases
  Ratings and reviews


Hybrid Recommendation Engine
Combines content-based and collaborative filtering to provide more accurate and personalized recommendations.

## Tech Stack
Frontend

  React.js
  Vite

Backend

  Node.js
  Express.js

Database

  MongoDB
  Mongoose

Authentication

  JWT Authentication

AI/ML

  Python
  Scikit-learn
  Pandas
  NumPy



## Project Structure
local-artisan-estore/
│
├── client/        # React frontend
├── server/        # Express backend and MongoDB models
├── ml/            # Recommendation system and ML models
└── README.md

## Installation & Setup
1. Install Dependencies
npm install
npm run install-all
2. Setup Environment Variables
Windows
copy server\.env.example server\.env
Linux / Mac
cp server/.env.example server/.env
Update server/.env:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

## Running the Project

Start Backend
  npm run server

Start Frontend
  npm run client

Run Frontend & Backend Together
  npm run dev

Seed Sample Data
  npm run seed

## Security Features

  JWT-based authentication
  Role-based access control
  Password hashing
  Input validation
  Basic API rate limiting
  Protected API routes



## Future Enhancements

  Real payment gateway integration
  Live order tracking
  Buyer-artisan chat system
  AI chatbot support
  Voice search
  Progressive Web App (PWA)
  Mobile application support


Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Demo Login

After seeding:

- Email: `admin@artisan.test`
- Password: `artisan123`
- Customer: `customer@artisan.test` / `customer123`
- Seller: `seller@artisan.test` / `seller123`

Demo OTP is always `123456`.
Author
Harshit Raj
Rungta College of Engineering and Technology


