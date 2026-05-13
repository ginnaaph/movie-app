import { strict as assert } from "node:assert";
import { getListItemMetadataRepairPayload } from "../services/listItemMetadata";

assert.deepEqual(
  getListItemMetadataRepairPayload({
    existing: {
      title: "Old title",
      poster_url: "",
    },
    next: {
      title: "The Devil Wears Prada",
      poster_url: "https://image.tmdb.org/t/p/w500/poster.jpg",
      release_date: "2006-06-30",
      vote_average: 7.4,
    },
  }),
  {
    title: "The Devil Wears Prada",
    poster_url: "https://image.tmdb.org/t/p/w500/poster.jpg",
    release_date: "2006-06-30",
    vote_average: 7.4,
  },
);

assert.equal(
  getListItemMetadataRepairPayload({
    existing: {
      title: "The Devil Wears Prada",
      poster_url: "https://image.tmdb.org/t/p/w500/poster.jpg",
      release_date: "2006-06-30",
      vote_average: 7.4,
    },
    next: {
      title: "The Devil Wears Prada",
      poster_url: "https://image.tmdb.org/t/p/w500/poster.jpg",
      release_date: "2006-06-30",
      vote_average: 7.4,
    },
  }),
  null,
);
