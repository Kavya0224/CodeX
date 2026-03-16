require("dotenv").config();

/*
  Centralized environment config

  Keeps all env variable reads in one place
  so the rest of the app stays cleaner.
*/
module.exports = {
  PORT: process.env.PORT || 5000,
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
};