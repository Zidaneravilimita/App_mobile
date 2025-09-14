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
import EventDetailsScreen from '../screens/EventDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';   // ✅ Ajout du profil
import ChatScreen from '../screens/ChatScreen';       // (si tu veux gérer le chat plus tard)
import ImageUploader from '../components/ImageUploader';

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
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
        
        {/* ✅ Nouvel écran Profil accessible depuis BottomNavBar */}
        <Stack.Screen name="Profile" component={ProfileScreen} />

        {/* Si tu veux un chat plus tard */}
         <Stack.Screen name="Chat" component={ChatScreen} /> 

         {/* Si tu veux un ADD  */}
         <Stack.Screen name="Add" component={ImageUploader} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}
