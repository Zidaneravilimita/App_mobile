// App.js
import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importez vos écrans
import HomeScreen from './src/screens/HomeScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="HomeScreen"
        screenOptions={{
          headerShown: false, // Cache l'en-tête par défaut pour tous les écrans
        }}
      >
        {/* Enregistrez le HomeScreen dans le navigateur */}
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        
        {/* Enregistrez le EventDetailsScreen dans le navigateur */}
        <Stack.Screen name="EventDetailsScreen" component={EventDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
