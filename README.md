# Movie App
## About this project
This is a full stack mobile application I build as part of my journey to learn React Native. Building this project helped me transition my web development skills to mobile by learning core concepts like file-based routing with Expo, native UI components, custom hooks, and integrating a Backend-as-a-Service (BaaS)

## Key Features 
- Discover and Search: Browse the most popular movies globally or use the dedicated search screen to find any movie in seconds
- Smart Search Optimization: The search bar utilizes debouncing to delay API requests until the user stops typing, saving network resources and bypassing API rate limit
- Custom Trending Algorithm: A dynamic "Trending Movies" horizontal list on the home screen that actually tracks what users are searching for within the app in real-time, displaying the highest-ranked searches using an Appwrite database
- Deep Movie Details: Click on any movie card to navigate to a dynamic route displaying high-resolution poster art, ratings, runtime, budget, revenue, and production companies
- Custom Tab Navigation: A fully customized native bottom tab navigation bar featuring distinct icons for Home, Search, Saved, and Profile screens

  ## Tech Stacks and Concepts Learned
  - Framework: React Native & Expo (utilizing Expo Router for file-based routing
  - Styling: Nativewind
  - Backend & Database: Appwrite (used to store and query search metrics
  - Data Fetching: TMBD API via a custom built reusable `useFetch` hook
  - Performance: Implemented FlatList for lazy rendering and optimized memory usage on long lists of data
 
  ### Acknowledgements
  This project was built following React Native Crash Course by JS Mastery. 
  
