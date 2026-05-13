import { strict as assert } from "node:assert";
import {
  getListDestinationLabel,
  planSingleListDestination,
} from "../services/listSelection";

const savedList = {
  $id: "saved-list-id",
  user_id: "user-1",
  name: "Saved",
  slug: "saved-list",
  type: "system",
  is_default: true,
} satisfies MovieList;

const favoritesList = {
  $id: "favorites-id",
  user_id: "user-1",
  name: "Favorites",
  slug: "favorites",
  type: "custom",
  is_default: false,
} satisfies MovieList;

const watchPartyList = {
  $id: "watch-party-id",
  user_id: "user-1",
  name: "Watch Party",
  slug: "watch-party",
  type: "custom",
  is_default: false,
} satisfies MovieList;

assert.deepEqual(
  planSingleListDestination({
    destinationList: favoritesList,
    savedList,
    currentSaved: true,
    currentCustomListIds: [watchPartyList.$id],
  }),
  {
    shouldAddSaved: false,
    shouldRemoveSaved: true,
    customListIdsToAdd: [favoritesList.$id],
    customListIdsToRemove: [watchPartyList.$id],
    alreadyInDestination: false,
  },
);

assert.deepEqual(
  planSingleListDestination({
    destinationList: favoritesList,
    savedList,
    currentSaved: false,
    currentCustomListIds: [favoritesList.$id],
  }),
  {
    shouldAddSaved: false,
    shouldRemoveSaved: false,
    customListIdsToAdd: [],
    customListIdsToRemove: [],
    alreadyInDestination: true,
  },
);

assert.deepEqual(
  planSingleListDestination({
    destinationList: savedList,
    savedList,
    currentSaved: false,
    currentCustomListIds: [favoritesList.$id, watchPartyList.$id],
  }),
  {
    shouldAddSaved: true,
    shouldRemoveSaved: false,
    customListIdsToAdd: [],
    customListIdsToRemove: [favoritesList.$id, watchPartyList.$id],
    alreadyInDestination: false,
  },
);

assert.equal(
  getListDestinationLabel({
    currentSaved: true,
    currentCustomListIds: [],
    lists: [savedList, favoritesList],
  }),
  "Saved",
);

assert.equal(
  getListDestinationLabel({
    currentSaved: false,
    currentCustomListIds: [favoritesList.$id],
    lists: [savedList, favoritesList],
  }),
  "Favorites",
);

assert.equal(
  getListDestinationLabel({
    currentSaved: false,
    currentCustomListIds: [],
    lists: [savedList, favoritesList],
  }),
  "My List",
);
