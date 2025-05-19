const env = require("env-var");

module.exports = {
  nodeEnv: env.get("NODE_ENV").default("development").asString(),
  port: env.get("PORT").default(3000).asPortNumber(),
  mongoURI: env.get("MONGO_URI").required().asString(),
  jwtSecret: env.get("JWT_SECRET").required().asString(),

  // 🧠 AI Integration
  huggingFaceApiKey: env.get("HF_API_KEY").required().asString(),

  // 🧠 LocationIQ API
  locationIqApiKey: env.get("LOCATIONIQ_API_KEY").required().asString(),

  // 📊 API limits
  apiRequestLimit: env.get("API_REQUEST_LIMIT").default(1000).asIntPositive(),
  apiRateWindowMs: env
    .get("API_RATE_WINDOW_MS")
    .default("900000")
    .asIntPositive(),
};
