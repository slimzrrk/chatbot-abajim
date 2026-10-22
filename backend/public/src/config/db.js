const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from the backend .env file
dotenv.config({ path: path.join(__dirname, "../../../.env") });

// Create a Sequelize instance with MySQL connection details
const sequelize = new Sequelize({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "abajimdb",
  dialect: "mysql", // Ensure you're using the correct dialect for MySQL
  logging: true, // Set to true if you want to see SQL queries in the console
});
// Check the database connection
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connection established successfully!");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });
module.exports = sequelize;
