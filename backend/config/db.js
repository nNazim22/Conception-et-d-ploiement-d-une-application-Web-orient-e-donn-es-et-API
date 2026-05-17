const mongoose = require('mongoose');
const { createClient } = require('redis');

// --- MongoDB ---
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/catalogue_films';
  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connecté : ${mongoose.connection.host}`);
  } catch (err) {
    console.error('Erreur MongoDB:', err.message);
    throw err;
  }
};

// --- Redis (client partagé, lazy connect) ---
const redisHost = process.env.REDIS_HOST || 'redis-service';
const redisPort = process.env.REDIS_PORT || 6379;

const redisClient = createClient({
  socket: { host: redisHost, port: redisPort },
});

redisClient.on('error', (err) => {
  console.error('Erreur Redis:', err.message);
});

// On tente la connexion mais on ne plante pas si Redis est indispo (cache optionnel)
(async () => {
  try {
    await redisClient.connect();
    console.log(`Redis connecté : ${redisHost}:${redisPort}`);
  } catch (err) {
    console.error('Redis indisponible, le cache sera désactivé:', err.message);
  }
})();

module.exports = connectDB;
module.exports.redisClient = redisClient;
