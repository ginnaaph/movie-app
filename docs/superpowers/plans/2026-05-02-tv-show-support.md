# TV Show Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TV show discovery, details, and saved/list support alongside existing movie flows.

**Architecture:** Introduce shared media types at the API and persistence boundary while preserving existing movie routes and UI. Add a TV detail route that reuses the movie detail layout patterns with TV-specific labels and metadata. Keep Appwrite backward compatible by defaulting missing row `media_type` values to movie.

**Tech Stack:** Expo Router, React Native, NativeWind, TMDB API, react-native-appwrite, TypeScript.

---

### Task 1: Shared Media Types And API

**Files:**
- Modify: `interfaces/interfaces.d.ts`
- Modify: `services/api.ts`

- [ ] Add `MediaType`, `MediaItem`, and TV result/detail interfaces.
- [ ] Add `fetchTvShows` using `/search/tv` and `/discover/tv`.
- [ ] Add `fetchTvDetails` using `/tv/{id}?append_to_response=credits`.
- [ ] Run `npx tsc --noEmit` and fix type errors.

### Task 2: Appwrite Media Compatibility

**Files:**
- Modify: `services/appwrite.ts`

- [ ] Make saved metrics, list items, and watch history carry `media_type` and `media_id`.
- [ ] Update lookups to match by type and id while defaulting missing rows to movies.
- [ ] Keep `movie_id` populated for current Appwrite schemas.
- [ ] Export media-generic helper names while keeping existing movie helper names available.
- [ ] Run `npx tsc --noEmit` and fix type errors.

### Task 3: Cards And Discover

**Files:**
- Modify: `components/MovieCard.tsx`
- Modify: `components/TrendingCard.tsx`
- Modify: `components/SavedMovieCard.tsx`
- Modify: `app/(tabs)/search.tsx`
- Modify: `app/(tabs)/saved.tsx`

- [ ] Let cards route by `media_type`.
- [ ] Add Movies/TV segmented control in Discover.
- [ ] Use TV fetch/search/trending paths when TV is selected.
- [ ] Update saved copy to say titles instead of movies.
- [ ] Run `npx tsc --noEmit` and fix type errors.

### Task 4: TV Detail Route

**Files:**
- Create: `app/tv/[id].tsx`

- [ ] Build TV detail route from the movie details screen pattern.
- [ ] Use TV metadata: first air year, seasons, runtime, status, language, creators, cast, crew, and networks.
- [ ] Wire save, watched, and custom list actions through media-aware helpers.
- [ ] Run `npx tsc --noEmit` and fix type errors.

### Task 5: Final Verification

**Files:**
- Inspect changed files only.

- [ ] Run `npm run lint`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Start Expo with `npm run start` if lint and TypeScript pass.
