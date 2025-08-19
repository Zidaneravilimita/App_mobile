// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Importez les nouveaux écrans
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OrganizerScreen from '../screens/OrganizerScreen';
import EventCreatorScreen from '../screens/EventCreatorScreen';

// Importez les écrans existants de l'application principale
import HomeScreen from '../screens/HomeScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import ImageUploader from '../components/ImageUploader'; // Le composant est toujours utilisé, mais l'écran est séparé.

const Stack = createNativeStackNavigator();

/**
 * Navigateur de l'application.
 * Définit le flux de navigation entre les écrans.
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Écran initial de bienvenue */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />

        {/* Écrans d'authentification pour les visiteurs */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />

        {/* Écrans spécifiques aux organisateurs */}
        <Stack.Screen name="OrganizerScreen" component={OrganizerScreen} />
        <Stack.Screen name="EventCreator" component={EventCreatorScreen} />

        {/* L'application principale pour les visiteurs et les organisateurs une fois connectés */}
        <Stack.Screen name="MainApp" component={MainAppStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Navigateur pour les écrans principaux de l'application
function MainAppStack() {
  const MainStack = createNativeStackNavigator();
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Accueil" component={HomeScreen} />
      <MainStack.Screen name="EventDetails" component={EventDetailsScreen} />
      {/* On peut ajouter d'autres écrans ici, comme un profil ou un fil d'actualités */}
    </MainStack.Navigator>
  );
}
