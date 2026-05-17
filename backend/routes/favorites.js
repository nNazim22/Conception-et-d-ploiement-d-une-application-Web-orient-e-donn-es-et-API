const express = require('express');
const Favorite = require('../models/Favorite');

const router = express.Router();

// GET /favorites — liste tous les favoris
router.get('/', async (req, res) => {
  try {
    const favorites = await Favorite.find().sort({ added_at: -1 });
    res.json(favorites);
  } catch (err) {
    console.error('Erreur lecture favoris:', err.message);
    res.status(500).json({ detail: 'Erreur lors de la lecture des favoris' });
  }
});

// POST /favorites — ajoute un favori
router.post('/', async (req, res) => {
  const { tmdb_id, title, poster_path } = req.body;

  if (!tmdb_id || !title) {
    return res.status(400).json({ detail: 'tmdb_id et title sont requis' });
  }

  try {
    // Vérifier si déjà présent
    const existing = await Favorite.findOne({ tmdb_id });
    if (existing) {
      return res.status(400).json({ detail: 'Film déjà dans les favoris' });
    }

    const favorite = new Favorite({ tmdb_id, title, poster_path });
    await favorite.save();
    res.status(201).json(favorite);
  } catch (err) {
    // Au cas où l'unique index attrape un doublon en race condition
    if (err.code === 11000) {
      return res.status(400).json({ detail: 'Film déjà dans les favoris' });
    }
    console.error('Erreur ajout favori:', err.message);
    res.status(500).json({ detail: "Erreur lors de l'ajout du favori" });
  }
});

// DELETE /favorites/:id — supprime un favori
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Favorite.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ detail: 'Favori introuvable' });
    }
    res.json({ message: 'Favori supprimé', id: req.params.id });
  } catch (err) {
    // ID Mongo invalide (mauvais format)
    if (err.name === 'CastError') {
      return res.status(400).json({ detail: 'ID invalide' });
    }
    console.error('Erreur suppression favori:', err.message);
    res.status(500).json({ detail: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
