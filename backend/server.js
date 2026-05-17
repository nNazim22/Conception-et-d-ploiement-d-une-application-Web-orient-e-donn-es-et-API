require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const moviesRoutes = require('./routes/movies');
const favoritesRoutes = require('./routes/favorites');
const genresRoutes = require('./routes/genres');

const app = express();
const PORT = process.env.PORT || 8000;

// --- Middleware ---
app.use(express.json());

// CORS (utile en dev quand npm run dev — inutile en prod via nginx)
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true,
}));

// --- Routes ---
app.get('/', (req, res) => {
  res.json({ message: 'API Catalogue Films - Node.js + MongoDB' });
});

app.use('/movies', moviesRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/genres', genresRoutes);

// --- Gestion d'erreur globale ---
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ detail: 'Erreur interne du serveur' });
});

// --- Démarrage ---
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API démarrée sur http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('Échec démarrage:', err);
    process.exit(1);
  }
};

start();
