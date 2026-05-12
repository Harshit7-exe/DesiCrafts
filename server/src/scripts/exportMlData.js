import fs from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Interaction from "../models/Interaction.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

const projectRoot = path.resolve(process.cwd());
dotenv.config({ path: path.join(projectRoot, "server", ".env") });
const generatedDir = path.join(projectRoot, "ml", "generated");

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function exportData() {
  await connectDB();
  await fs.mkdir(generatedDir, { recursive: true });

  const products = await Product.find({ mlProductId: { $exists: true, $ne: null } }).sort({ mlProductId: 1 });
  const interactions = await Interaction.find().sort({ createdAt: 1 });

  const productRows = [
    "product_id,name,category,artisan,region,price,material,tags,description",
    ...products.map(product =>
      [
        escapeCsv(product.mlProductId),
        escapeCsv(product.name),
        escapeCsv(product.category),
        escapeCsv(product.artisan),
        escapeCsv(product.region),
        escapeCsv(product.price),
        escapeCsv(product.specifications?.material || ""),
        escapeCsv(
          [
            product.category,
            product.region,
            product.specifications?.material,
            product.featured ? "featured" : "",
            product.rating >= 4.5 ? "top-rated" : ""
          ]
            .filter(Boolean)
            .join(" ")
        ),
        escapeCsv(product.description)
      ].join(",")
    )
  ].join("\n");

  const interactionRows = [
    "session_id,user_id,product_id,action_type,timestamp,rating",
    ...interactions.map((interaction, index) =>
      [
        `LIVE${String(index + 1).padStart(4, "0")}`,
        escapeCsv(interaction.userKey),
        escapeCsv(interaction.mlProductId),
        escapeCsv(interaction.actionType),
        escapeCsv(interaction.createdAt.toISOString()),
        escapeCsv(interaction.rating)
      ].join(",")
    )
  ].join("\n");

  await fs.writeFile(path.join(generatedDir, "products.csv"), productRows, "utf8");
  await fs.writeFile(path.join(generatedDir, "interactions.csv"), interactionRows, "utf8");

  console.log(`Exported ${products.length} products and ${interactions.length} interactions to ml/generated`);
  await mongoose.connection.close();
}

exportData().catch(async error => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
