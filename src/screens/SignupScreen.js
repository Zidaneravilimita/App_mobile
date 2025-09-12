// src/screens/SignupScreen.js - Version complète et à jour
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ToastAndroid,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [errorDetails, setErrorDetails] = useState('');

  React.useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      
      // Essayer de charger depuis Supabase
      try {
        const { data, error } = await supabase
          .from('ville')
          .select('id_ville, nom_ville')
          .order('nom_ville', { ascending: true });

        if (!error && data) {
          setCities(data);
          await AsyncStorage.setItem('cached_cities', JSON.stringify(data));
          return;
        }
      } catch (supabaseError) {
        console.warn('Supabase inaccessible, utilisation du cache');
      }

      // Fallback: charger depuis le cache
      const cachedCities = await AsyncStorage.getItem('cached_cities');
      if (cachedCities) {
        setCities(JSON.parse(cachedCities));
      } else {
        // Données par défaut
        setCities([
          { id_ville: 1, nom_ville: 'Antananarivo' },
          { id_ville: 2, nom_ville: 'Majunga' },
          { id_ville: 3, nom_ville: 'Fianarantsoa' },
          { id_ville: 4, nom_ville: 'Tamatave' },
          { id_ville: 5, nom_ville: 'Tuléar' }
        ]);
      }
    } catch (error) {
      console.error('Erreur chargement villes:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const notify = (message, title = 'Info') => {
    setErrorDetails(message);
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert(title, message);
    }
  };

  const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSupabaseSignup = async () => {
    try {
      console.log('Tentative d\'inscription avec Supabase...');

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim(),
            signup_method: 'app_mobile'
          }
        }
      });

      if (error) {
        console.error('Erreur Supabase:', error);
        
        if (error.message?.includes('User already registered')) {
          return { 
            success: false, 
            reason: 'user_exists',
            message: 'Cet email est déjà utilisé. Veuillez vous connecter.'
          };
        }
        
        if (error.message?.includes('Invalid API key') || error.status === 401) {
          return {
            success: false,
            reason: 'api_error',
            message: 'Problème de configuration serveur.'
          };
        }
        
        throw error;
      }

      console.log('Inscription réussie:', data);
      
      // Création du profil
      if (data.user) {
        try {
          const cityIdNumber = selectedCityId ? parseInt(selectedCityId) : null;
          const selectedCity = cities.find(city => city.id_ville === cityIdNumber);
          const cityName = selectedCity ? selectedCity.nom_ville : '';

          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              email: email.trim(),
              username: username.trim(),
              role: 'visiteur',
              avatar_url: 'https://i.ibb.co/2n9H0hZ/default-avatar.png',
              bio: `Utilisateur de EventParty ${cityName ? 'à ' + cityName : ''}`,
              id_ville: cityIdNumber,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }]);

          if (profileError) {
            console.warn('Erreur création profil:', profileError);
          }
        } catch (profileError) {
          console.warn('Exception création profil:', profileError);
        }
      }

      return { 
        success: true, 
        data,
        message: 'Inscription réussie !' + (data.session ? '' : ' Vérifiez votre email.')
      };

    } catch (error) {
      console.error('Exception Supabase:', error);
      return {
        success: false,
        reason: 'supabase_error',
        message: 'Erreur de connexion au serveur.'
      };
    }
  };

  const handleFallbackSignup = async () => {
    try {
      console.log('Activation du mode local...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const cityIdNumber = selectedCityId ? parseInt(selectedCityId) : null;
      const selectedCity = cities.find(city => city.id_ville === cityIdNumber);
      const cityName = selectedCity ? selectedCity.nom_ville : '';

      const localUser = {
        id: 'local-' + Date.now(),
        email: email.trim(),
        username: username.trim(),
        role: 'visiteur',
        avatar_url: 'https://i.ibb.co/2n9H0hZ/default-avatar.png',
        bio: `Utilisateur de EventParty ${cityName ? 'à ' + cityName : ''}`,
        id_ville: cityIdNumber,
        created_at: new Date().toISOString(),
        is_local: true,
      };

      await AsyncStorage.setItem('local_user', JSON.stringify(localUser));
      await AsyncStorage.setItem('user_profile', JSON.stringify(localUser));
      await AsyncStorage.setItem('is_demo_mode', 'true');

      return {
        success: true,
        data: { user: localUser },
        message: 'Mode démo activé ! Compte créé localement.'
      };

    } catch (error) {
      console.error('Erreur mode local:', error);
      return {
        success: false,
        reason: 'local_error',
        message: 'Erreur création compte local.'
      };
    }
  };

  const handleSignup = async () => {
    setErrorDetails('');
    
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      notify('Veuillez remplir tous les champs obligatoires.', 'Champs manquants');
      return;
    }
    if (!isValidEmail(email)) {
      notify('Format d\'email invalide.', 'Erreur');
      return;
    }
    if (password.length < 6) {
      notify('Le mot de passe doit contenir au moins 6 caractères.', 'Erreur');
      return;
    }
    if (password !== confirmPassword) {
      notify('Les mots de passe ne correspondent pas.', 'Erreur');
      return;
    }

    setLoading(true);

    try {
      // Essayer d'abord Supabase
      let result = await handleSupabaseSignup();

      // Si échec API, utiliser le fallback
      if (!result.success && result.reason === 'api_error') {
        notify('Configuration serveur incorrecte. Mode démo activé.', 'Info');
        result = await handleFallbackSignup();
      }

      if (result.success) {
        notify(result.message, 'Succès');
        
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }, 1500);
      } else {
        notify(result.message, 'Erreur');
        
        if (result.reason === 'user_exists') {
          navigation.navigate('Login', { email: email.trim() });
        }
      }

    } catch (error) {
      console.error('Erreur inscription:', error);
      notify('Une erreur inattendue est survenue.', 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setUsername('Utilisateur Demo');
    setEmail('demo@example.com');
    setPassword('demo123');
    setConfirmPassword('demo123');
    if (cities.length > 0) {
      setSelectedCityId(String(cities[0].id_ville));
    }
    notify('Données de démo remplies. Vous pouvez maintenant vous inscrire.', 'Info');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Créer un compte</Text>

          {errorDetails ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
              <Text style={styles.errorText}>{errorDetails}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Ville (optionnel)</Text>
            <View style={styles.pickerWrapper}>
              {loadingCities ? (
                <ActivityIndicator size="small" color="#8A2BE2" />
              ) : (
                <Picker
                  selectedValue={selectedCityId}
                  onValueChange={setSelectedCityId}
                  style={styles.picker}
                  dropdownIconColor="#fff"
                  enabled={!loading}
                >
                  <Picker.Item label="Choisissez votre ville" value="" />
                  {cities.map((ville) => (
                    <Picker.Item
                      key={ville.id_ville}
                      label={ville.nom_ville}
                      value={String(ville.id_ville)}
                    />
                  ))}
                </Picker>
              )}
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Mot de passe (min. 6 caractères)"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSignup} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.buttonText}>S'inscrire</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.demoButton} 
            onPress={handleQuickDemo}
            disabled={loading}
          >
            <Ionicons name="flash" size={16} color="#fff" />
            <Text style={styles.demoButtonText}>Données de test</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a1a' },
  scrollContainer: { flexGrow: 1, paddingVertical: 20 },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  backButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 30, 
    left: 20, 
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#fff', 
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,107,0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    marginLeft: 8,
    flex: 1,
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
  pickerContainer: {
    width: '100%',
    marginBottom: 12,
  },
  pickerLabel: {
    color: '#fff',
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    height: 50,
    overflow: 'hidden',
  },
  picker: { color: '#fff' },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#8A2BE2',
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  buttonText: { 
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' 
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
    gap: 8,
    justifyContent: 'center',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#ccc',
    fontSize: 14,
  },
  loginLink: {
    color: '#8A2BE2',
    fontWeight: '700',
    fontSize: 14,
  },
});