import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import Product from "./models/Product.js";
import Seller from "./models/Seller.js";
import User from "./models/User.js";
import Category from "./models/Category.js";
import Interaction from "./models/Interaction.js";

dotenv.config();

const products = [
  {
    name: "Hand-Thrown Terracotta Serving Bowl",
    artisan: "Meera Pottery Studio",
    category: "Ceramics",
    region: "Jaipur, Rajasthan",
    description: "A warm terracotta bowl shaped on the wheel and finished with a food-safe glaze for daily meals and festive tables.",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80",
    price: 1299,
    stock: 18,
    rating: 4.8,
    featured: true
  },
  {
    name: "Indigo Block Print Table Runner",
    artisan: "Anokhi Hands Collective",
    category: "Textiles",
    region: "Bagru, Rajasthan",
    description: "Cotton table runner printed by hand with natural indigo dyes and traditional wooden blocks.",
    image: "https://images.unsplash.com/photo-1604778228774-decce0b67740?auto=format&fit=crop&w=900&q=80",
    price: 899,
    stock: 25,
    rating: 4.7,
    featured: true
  },
  {
    name: "Woven Moonj Grass Storage Basket",
    artisan: "Saras Basket Guild",
    category: "Home Decor",
    region: "Prayagraj, Uttar Pradesh",
    description: "A sturdy handwoven basket made with moonj grass, perfect for shelves, linens, craft supplies, or planters.",
    image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
    price: 749,
    stock: 32,
    rating: 4.6,
    featured: false
  },
  {
    name: "Brass Hammered Diyas Set",
    artisan: "Kaveri Metal Works",
    category: "Lighting",
    region: "Moradabad, Uttar Pradesh",
    description: "A set of four hammered brass diyas with a soft glow for pooja corners, dinner settings, and gifting.",
    image: "https://images.unsplash.com/photo-1602874801006-e26ab13a6dd2?auto=format&fit=crop&w=900&q=80",
    price: 1099,
    stock: 20,
    rating: 4.9,
    featured: true
  },
  {
    name: "Kalamkari Cotton Tote",
    artisan: "Sita Handpainted Textiles",
    category: "Bags",
    region: "Srikalahasti, Andhra Pradesh",
    description: "A durable cotton tote with Kalamkari-inspired hand-painted botanical details and an inner pocket.",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
    price: 649,
    stock: 40,
    rating: 4.5,
    featured: false
  },
  {
    name: "Neem Wood Spice Spoons",
    artisan: "Aarav Woodcraft",
    category: "Kitchen",
    region: "Mysuru, Karnataka",
    description: "Smooth neem wood spoons carved in small batches for masala tins, tea jars, and everyday cooking.",
    image: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?auto=format&fit=crop&w=900&q=80",
    price: 399,
    stock: 55,
    rating: 4.4,
    featured: false
  }
];

async function dropOldSlugIndex(model, label) {
  const indexes = await model.collection.indexes();
  const hasOldSlugIndex = indexes.some(index => index.name === "slug_1");

  if (hasOldSlugIndex) {
    await model.collection.dropIndex("slug_1");
    console.log(`Dropped old ${label}.slug index`);
  }
}

async function seed() {
  await connectDB();

  await dropOldSlugIndex(Product, "products");
  await dropOldSlugIndex(Category, "categories");

  await Product.deleteMany();
  await User.deleteMany();
  await Seller.deleteMany();
  await Category.deleteMany();
  await Interaction.deleteMany();

  const admin = await User.create({
    name: "Artisan Admin",
    email: "admin@artisan.test",
    password: "artisan123",
    role: "admin"
  });
  const customer = await User.create({
    name: "Demo Customer",
    email: "customer@artisan.test",
    phone: "9999999999",
    password: "customer123",
    role: "customer",
    walletBalance: 1500,
    addresses: [
      {
        label: "Home",
        fullName: "Demo Customer",
        phone: "9999999999",
        street: "21 Market Road",
        city: "Jaipur",
        state: "Rajasthan",
        postalCode: "302001",
        isDefault: true
      }
    ],
    savedPaymentMethods: [
      {
        type: "UPI",
        label: "Primary UPI",
        maskedValue: "demo@upi",
        isDefault: true
      }
    ]
  });
  const sellerUser = await User.create({
    name: "Meera Artisan",
    email: "seller@artisan.test",
    phone: "8888888888",
    password: "seller123",
    role: "seller"
  });
  const seller = await Seller.create({
    user: sellerUser._id,
    storeName: "Meera Pottery Studio",
    bio: "Small-batch handmade homeware from local craft clusters.",
    location: {
      city: "Jaipur",
      state: "Rajasthan",
      address: "Johari Bazaar"
    },
    verificationStatus: "approved"
  });

  const enrichedProducts = products.map((product, index) => ({
    ...product,
    mlProductId: `P${String(index + 1).padStart(3, "0")}`,
    seller: seller._id,
    slug: `${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${index + 1}`,
    images: [product.image, product.image],
    discountPercent: index % 2 === 0 ? 10 : 0,
    specifications: {
      material: product.category === "Textiles" ? "Cotton" : "Handcrafted natural material",
      dimensions: "Varies by handmade batch",
      care: "Wipe gently and keep dry",
      weight: "Lightweight"
    },
    popularity: 20 - index
  }));

  await Product.insertMany(enrichedProducts);
  await Category.insertMany(
    [...new Set(products.map(product => product.category))].map(name => ({
      name,
      description: `${name} made by local artisans`
    }))
  );

  console.log("Seed data created");
  console.log("Admin:", admin.email, "artisan123");
  console.log("Customer:", customer.email, "customer123");
  console.log("Seller:", sellerUser.email, "seller123");
  await mongoose.connection.close();
}

seed().catch(error => {
  console.error(error);
  process.exit(1);
});
