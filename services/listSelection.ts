type ListDestinationPlan = {
  shouldAddSaved: boolean;
  shouldRemoveSaved: boolean;
  customListIdsToAdd: string[];
  customListIdsToRemove: string[];
  alreadyInDestination: boolean;
};

export const isSavedList = (list: MovieList) => list.slug === "saved-list";

export const planSingleListDestination = ({
  destinationList,
  savedList,
  currentSaved,
  currentCustomListIds,
}: {
  destinationList: MovieList;
  savedList: MovieList;
  currentSaved: boolean;
  currentCustomListIds: string[];
}): ListDestinationPlan => {
  const destinationIsSaved = destinationList.$id === savedList.$id;
  const alreadyInDestination = destinationIsSaved
    ? currentSaved && currentCustomListIds.length === 0
    : !currentSaved &&
      currentCustomListIds.length === 1 &&
      currentCustomListIds[0] === destinationList.$id;

  if (alreadyInDestination) {
    return {
      shouldAddSaved: false,
      shouldRemoveSaved: false,
      customListIdsToAdd: [],
      customListIdsToRemove: [],
      alreadyInDestination: true,
    };
  }

  return {
    shouldAddSaved: destinationIsSaved && !currentSaved,
    shouldRemoveSaved: !destinationIsSaved && currentSaved,
    customListIdsToAdd: destinationIsSaved ? [] : [destinationList.$id],
    customListIdsToRemove: currentCustomListIds.filter(
      (listId) => listId !== destinationList.$id,
    ),
    alreadyInDestination: false,
  };
};

export const getListDestinationLabel = ({
  currentSaved,
  currentCustomListIds,
  lists,
}: {
  currentSaved: boolean;
  currentCustomListIds: string[];
  lists: MovieList[];
}) => {
  if (currentSaved) return "Saved";

  const customList = lists.find((list) =>
    currentCustomListIds.includes(list.$id),
  );

  return customList?.name ?? "My List";
};
