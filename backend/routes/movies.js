const express = require('express');
const axios = require('axios');

const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY || '1c9021903828653d94a867a5af5db8da';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// GET /movies/popular?page=1
router.get('/popular', async (req, res) => {
  const page = req.query.page || 1;
  const url = `${TMDB_BASE}/movie/popular?language=fr-FR&page=${page}&api_key=${TMDB_API_KEY}`;
  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (err) {
    console.error('Erreur TMDB popular:', err.message);
    res.status(502).json({ detail: 'Erreur avec TMDB' });
  }
});

// GET /movies/search?query=spider&page=1
router.get('/search', async (req, res) => {
  const { query, page = 1 } = req.query;
  if (!query || query.trim() === '') {
    return res.status(400).json({ detail: 'La recherche ne peut pas être vide.' });
  }
  const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&page=${page}&api_key=${TMDB_API_KEY}`;
  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (err) {
    console.error('Erreur TMDB search:', err.message);
    res.status(502).json({ detail: 'Erreur de communication avec TMDB' });
  }
});

// GET /movies/discover?genre=28&year=2023&min_rating=7&page=1
router.get('/discover', async (req, res) => {
  const { genre, year, min_rating, page = 1 } = req.query;

  const params = [
    'language=fr-FR',
    `page=${page}`,
    'sort_by=popularity.desc',
    `api_key=${TMDB_API_KEY}`,
  ];
  if (genre) params.push(`with_genres=${genre}`);
  if (year) params.push(`primary_release_year=${year}`);
  if (min_rating) {
    params.push(`vote_average.gte=${min_rating}`);
    params.push('vote_count.gte=100');
  }

  const url = `${TMDB_BASE}/discover/movie?${params.join('&')}`;
  try {
    const { data } = await axios.get(url);
    res.json(data);
  } catch (err) {
    console.error('Erreur TMDB discover:', err.message);
    res.status(502).json({ detail: 'Erreur avec TMDB' });
  }
});

module.exports = router;
