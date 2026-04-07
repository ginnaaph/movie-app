## Secret handling

This project currently calls TMDB directly from the Expo client using
`EXPO_PUBLIC_MOVIE_API_KEY`.

That value can be hidden from Git by keeping it in a local `.env` file, but it
cannot be kept secret from end users as long as the mobile/web client sends
requests to TMDB itself. Expo `EXPO_PUBLIC_*` variables are intentionally exposed
to client code.

If you need the TMDB credential to stay private, move TMDB requests behind a
server you control, for example:

- an Appwrite Function
- a small Node/Express API
- a serverless function on Vercel, Netlify, or Cloudflare

Then the Expo app should call your backend endpoint instead of TMDB directly.
