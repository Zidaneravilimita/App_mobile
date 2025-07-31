// App.js
import React from 'react';
import HomeScreen from './src/screens/HomeScreen'; // HomeScreen est la page d'accueil
import 'react-native-url-polyfill/auto'; // Très important pour Supabase

export default function App() {
  return <HomeScreen />;
}
