const omitKey = (
  payload: Record<string, unknown>,
  key: string,
): Record<string, unknown> => {
  const { [key]: _removed, ...rest } = payload;
  return rest;
};

const withMediaIdPayload = <T extends Record<string, unknown>>(
  data: T,
  mediaId: number,
): T & { media_id?: number; movie_id?: number } => ({
  ...data,
  media_id: mediaId,
  movie_id: mediaId,
});

const omitKeys = (
  payload: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> =>
  keys.reduce((current, key) => omitKey(current, key), payload);

export const optionalMediaMetadataKeys = [
  "release_date",
  "vote_average",
  "saved",
];

export const getMediaFieldFallbackPayloads = (
  data: Record<string, unknown>,
  mediaId: number,
): Record<string, unknown>[] => {
  const withMediaIds = withMediaIdPayload(data, mediaId);
  const withoutMediaType = omitKey(data, "media_type");
  const withoutOptionalMetadata = omitKeys(data, optionalMediaMetadataKeys);
  const withoutMediaTypeOrOptionalMetadata = omitKey(
    withoutOptionalMetadata,
    "media_type",
  );
  const withSingleOptionalMetadataKeyRemoved = optionalMediaMetadataKeys.flatMap(
    (key) => {
      const withoutKey = omitKey(data, key);
      const withoutKeyOrMediaType = omitKey(withoutKey, "media_type");

      return [
        withMediaIdPayload(withoutKey, mediaId),
        omitKey(withMediaIdPayload(withoutKey, mediaId), "media_type"),
        { ...withoutKey, media_id: mediaId },
        { ...withoutKeyOrMediaType, media_id: mediaId },
        { ...withoutKey, movie_id: mediaId },
        { ...withoutKeyOrMediaType, movie_id: mediaId },
      ];
    },
  );

  const payloads = [
    withMediaIds,
    omitKey(withMediaIds, "media_type"),
    { ...data, media_id: mediaId },
    { ...withoutMediaType, media_id: mediaId },
    { ...data, movie_id: mediaId },
    { ...withoutMediaType, movie_id: mediaId },
    ...withSingleOptionalMetadataKeyRemoved,
    withMediaIdPayload(withoutOptionalMetadata, mediaId),
    omitKey(withMediaIdPayload(withoutOptionalMetadata, mediaId), "media_type"),
    { ...withoutOptionalMetadata, media_id: mediaId },
    { ...withoutMediaTypeOrOptionalMetadata, media_id: mediaId },
    { ...withoutOptionalMetadata, movie_id: mediaId },
    { ...withoutMediaTypeOrOptionalMetadata, movie_id: mediaId },
  ];

  const seen = new Set<string>();
  return payloads.filter((payload) => {
    const key = JSON.stringify(payload);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
