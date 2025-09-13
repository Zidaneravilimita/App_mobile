// src/screens/SignupScreen.js - Version complète avec tables temporaires
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
          { id_ville: 5, nom_ville: 'Tuléar' },
          { id_ville: 6, nom_ville: 'Diego' },
          { id_ville: 7, nom_ville: 'Nosy Be' },
          { id_ville: 8, nom_ville: 'Antsirabe' },
          { id_ville: 9, nom_ville: 'Morondava' }
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

  const checkTempUserExists = async (userEmail) => {
    try {
      const { data, error } = await supabase
        .from('temp_users')
        .select('*')
        .eq('email', userEmail.trim())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Erreur vérification temp user:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Exception vérification temp user:', error);
      return false;
    }
  };

  const handleTempSignup = async () => {
    try {
      console.log('Tentative d\'inscription via table temporaire...');

      const cityIdNumber = selectedCityId ? parseInt(selectedCityId) : null;

      // Utiliser la fonction RPC avec vos tables temporaires
      const { data, error } = await supabase
        .rpc('temp_signup', {
          user_email: email.trim(),
          user_password: password,
          user_username: username.trim(),
          user_city_id: cityIdNumber
        });

      if (error) {
        console.error('Erreur fonction temp_signup:', error);
        return {
          success: false,
          reason: 'temp_error',
          message: 'Erreur lors du traitement de l\'inscription'
        };
      }

      if (data && data.success) {
        console.log('Inscription temporaire réussie:', data);
        
        // Créer l'objet utilisateur local
        const localUser = {
          id: data.user_id,
          email: data.email,
          username: data.username,
          role: 'visiteur',
          avatar_url: 'https://i.ibb.co/2n9H0hZ/default-avatar.png',
          city_id: cityIdNumber,
          created_at: new Date().toISOString(),
          is_temp_user: true,
          source: 'temp_signups'
        };

        // Sauvegarder localement
        await AsyncStorage.setItem('current_user', JSON.stringify(localUser));
        await AsyncStorage.setItem('user_source', 'temp_table');
        await AsyncStorage.setItem('user_email', email.trim());

        return { 
          success: true, 
          message: 'Inscription réussie !',
          user_data: localUser
        };
      } else {
        return { 
          success: false, 
          message: data?.message || 'Erreur lors de l inscription' 
        };
      }

    } catch (error) {
      console.error('Erreur temp signup:', error);
      return {
        success: false,
        reason: 'temp_error',
        message: 'Erreur avec la table temporaire'
      };
    }
  };

  const handleFallbackSignup = async () => {
    try {
      console.log('Activation du mode local de secours...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const cityIdNumber = selectedCityId ? parseInt(selectedCityId) : null;
      const selectedCity = cities.find(city => city.id_ville === cityIdNumber);
      const cityName = selectedCity ? selectedCity.nom_ville : '';

      const localUser = {
        id: `local-${Date.now()}`,
        email: email.trim(),
        username: username.trim(),
        role: 'visiteur',
        avatar_url: 'https://i.ibb.co/2n9H0hZ/default-avatar.png',
        bio: `Utilisateur de EventParty ${cityName ? 'à ' + cityName : ''}`,
        city_id: cityIdNumber,
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

  const testTempTables = async () => {
    try {
      // Test de la table temp_signups
      const { data: signupsData, error: signupsError } = await supabase
        .from('temp_signups')
        .select('count(*)');

      // Test de la table temp_users
      const { data: usersData, error: usersError } = await supabase
        .from('temp_users')
        .select('count(*)');

      if (signupsError || usersError) {
        notify('Erreur de connexion aux tables temporaires', 'Test');
        return false;
      } else {
        notify(`Tables OK: ${signupsData[0].count} signups, ${usersData[0].count} users`, 'Test réussi');
        return true;
      }
    } catch (error) {
      console.error('Test tables temporaires:', error);
      notify('Erreur test tables', 'Test échoué');
      return false;
    }
  };

  const handleSignup = async () => {
    setErrorDetails('');
    
    // Validation des champs
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
      // Vérifier d'abord si l'utilisateur existe déjà
      const userExists = await checkTempUserExists(email);
      if (userExists) {
        notify('Cet email est déjà utilisé. Veuillez vous connecter.', 'Erreur');
        setLoading(false);
        return;
      }

      // Tester d'abord la connexion aux tables
      const tablesAvailable = await testTempTables();
      
      let result;
      if (tablesAvailable) {
        // Utiliser la fonction avec vos tables temporaires
        result = await handleTempSignup();
      } else {
        // Fallback vers le mode local
        notify('Tables temporaires indisponibles. Mode secours activé.', 'Info');
        result = await handleFallbackSignup();
      }

      if (result.success) {
        notify(result.message, 'Succès');
        
        // Redirection vers l'accueil
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }, 1500);
      } else {
        notify(result.message, 'Erreur');
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
    setEmail('demo@eventparty.com');
    setPassword('demo123');
    setConfirmPassword('demo123');
    if (cities.length > 0) {
      setSelectedCityId(String(cities[0].id_ville));
    }
    notify('Données de démo remplies. Cliquez sur "S\'inscrire" pour continuer.', 'Info');
  };

  const handleTestConnection = async () => {
    const isConnected = await testTempTables();
    if (isConnected) {
      notify('✅ Connexion aux tables temporaires réussie!', 'Test OK');
    } else {
      notify('❌ Erreur de connexion aux tables', 'Test Échoué');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Créer un compte</Text>

          <View style={styles.infoBox}>
            <Ionicons name="cloud" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Utilisation des tables temporaires pour l'inscription
            </Text>
          </View>

          {errorDetails ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
              <Text style={styles.errorText}>{errorDetails}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Nom d'utilisateur *"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Ville</Text>
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
            placeholder="Mot de passe (min. 6 caractères) *"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe *"
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

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.demoButton} 
              onPress={handleQuickDemo}
              disabled={loading}
            >
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.demoButtonText}>Remplir démo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testButton} 
              onPress={handleTestConnection}
              disabled={loading}
            >
              <Ionicons name="wifi" size={16} color="#fff" />
              <Text style={styles.testButtonText}>Test connexion</Text>
            </TouchableOpacity>
          </View>

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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    color: '#2196F3',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 15,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
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