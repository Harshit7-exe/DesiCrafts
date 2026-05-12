# DesiCrafts

DesiCrafts is a MERN full stack project for a local artisan marketplace. The app includes a React storefront, product browsing, cart, checkout, Express APIs, MongoDB models, JWT auth, and a seed script with sample artisan products.

## Feature Set

- Customer auth: email/password and phone OTP demo
- Profile, address book, saved payment methods, wallet balance
- Search with autocomplete, categories, price/rating/location filters, sorting
- Product gallery, specs, discounts, seller info, reviews, related products
- Cart, save for later, coupons, checkout, order history, returns
- Demo payments for UPI, card, net banking, wallet, and COD
- Seller onboarding, product management, inventory, earnings, order fulfillment
- Admin dashboard, user blocking, artisan approvals, analytics, categories, settlements, refund approval API
- JWT authentication, role-based access control, input validation helpers, basic rate limiting

## Tech Stack

- MongoDB + Mongoose
- Express.js
- React + Vite
- Node.js
- JWT authentication

## Project Structure

```text
local-artisan-estore/
  client/       React storefront
  server/       Express API and MongoDB models
```

## Setup

1. Install dependencies:

```bash
npm install
npm run install-all
```

2. Create the server environment file:

```bash
copy server\.env.example server\.env
```

3. Update `server/.env` with your MongoDB connection string.

4. Seed products:

```bash
npm run seed
```

5. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## Demo Login

After seeding:

- Email: `admin@artisan.test`
- Password: `artisan123`
- Customer: `customer@artisan.test` / `customer123`
- Seller: `seller@artisan.test` / `seller123`

Demo OTP is always `123456`.
