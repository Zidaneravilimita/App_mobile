// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Écrans d'authentification et d'accueil
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

// Écrans spécifiques
import OrganizerScreen from '../screens/OrganizerScreen';

// Application principale
import HomeScreen from '../screens/HomeScreen';
import VisitorHomeScreen from '../screens/VisitorHomeScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import AttendedScreen from '../screens/AttendedScreen';
import HelpScreen from '../screens/HelpScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import ImageUploader from '../components/ImageUploader';

// Nouvel écran de recherche
import SearchScreen from '../screens/SearchScreen';

// Écran des notifications
import NotifyScreen from '../screens/NotifyScreen';
import NotifyDetailScreen from '../screens/NotifyDetailScreen';

const Stack = createNativeStackNavigator();

/**
 * Navigateur principal de l'application.
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Écran initial de bienvenue */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        {/* Écrans d'authentification */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        {/* Écrans spécifiques aux organisateurs */}
        <Stack.Screen name="OrganizerScreen" component={OrganizerScreen} />

        {/* Application principale */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="VisitorHome" component={VisitorHomeScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="MyEvents" component={MyEventsScreen} />
        <Stack.Screen name="Attended" component={AttendedScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        
        {/* Notifications */}
        <Stack.Screen name="Notify" component={NotifyScreen} />
        <Stack.Screen name="NotifyDetail" component={NotifyDetailScreen} />

        {/* Profil */}
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Chat (optionnel) */}
        <Stack.Screen name="Chat" component={ChatScreen} />

        {/* Upload / Add */}
        <Stack.Screen name="Add" component={ImageUploader} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
