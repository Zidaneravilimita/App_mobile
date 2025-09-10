// src/screens/LoginScreen.js - Version simplifiée pour éviter les erreurs Supabase
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const notify = (message, title = 'Info') => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.LONG);
    else Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      notify('Veuillez remplir tous les champs.', 'Erreur');
      return;
    }

    setLoading(true);
    
    // Mode démonstration - accepter n'importe quel email/mot de passe
    try {
      // Simulation d'une connexion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Connexion réussie en mode démo
      notify('Connexion réussie en mode démonstration !', 'Succès');
      navigation.navigate('Home');
      
    } catch (err) {
      console.error('Erreur inattendue:', err);
      notify('Erreur de connexion', 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('demo@example.com');
    setPassword('demo123');
    setTimeout(() => handleLogin(), 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.title}>Se Connecter</Text>
        
        {/* Bandeau mode démo */}
        <View style={styles.demoBanner}>
          <Ionicons name="information-circle" size={20} color="#fff" />
          <Text style={styles.demoText}>Mode démonstration activé</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Adresse e-mail"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se Connecter</Text>}
        </TouchableOpacity>

        {/* Bouton de connexion rapide démo */}
        <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin}>
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.demoButtonText}>Connexion rapide (Démo)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>
            Pas encore de compte ? <Text style={styles.linkBold}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>

        {/* Informations de démo */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Mode Démonstration</Text>
          <Text style={styles.infoText}>
            • Utilisez n'importe quel email et mot de passe{'\n'}
            • Ou cliquez sur "Connexion rapide"{'\n'}
            • Toutes les données sont statiques
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a1a' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 20 },
  
  // Demo banner
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 25,
    gap: 8,
  },
  demoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  // Demo button
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  demoButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  linkText: { marginTop: 18, color: '#ccc' },
  linkBold: { fontWeight: '700', color: '#fff' },

  // Info box
  infoBox: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#8A2BE2',
  },
  infoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
  },
});