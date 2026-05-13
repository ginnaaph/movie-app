type ListItemMetadata = {
  title: string;
  poster_url: string;
  release_date?: string;
  vote_average?: number;
};

const hasValue = (value: unknown) =>
  value !== undefined && value !== null && value !== "";

export const getListItemMetadataRepairPayload = ({
  existing,
  next,
}: {
  existing: Pick<
    ListItem,
    "title" | "poster_url" | "release_date" | "vote_average"
  >;
  next: ListItemMetadata;
}): Partial<ListItemMetadata> | null => {
  const patch: Partial<ListItemMetadata> = {};

  if (existing.title !== next.title) {
    patch.title = next.title;
  }

  if (!hasValue(existing.poster_url) && hasValue(next.poster_url)) {
    patch.poster_url = next.poster_url;
  }

  if (!hasValue(existing.release_date) && hasValue(next.release_date)) {
    patch.release_date = next.release_date;
  }

  if (!hasValue(existing.vote_average) && hasValue(next.vote_average)) {
    patch.vote_average = next.vote_average;
  }

  return Object.keys(patch).length > 0 ? patch : null;
};
