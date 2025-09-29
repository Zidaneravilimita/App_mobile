# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Mobile app built with Expo (React Native 0.81, Expo SDK 54) and React Navigation (native stack).
- Data/backend via Supabase (auth, Postgres tables, storage, realtime). See src/config/supabase.js.
- Entry points: index.js (registerRootComponent, fetch polyfill) -> App.js -> src/navigation/AppNavigator.js.
- Platform assets/config in app.json and android/ (managed via Expo tooling).

Common commands (PowerShell-friendly)
- Install deps
  npm install

- Start Metro bundler (Expo dev server)
  npm run start

- Run on Android (builds and launches native app)
  npm run android

- Run on Web (React Native Web)
  npm run web

- iOS (defined, but requires macOS)
  npm run ios

Build and distribute (EAS)
- Profiles are defined in eas.json: development (dev client/internal), preview (internal), production (store, Android APK).
- Example builds
  npx eas build -p android --profile development
  npx eas build -p android --profile preview
  npx eas build -p android --profile production

Notes for features requiring native capabilities
- Push notifications (expo-notifications) in this app are guarded to avoid unsupported paths:
  - On Expo Go and on Web, remote push tokens are not available; use a Development Build created with EAS to test push.
  - See src/screens/NotifyScreen.js for guarded logic and navigation on notification responses.

High-level architecture
- Navigation
  - src/navigation/AppNavigator.js defines a single native stack with the following routes (header hidden by default):
    - Welcome (entry landing)
    - Login and Signup (Supabase auth flows, AsyncStorage session cache)
    - OrganizerScreen (organizer-specific signup, upserts profiles)
    - Home (main organizer experience; includes inline uploader mode)
    - VisitorHome (visitor experience; Add button hidden)
    - Search (server-side filtered search)
    - EventDetails (fetches an event and resolves relational names; robust fallbacks)
    - Notify and NotifyDetail (notification inbox and detail views)
    - Profile (hybrid online/offline profile with image upload and local cache)
    - Chat (simple realtime channel per chat_id)
    - Add (ImageUploader component-driven flow)

- Data layer (Supabase)
  - Client: src/config/supabase.js. Used throughout screens/components.
  - Tables referenced (from code):
    - profiles (user profile metadata)
    - events (id_event, titre, description, date_event, lieu_detail, image_url, id_category, id_ville, optional id_user)
    - ville (id_ville, nom_ville)
    - category (id_category, nom_category, description, photo)
    - notifications_queue (title, body, payload, is_sent, timestamps)
    - messages (chat messages; used by ChatScreen with realtime subscription)
  - Storage bucket: images (used for avatar and event image uploads). Public URL generation is handled after upload.

- Screens (responsibilities and key interactions)
  - HomeScreen and VisitorHomeScreen
    - Load categories (CategoryScroll) and villes, fetch events with optional filters (ville, category), then apply a local time-based filter (all | upcoming | past) and sort by date (desc) for display.
    - Organizer Home can switch to an inline Add flow which renders ImageUploader in place.
  - LoginScreen / SignupScreen
    - Supabase auth flows with basic notifications, profile fetch/upsert, and AsyncStorage persistence. Login supports visitor mode redirect.
  - OrganizerScreen
    - Dedicated organizer signup; upserts profiles with role=organisateur, then navigates to Add.
  - SearchScreen
    - Server-side filtered search on events, using ilike on titre and optional ville/category filters, sorted by date desc.
  - EventDetailsScreen
    - Accepts either a full event object or id_event. If given an id, fetches the row, resolves ville and category names, and displays; robust error/loading states.
  - ProfileScreen
    - Hybrid mode: tries Supabase first; if unavailable, falls back to local (AsyncStorage) profile defaults. Supports avatar change (expo-image-picker) with upload to storage when available; updates both auth and profiles rows when connected. Shows connection status and provides an explicit refresh.
  - NotifyScreen / NotifyDetailScreen
    - Lists notifications from notifications_queue; includes actions to refresh, mark as read (and clear badge on supported platforms), and view payload details. Guards around Expo Go and Web.
  - ChatScreen
    - Loads the latest messages for a chat_id and subscribes to realtime INSERTs via supabase.channel; simple input and send path.

- Shared UI components
  - Header: avatar resolution (Supabase user/profile or AsyncStorage fallback), unread notification counter, and a Notify button.
  - BottomNavBar: main nav shortcuts and central Add button (navigates to Add or calls parent onAddPress).
  - CategoryScroll: horizontally scrollable category selector, internally loads categories and returns selected id to parent.
  - EventCard: visual card with date formatting and graceful image handling (cache-busting, error fallback).
  - ImageUploader: end-to-end event creation form including image selection (expo-image-picker), bucket detection, image upload with FormData fallback to blob, and events insert. Provides network/offline banners and guarded UX.

Platform and tooling
- app.json holds Expo app configuration (name/slug, icons, plugins, Android package, EAS projectId).
- babel.config.js uses babel-preset-expo and requires react-native-reanimated/plugin as the last plugin (already set correctly).
- tsconfig.json extends expo/tsconfig.base; the app’s code is predominantly JavaScript.
- Android Gradle files exist under android/ but are managed by Expo tooling (React Native Gradle plugin + Expo autolinking). For day-to-day development, prefer npm run android or EAS builds.

Linting and tests
- No lint configuration or npm scripts are defined for linting.
- No test runner or npm scripts are defined for tests.

Operational notes (helpful when running locally)
- The app uses AsyncStorage to cache user/session/profile data in several screens.
- fetch is polyfilled in index.js via cross-fetch to ensure availability across environments.
- Some features (notifications, storage upload) intentionally degrade or short-circuit on Web or when running in Expo Go; use a Development Build to exercise full native behavior.
