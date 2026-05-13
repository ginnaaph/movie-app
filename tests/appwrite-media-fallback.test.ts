import { strict as assert } from "node:assert";
import {
  getMediaFieldFallbackPayloads,
  optionalMediaMetadataKeys,
} from "../services/appwritePayloads";

assert.deepEqual(optionalMediaMetadataKeys, [
  "release_date",
  "vote_average",
  "saved",
]);

const payload = {
  user_id: "user-1",
  list_id: "list-1",
  media_type: "tv",
  title: "Severance",
};

const fallbacks = getMediaFieldFallbackPayloads(payload, 95396);

assert.deepEqual(fallbacks, [
  {
    user_id: "user-1",
    list_id: "list-1",
    media_type: "tv",
    title: "Severance",
    media_id: 95396,
    movie_id: 95396,
  },
  {
    user_id: "user-1",
    list_id: "list-1",
    title: "Severance",
    media_id: 95396,
    movie_id: 95396,
  },
  {
    user_id: "user-1",
    list_id: "list-1",
    media_type: "tv",
    title: "Severance",
    media_id: 95396,
  },
  {
    user_id: "user-1",
    list_id: "list-1",
    title: "Severance",
    media_id: 95396,
  },
  {
    user_id: "user-1",
    list_id: "list-1",
    media_type: "tv",
    title: "Severance",
    movie_id: 95396,
  },
  {
    user_id: "user-1",
    list_id: "list-1",
    title: "Severance",
    movie_id: 95396,
  },
]);

const fullPayloadFallbacks = getMediaFieldFallbackPayloads(
  {
    user_id: "user-1",
    searchTerm: "Severance",
    count: 0,
    media_type: "tv",
    title: "Severance",
    poster_url: "https://image.tmdb.org/t/p/w500/poster.jpg",
    release_date: "2022-02-18",
    vote_average: 8.4,
    saved: true,
  },
  95396,
);

assert.ok(
  fullPayloadFallbacks.some(
    (fallback) =>
      !("release_date" in fallback) &&
      fallback.poster_url === "https://image.tmdb.org/t/p/w500/poster.jpg" &&
      fallback.vote_average === 8.4 &&
      fallback.saved === true &&
      fallback.title === "Severance" &&
      fallback.movie_id === 95396,
  ),
);

assert.ok(
  fullPayloadFallbacks.some(
    (fallback) =>
      !("release_date" in fallback) &&
      !("vote_average" in fallback) &&
      (!("saved" in fallback) || fallback.saved === true) &&
      fallback.poster_url === "https://image.tmdb.org/t/p/w500/poster.jpg" &&
      fallback.title === "Severance" &&
      fallback.movie_id === 95396,
  ),
);

assert.ok(
  fullPayloadFallbacks.every(
    (fallback) =>
      fallback.poster_url === "https://image.tmdb.org/t/p/w500/poster.jpg",
  ),
);
