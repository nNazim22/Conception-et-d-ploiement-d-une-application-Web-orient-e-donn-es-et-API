const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    tmdb_id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    poster_path: {
      type: String,
      default: null,
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Transforme _id → id et masque __v dans les réponses JSON
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

module.exports = mongoose.model('Favorite', favoriteSchema);
