const express = require('express');
const axios = require('axios');
const { redisClient } = require('../config/db');

const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY || '1c9021903828653d94a867a5af5db8da';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const CACHE_KEY = 'tmdb:genres';
const CACHE_TTL = 86400; // 24h

// GET /genres
router.get('/', async (req, res) => {
  // 1. Tente Redis
  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(CACHE_KEY);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }
  } catch (err) {
    console.error('Erreur lecture Redis:', err.message);
  }

  // 2. Sinon, on appelle TMDB
  const url = `${TMDB_BASE}/genre/movie/list?language=fr-FR&api_key=${TMDB_API_KEY}`;
  try {
    const { data } = await axios.get(url);

    // 3. On met en cache (sans bloquer si Redis plante)
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(CACHE_KEY, CACHE_TTL, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Erreur écriture Redis:', err.message);
    }

    res.json(data);
  } catch (err) {
    console.error('Erreur TMDB genres:', err.message);
    res.status(502).json({ detail: 'Erreur avec TMDB' });
  }
});

module.exports = router;
