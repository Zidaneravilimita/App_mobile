// App.js
import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { I18nProvider } from './src/i18n';
import { ThemeProvider } from './src/theme';

// Le point d'entrée de votre application, il ne fait qu'appeler le navigateur
export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppNavigator />
      </I18nProvider>
    </ThemeProvider>
  );
}
