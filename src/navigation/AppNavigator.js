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
import EventCreatorScreen from '../screens/EventCreatorScreen';

// Application principale
import HomeScreen from '../screens/HomeScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';

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
        <Stack.Screen name="EventCreator" component={EventCreatorScreen} />

        {/* Application principale pour les utilisateurs connectés */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
