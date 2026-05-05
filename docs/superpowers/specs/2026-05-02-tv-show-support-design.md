# TV Show Support Design

## Goal

Add TV shows to FrameLog without creating a separate app experience. Users can switch Discover between movies and TV shows, open TV detail pages, and save or track shows in the same lists they already use for movies.

## Approach

The app will keep the current movie-first UI patterns and introduce a shared media item shape where TMDB movie and TV results differ. Movies keep `/movies/[id]`; TV shows use `/tv/[id]`. Search, cards, saved lists, and Appwrite helpers will carry `media_type` so titles with the same TMDB id do not collide across movies and TV.

## User Experience

Discover gets a compact Movies/TV segmented control above search. The selected media type controls placeholder copy, search/discovery endpoints, result cards, trending rows, and empty/error messages. TV details reuse the cinematic detail layout with TV-specific metadata such as first air year, episode runtime, seasons, status, language, creators, cast, and networks.

Saved and custom lists remain unified. Cards show the item type and route to the correct detail page. Existing movie rows without `media_type` are treated as movies for backward compatibility.

## Data And Persistence

TMDB API helpers will add `fetchTvShows` and `fetchTvDetails`. Appwrite rows will prefer new `media_type` and `media_id` fields while still reading and writing the existing `movie_id` field to keep the current schema usable. In local fallback state, movies and TV shows are separated by both type and id.

## Error Handling

Network/API failures continue to surface through existing loading and error states. Appwrite schema or permission failures continue to use local fallback behavior. If new Appwrite media fields are missing, writes still include `movie_id` and in-memory fallback keeps the app usable during development.

## Testing

Because the project has no test runner configured, verification will use TypeScript and Expo lint. The implementation will minimize pure logic changes and keep route, type, and helper names explicit so static checks catch integration mistakes.
