<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

// --- État principal ---
const movies = ref([])
const searchQuery = ref('')
const errorMessage = ref('')
const currentPage = ref(1)
const isLoading = ref(false)

// --- Filtres ---
const genres = ref([])
const selectedGenre = ref(null)
const selectedYear = ref(null)
const selectedMinRating = ref(null)

const years = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: current - 1949 }, (_, i) => current - i)
})

const ratings = [9, 8, 7, 6, 5]

const hasActiveFilters = computed(() =>
  selectedGenre.value || selectedYear.value || selectedMinRating.value
)

// --- Favoris (sidebar) ---
const favorites = ref([])
const isSidebarOpen = ref(false)

// --- Chargement films ---
const loadMovies = async (isNewSearch = false) => {
  errorMessage.value = ''
  isLoading.value = true

  if (isNewSearch) {
    currentPage.value = 1
    movies.value = []
  }

  try {
    let url = ''

    if (searchQuery.value) {
      url = `/api/movies/search?query=${encodeURIComponent(searchQuery.value)}&page=${currentPage.value}`
    } else if (hasActiveFilters.value) {
      const params = new URLSearchParams({ page: currentPage.value })
      if (selectedGenre.value) params.append('genre', selectedGenre.value)
      if (selectedYear.value) params.append('year', selectedYear.value)
      if (selectedMinRating.value) params.append('min_rating', selectedMinRating.value)
      url = `/api/movies/discover?${params.toString()}`
    } else {
      url = `/api/movies/popular?page=${currentPage.value}`
    }

    const response = await axios.get(url)

    if (response.data.results.length === 0 && isNewSearch) {
      errorMessage.value = searchQuery.value
        ? `Aucun résultat pour : "${searchQuery.value}"`
        : `Aucun film ne correspond aux filtres.`
    } else {
      movies.value = [...movies.value, ...response.data.results]
    }
  } catch (error) {
    errorMessage.value = "Connexion interrompue."
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const loadMore = () => {
  currentPage.value++
  loadMovies(false)
}

const applyFilters = () => {
  searchQuery.value = ''
  loadMovies(true)
}

const resetFilters = () => {
  selectedGenre.value = null
  selectedYear.value = null
  selectedMinRating.value = null
  loadMovies(true)
}

const loadGenres = async () => {
  try {
    const response = await axios.get('/api/genres')
    genres.value = response.data.genres || []
  } catch (error) {
    console.error('Erreur chargement genres:', error)
  }
}

const loadFavorites = async () => {
  try {
    const response = await axios.get('/api/favorites')
    favorites.value = response.data
  } catch (error) {
    console.error('Erreur chargement favoris:', error)
  }
}

const addToFavorites = async (movie) => {
  try {
    const payload = {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
    }
    await axios.post('/api/favorites', payload)
    await loadFavorites()
  } catch (error) {
    if (error.response && error.response.status === 400) {
      alert(`Déjà dans tes favoris.`)
    } else {
      alert("Erreur lors de l'ajout.")
    }
  }
}

const removeFavorite = async (favoriteId) => {
  try {
    await axios.delete(`/api/favorites/${favoriteId}`)
    favorites.value = favorites.value.filter(f => f.id !== favoriteId)
  } catch (error) {
    console.error('Erreur suppression:', error)
  }
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  if (isSidebarOpen.value) loadFavorites()
}

onMounted(() => {
  loadGenres()
  loadFavorites()
  loadMovies(true)
})
</script>

<template>
  <div class="app">
    <div class="grain"></div>
    <div class="vignette"></div>

    <!-- Top bar -->
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">●</span>
        <span class="brand-name">NOIR<span class="brand-dot">.</span>CINEMA</span>
      </div>
      <div class="topbar-meta">
        <span class="status-dot"></span>
        <span class="status-text">EN DIRECTION</span>
      </div>
      <button class="fav-toggle" @click="toggleSidebar">
        <span class="fav-toggle-label">Favoris</span>
        <span class="fav-toggle-count">{{ favorites.length.toString().padStart(2, '0') }}</span>
      </button>
    </header>

    <main class="main">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-meta">
          <span class="hero-tag">— Catalogue · Volume 01</span>
        </div>
        <h1 class="hero-title">
          <span class="title-line">Le cinéma</span>
          <span class="title-line title-accent">à l'état pur.</span>
        </h1>
        <p class="hero-sub">Explorez les ombres et les lumières du septième art.</p>
      </section>

      <!-- Search -->
      <section class="search">
        <div class="search-wrap">
          <span class="search-prefix">RECHERCHER /</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="titre, acteur, réalisateur..."
            @keyup.enter="loadMovies(true)"
            class="search-input"
          />
          <button @click="loadMovies(true)" class="search-btn">
            <span>Lancer</span>
            <span class="arrow">→</span>
          </button>
        </div>
      </section>

      <!-- Filtres -->
      <section class="filters">
        <div class="filters-label">FILTRES //</div>
        <div class="filters-row">
          <select v-model="selectedGenre" class="filter-select" @change="applyFilters">
            <option :value="null">Genre · tous</option>
            <option v-for="g in genres" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>

          <select v-model="selectedYear" class="filter-select" @change="applyFilters">
            <option :value="null">Année · toutes</option>
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>

          <select v-model="selectedMinRating" class="filter-select" @change="applyFilters">
            <option :value="null">Note · toutes</option>
            <option v-for="r in ratings" :key="r" :value="r">★ {{ r }}+</option>
          </select>

          <button
            v-if="hasActiveFilters"
            @click="resetFilters"
            class="filter-reset"
          >
            ✕ Effacer
          </button>
        </div>
      </section>

      <!-- Erreur -->
      <div v-if="errorMessage" class="error">
        <span class="error-bar"></span>
        <span class="error-text">{{ errorMessage }}</span>
      </div>

      <!-- Skeleton -->
      <div v-if="isLoading && movies.length === 0" class="grid">
        <div v-for="i in 10" :key="i" class="skeleton-card">
          <div class="skeleton-poster"></div>
        </div>
      </div>

      <!-- Grille films -->
      <div v-else class="grid">
        <article
          v-for="(movie, index) in movies"
          :key="`${movie.id}-${index}`"
          class="card"
          :style="{ animationDelay: `${(index % 20) * 30}ms` }"
        >
          <div class="card-frame">
            <img
              v-if="movie.poster_path"
              :src="'https://image.tmdb.org/t/p/w500' + movie.poster_path"
              :alt="movie.title"
              class="card-poster"
            />
            <div v-else class="card-noposter">
              <span>◇</span>
            </div>

            <div class="card-overlay">
              <button @click="addToFavorites(movie)" class="card-fav-btn">
                <span class="plus">+</span>
                <span>Ajouter</span>
              </button>
            </div>

            <div v-if="movie.vote_average" class="card-rating">
              {{ movie.vote_average.toFixed(1) }}
            </div>

            <div class="card-corner top-left"></div>
            <div class="card-corner top-right"></div>
            <div class="card-corner bottom-left"></div>
            <div class="card-corner bottom-right"></div>
          </div>

          <div class="card-info">
            <h3 class="card-title">{{ movie.title }}</h3>
            <div class="card-meta">
              <span v-if="movie.release_date">{{ movie.release_date.substring(0, 4) }}</span>
              <span class="card-num">N° {{ (index + 1).toString().padStart(3, '0') }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- Load more -->
      <div class="load-more" v-if="movies.length > 0 && !errorMessage">
        <button @click="loadMore" class="load-btn" :class="{ loading: isLoading }">
          <span v-if="!isLoading">— Continuer la projection —</span>
          <span v-else class="spinner">●</span>
        </button>
      </div>

      <!-- Footer marker -->
      <div class="footer-mark">
        <span>FIN DE BOBINE</span>
        <span class="reel">◉</span>
      </div>
    </main>

    <!-- Sidebar favoris -->
    <transition name="slide">
      <aside v-if="isSidebarOpen" class="sidebar">
        <div class="sidebar-header">
          <div>
            <div class="sidebar-eyebrow">— Votre sélection</div>
            <h2 class="sidebar-title">FAVORIS</h2>
          </div>
          <button class="close-btn" @click="toggleSidebar">✕</button>
        </div>

        <div class="sidebar-stat">
          <span class="stat-num">{{ favorites.length.toString().padStart(2, '0') }}</span>
          <span class="stat-label">FILM<span v-if="favorites.length > 1">S</span> DANS LA COLLECTION</span>
        </div>

        <div class="sidebar-content">
          <p v-if="favorites.length === 0" class="empty">
            <span class="empty-mark">○</span>
            <span class="empty-title">Aucun favori</span>
            <span class="empty-sub">Cliquez sur + sur une affiche pour l'ajouter à votre collection.</span>
          </p>
          <div v-else class="fav-list">
            <div v-for="(fav, idx) in favorites" :key="fav.id" class="fav-item">
              <span class="fav-num">{{ (idx + 1).toString().padStart(2, '0') }}</span>
              <img
                v-if="fav.poster_path"
                :src="'https://image.tmdb.org/t/p/w185' + fav.poster_path"
                :alt="fav.title"
                class="fav-poster"
              />
              <div v-else class="fav-poster fav-noposter">◇</div>
              <div class="fav-meta">
                <p class="fav-title">{{ fav.title }}</p>
                <p class="fav-id">ID · {{ fav.tmdb_id }}</p>
              </div>
              <button class="fav-remove" @click="removeFavorite(fav.id)">✕</button>
            </div>
          </div>
        </div>
      </aside>
    </transition>

    <transition name="fade">
      <div v-if="isSidebarOpen" class="overlay" @click="toggleSidebar"></div>
    </transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap');

.app {
  --bg: #0a0708;
  --bg-2: #110d0e;
  --bg-3: #1a1314;
  --crimson: #dc143c;
  --crimson-bright: #ff1f4a;
  --crimson-deep: #8b0a24;
  --ink: #f4ede4;
  --ink-dim: #a39d96;
  --ink-faint: #6b6560;
  --border: rgba(220, 20, 60, 0.15);
  --border-soft: rgba(244, 237, 228, 0.06);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.app {
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: 'JetBrains Mono', monospace;
  font-weight: 300;
  position: relative;
  overflow-x: hidden;
}

/* Grain texture overlay */
.grain {
  position: fixed; inset: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(244,237,228,0.03) 1px, transparent 0);
  background-size: 3px 3px;
  pointer-events: none;
  z-index: 1;
  opacity: 0.6;
  mix-blend-mode: overlay;
}

/* Red vignette */
.vignette {
  position: fixed; inset: 0;
  background: radial-gradient(ellipse at top, rgba(220,20,60,0.08), transparent 50%);
  pointer-events: none;
  z-index: 0;
}

/* TOP BAR */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 22px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-soft);
  background: rgba(10, 7, 8, 0.85);
  backdrop-filter: blur(10px);
}
.brand {
  display: flex; align-items: center; gap: 10px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.15rem;
  letter-spacing: 0.15em;
}
.brand-mark {
  color: var(--crimson);
  font-size: 0.8rem;
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.brand-name { color: var(--ink); }
.brand-dot { color: var(--crimson); }

.topbar-meta {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--ink-dim);
}
.status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--crimson-bright);
  box-shadow: 0 0 8px var(--crimson-bright);
  animation: pulse 1.8s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
.fav-toggle {
  display: flex; align-items: center; gap: 14px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--ink);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  padding: 10px 18px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.25s;
}
.fav-toggle:hover { border-color: var(--crimson); color: var(--crimson); }
.fav-toggle-count {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  color: var(--crimson);
  letter-spacing: 0;
}

/* MAIN */
.main {
  position: relative;
  z-index: 2;
  max-width: 1500px;
  margin: 0 auto;
  padding: 0 40px 80px;
}

/* HERO */
.hero { padding: 100px 0 70px; position: relative; }
.hero-meta { margin-bottom: 24px; }
.hero-tag {
  font-size: 0.75rem;
  color: var(--crimson);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  font-size: clamp(3.5rem, 9vw, 7rem);
  line-height: 0.95;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.title-line { display: block; }
.title-accent {
  color: var(--crimson);
  font-style: italic;
  font-weight: 400;
  text-shadow: 0 0 30px rgba(220, 20, 60, 0.4);
}
.hero-sub {
  margin-top: 28px;
  font-size: 0.9rem;
  color: var(--ink-dim);
  letter-spacing: 0.05em;
  max-width: 500px;
}

/* SEARCH */
.search { margin-bottom: 32px; }
.search-wrap {
  display: flex;
  align-items: stretch;
  background: var(--bg-2);
  border: 1px solid var(--border-soft);
  transition: border-color 0.25s, box-shadow 0.25s;
}
.search-wrap:focus-within {
  border-color: var(--crimson);
  box-shadow: 0 0 0 1px var(--crimson), 0 0 30px rgba(220,20,60,0.15);
}
.search-prefix {
  display: flex; align-items: center;
  padding: 0 20px;
  font-size: 0.7rem;
  color: var(--crimson);
  letter-spacing: 0.2em;
  border-right: 1px solid var(--border-soft);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 22px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  color: var(--ink);
  min-width: 0;
}
.search-input::placeholder { color: var(--ink-faint); }
.search-btn {
  background: var(--crimson);
  color: var(--ink);
  border: none;
  padding: 0 32px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex; align-items: center; gap: 10px;
  transition: background 0.2s;
}
.search-btn:hover { background: var(--crimson-bright); }
.search-btn .arrow { transition: transform 0.2s; }
.search-btn:hover .arrow { transform: translateX(4px); }

/* FILTERS */
.filters {
  display: flex; align-items: center;
  gap: 20px; margin-bottom: 56px;
  padding-top: 20px;
  border-top: 1px solid var(--border-soft);
}
.filters-label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--ink-faint);
  flex-shrink: 0;
}
.filters-row {
  display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
}
.filter-select {
  background: transparent;
  border: 1px solid var(--border-soft);
  color: var(--ink);
  padding: 10px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
  min-width: 170px;
}
.filter-select:hover, .filter-select:focus {
  border-color: var(--crimson);
  color: var(--crimson);
  outline: none;
}
.filter-select option { background: var(--bg-2); color: var(--ink); text-transform: none; }
.filter-reset {
  background: transparent;
  border: 1px solid var(--crimson);
  color: var(--crimson);
  padding: 10px 18px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}
.filter-reset:hover { background: var(--crimson); color: var(--ink); }

/* ERROR */
.error {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 20px;
  background: rgba(220, 20, 60, 0.08);
  border-left: 3px solid var(--crimson);
  margin-bottom: 32px;
}
.error-bar {
  width: 8px; height: 8px;
  background: var(--crimson);
  animation: blink 1.2s infinite;
  flex-shrink: 0;
}
.error-text {
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  color: var(--ink);
}

/* GRID */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 32px 24px;
}

/* CARD */
.card {
  animation: fadeIn 0.6s ease both;
  cursor: pointer;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.card-frame {
  position: relative;
  aspect-ratio: 2/3;
  overflow: hidden;
  background: var(--bg-2);
  transition: all 0.4s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.card:hover .card-frame {
  transform: translateY(-4px);
  box-shadow:
    0 20px 50px rgba(0,0,0,0.6),
    0 0 0 1px var(--crimson),
    0 0 60px rgba(220, 20, 60, 0.3);
}
.card:hover .card-overlay { opacity: 1; }
.card:hover .card-corner { opacity: 1; transform: scale(1); }

.card-poster {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.6s ease, filter 0.4s ease;
  filter: contrast(1.05) saturate(0.85);
}
.card:hover .card-poster {
  transform: scale(1.08);
  filter: contrast(1.1) saturate(1);
}
.card-noposter {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 3rem; color: var(--ink-faint);
  background: linear-gradient(135deg, var(--bg-2), var(--bg-3));
}
.card-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(10,7,8,0.95) 0%, rgba(10,7,8,0.5) 40%, transparent 80%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
  opacity: 0;
  transition: opacity 0.3s;
}
.card-fav-btn {
  display: flex; align-items: center; gap: 8px;
  background: var(--crimson);
  border: none;
  color: var(--ink);
  padding: 10px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}
.card-fav-btn:hover {
  background: var(--crimson-bright);
  transform: scale(1.05);
}
.plus { font-size: 1rem; line-height: 1; }

.card-rating {
  position: absolute;
  top: 12px; right: 12px;
  background: rgba(10, 7, 8, 0.9);
  color: var(--crimson);
  padding: 5px 10px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.9rem;
  letter-spacing: 0.05em;
  border-left: 2px solid var(--crimson);
  backdrop-filter: blur(4px);
}

/* Corner brackets */
.card-corner {
  position: absolute;
  width: 16px; height: 16px;
  border-color: var(--crimson);
  border-style: solid;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.3s;
}
.card-corner.top-left { top: 8px; left: 8px; border-width: 2px 0 0 2px; }
.card-corner.top-right { top: 8px; right: 8px; border-width: 2px 2px 0 0; }
.card-corner.bottom-left { bottom: 8px; left: 8px; border-width: 0 0 2px 2px; }
.card-corner.bottom-right { bottom: 8px; right: 8px; border-width: 0 2px 2px 0; }

.card-info { margin-top: 14px; }
.card-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
  transition: color 0.2s;
}
.card:hover .card-title { color: var(--crimson); }
.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  color: var(--ink-faint);
  text-transform: uppercase;
}
.card-num { color: var(--crimson-deep); }

/* SKELETON */
.skeleton-card .skeleton-poster {
  aspect-ratio: 2/3;
  background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* LOAD MORE */
.load-more { display: flex; justify-content: center; margin: 80px 0 40px; }
.load-btn {
  background: transparent;
  border: 1px solid var(--border-soft);
  color: var(--ink);
  padding: 18px 44px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s;
}
.load-btn:hover {
  border-color: var(--crimson);
  color: var(--crimson);
  letter-spacing: 0.4em;
}
.load-btn.loading { opacity: 0.5; cursor: not-allowed; }
.spinner {
  display: inline-block;
  color: var(--crimson);
  animation: spin 1.2s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* FOOTER MARK */
.footer-mark {
  margin-top: 60px;
  padding-top: 30px;
  border-top: 1px solid var(--border-soft);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  letter-spacing: 0.3em;
  color: var(--ink-faint);
}
.reel { color: var(--crimson); font-size: 1rem; }

/* SIDEBAR */
.sidebar {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: min(440px, 90vw);
  background: var(--bg-2);
  border-left: 1px solid var(--crimson);
  z-index: 100;
  display: flex; flex-direction: column;
  box-shadow: -30px 0 60px rgba(0, 0, 0, 0.7);
}
.sidebar::before {
  content: '';
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, var(--crimson), var(--crimson-deep) 50%, var(--crimson));
}
.sidebar-header {
  padding: 28px 28px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-soft);
}
.sidebar-eyebrow {
  font-size: 0.7rem;
  color: var(--crimson);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.sidebar-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.2rem;
  letter-spacing: 0.05em;
  color: var(--ink);
}
.close-btn {
  background: transparent;
  border: 1px solid var(--border-soft);
  color: var(--ink-dim);
  width: 36px; height: 36px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.close-btn:hover { border-color: var(--crimson); color: var(--crimson); }

.sidebar-stat {
  padding: 20px 28px;
  display: flex; align-items: baseline; gap: 14px;
  border-bottom: 1px solid var(--border-soft);
}
.stat-num {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 3rem;
  color: var(--crimson);
  line-height: 1;
}
.stat-label {
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: var(--ink-faint);
}

.sidebar-content { flex: 1; overflow-y: auto; padding: 20px 28px 28px; }
.empty {
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
  padding: 60px 20px;
  gap: 10px;
}
.empty-mark { font-size: 2rem; color: var(--crimson-deep); margin-bottom: 8px; }
.empty-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.4rem;
  letter-spacing: 0.1em;
  color: var(--ink);
}
.empty-sub {
  font-size: 0.75rem;
  color: var(--ink-faint);
  letter-spacing: 0.05em;
  line-height: 1.6;
  max-width: 240px;
}

.fav-list { display: flex; flex-direction: column; gap: 12px; }
.fav-item {
  display: flex; align-items: center; gap: 14px;
  padding: 10px;
  background: var(--bg);
  border: 1px solid var(--border-soft);
  transition: all 0.2s;
}
.fav-item:hover { border-color: var(--crimson); }
.fav-num {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2rem;
  color: var(--crimson-deep);
  letter-spacing: 0.05em;
  width: 28px;
  flex-shrink: 0;
  text-align: center;
}
.fav-poster { width: 50px; height: 75px; object-fit: cover; flex-shrink: 0; }
.fav-noposter {
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-3);
  font-size: 1rem;
  color: var(--ink-faint);
}
.fav-meta { flex: 1; min-width: 0; }
.fav-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 3px;
}
.fav-id {
  font-size: 0.65rem;
  color: var(--ink-faint);
  letter-spacing: 0.1em;
}
.fav-remove {
  background: transparent;
  border: none;
  color: var(--ink-faint);
  font-size: 0.85rem;
  cursor: pointer;
  width: 26px; height: 26px;
  transition: color 0.2s;
  flex-shrink: 0;
}
.fav-remove:hover { color: var(--crimson); }

/* OVERLAY */
.overlay {
  position: fixed; inset: 0;
  background: rgba(10, 7, 8, 0.7);
  backdrop-filter: blur(3px);
  z-index: 99;
}

/* TRANSITIONS */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .topbar { padding: 16px 20px; }
  .topbar-meta { display: none; }
  .brand-name { font-size: 0.95rem; }
  .main { padding: 0 20px 60px; }
  .hero { padding: 60px 0 40px; }
  .filters { flex-direction: column; align-items: flex-start; gap: 12px; }
  .filters-row { width: 100%; }
  .filter-select { flex: 1; min-width: 0; }
  .search-prefix { display: none; }
}
</style>
