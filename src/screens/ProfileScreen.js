// src/screens/ProfileScreen.js - Version hybride avec fallback + notifications
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  TextInput,
  Platform,
  ToastAndroid,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Utilisateur de démonstration par défaut
const DEFAULT_USER = {
  id: 'demo-user-123',
  email: 'demo@eventparty.com',
  created_at: '2024-01-15T10:30:00Z',
  last_sign_in_at: new Date().toISOString(),
  user_metadata: {
    username: 'Utilisateur Demo',
    avatar_url: 'https://i.ibb.co/2n9H0hZ/default-avatar.png',
  },
};

const DEFAULT_PROFILE = {
  id: 'demo-user-123',
  username: 'Utilisateur Demo',
  email: 'demo@eventparty.com',
  bio: "Passionné d'événements et de rencontres",
  avatar_url: 'https://i.ibb.co/2n9H0hZ/default-avatar.png',
  role: 'visiteur',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: new Date().toISOString(),
};

const DEFAULT_STATS = {
  eventsCreated: 3,
  eventsAttended: 12,
  following: 45,
  followers: 78,
};

const MENU_ITEMS = [
  { id: 'events', title: 'Mes Événements', icon: 'calendar', color: '#8A2BE2' },
  { id: 'favorites', title: 'Favoris', icon: 'heart', color: '#FF6B6B' },
  { id: 'settings', title: 'Paramètres', icon: 'settings', color: '#4ECDC4' },
  { id: 'notifications', title: 'Notifications', icon: 'notifications', color: '#45B7D1' },
  { id: 'help', title: 'Aide & Support', icon: 'help-circle', color: '#96CEB4' },
  { id: 'privacy', title: 'Confidentialité', icon: 'shield', color: '#FECA57' },
];

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [userStats, setUserStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [newBio, setNewBio] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);

  useEffect(() => {
    initializeProfile();
  }, []);

  // Affichage message cross-platform
  const showMessage = (msg, title = "Info") => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert(title, msg);
    }
  };

  const initializeProfile = async () => {
    try {
      setLoading(true);
      const supabaseStatus = await checkSupabaseConnection();
      if (supabaseStatus) {
        await loadSupabaseProfile();
      } else {
        await loadLocalProfile();
      }
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start();
    } catch (error) {
      console.error("Erreur initialisation profil:", error);
      await loadLocalProfile();
    } finally {
      setLoading(false);
    }
  };

  const checkSupabaseConnection = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('https://kttziaqzsvtamgaijtzj.supabase.co/rest/v1/', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        setConnectionStatus('connected');
        setIsSupabaseAvailable(true);
        return true;
      }
    } catch (error) {
      console.log('Supabase indisponible, utilisation du mode local');
    }
    setConnectionStatus('offline');
    setIsSupabaseAvailable(false);
    return false;
  };

  const loadSupabaseProfile = async () => {
    try {
      const { supabase } = await import('../config/supabase');
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showMessage("Vous n'avez pas encore inscrit", "Connexion");
        throw new Error("Utilisateur non inscrit");
      }

      setUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        showMessage("Profil introuvable, utilisation du profil démo");
      }

      const currentProfile = profileData || {
        ...DEFAULT_PROFILE,
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Utilisateur',
      };

      setProfile(currentProfile);
      await loadUserStats(user.id, supabase);
      await saveProfileLocally(user, currentProfile);
      setupAuthListener(supabase);
      initializeEditFields(user, currentProfile);

    } catch (error) {
      console.error("Erreur chargement Supabase:", error);
      await loadLocalProfile();
    }
  };

  const loadLocalProfile = async () => {
    try {
      const savedUser = await getSavedUser();
      const savedProfile = await getSavedProfile();
      if (savedUser && savedProfile) {
        setUser(savedUser);
        setProfile(savedProfile);
        initializeEditFields(savedUser, savedProfile);
        console.log('Profil chargé depuis le cache local');
      } else {
        setUser(DEFAULT_USER);
        setProfile(DEFAULT_PROFILE);
        initializeEditFields(DEFAULT_USER, DEFAULT_PROFILE);
        console.log('Utilisation du profil de démonstration');
      }
      setUserStats(DEFAULT_STATS);
      setConnectionStatus('offline');
    } catch (error) {
      console.error('Erreur chargement local:', error);
      setUser(DEFAULT_USER);
      setProfile(DEFAULT_PROFILE);
      initializeEditFields(DEFAULT_USER, DEFAULT_PROFILE);
    }
  };

  const setupAuthListener = (supabase) => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          await clearLocalProfile();
          setUser(null);
          setProfile(null);
          navigation.replace('Login');
        } else if (event === 'SIGNED_IN' && session) {
          await loadSupabaseProfile();
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  };

  const loadUserStats = async (userId, supabase) => {
    try {
      const { count: eventsCreated } = await supabase
        .from('event')
        .select('*', { count: 'exact', head: true })
        .eq('id_user', userId);
      setUserStats({
        eventsCreated: eventsCreated || 0,
        eventsAttended: 0,
        following: 0,
        followers: 0,
      });
    } catch (error) {
      console.warn('Impossible de charger les stats, valeurs par défaut');
      setUserStats(DEFAULT_STATS);
    }
  };

  const initializeEditFields = (user, profile) => {
    setNewUsername(profile?.username || user?.user_metadata?.username || 'Utilisateur');
    setNewEmail(user?.email || 'demo@eventparty.com');
    setNewAvatar(profile?.avatar_url || user?.user_metadata?.avatar_url || 'https://i.ibb.co/2n9H0hZ/default-avatar.png');
    setNewBio(profile?.bio || '');
  };

  // Gestion du cache local
  const saveProfileLocally = async (user, profile) => {
    try {
      await AsyncStorage.multiSet([
        ['user_profile', JSON.stringify(user)],
        ['user_data', JSON.stringify(profile)],
        ['profile_timestamp', Date.now().toString()]
      ]);
    } catch (error) {
      console.error('Erreur sauvegarde locale:', error);
    }
  };
  const getSavedUser = async () => {
    try {
      const saved = await AsyncStorage.getItem('user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  const getSavedProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem('user_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  const clearLocalProfile = async () => {
    try {
      await AsyncStorage.multiRemove(['user_profile', 'user_data', 'profile_timestamp']);
    } catch (error) {
      console.error('Erreur suppression cache:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Activez l’accès aux photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setNewAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de sélectionner une image.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const updatedProfile = {
        ...profile,
        username: newUsername.trim(),
        email: newEmail.trim(),
        bio: newBio.trim(),
        avatar_url: newAvatar,
        updated_at: new Date().toISOString(),
      };
      const updatedUser = {
        ...user,
        email: newEmail.trim(),
        user_metadata: {
          ...user.user_metadata,
          username: newUsername.trim(),
          avatar_url: newAvatar,
        }
      };
      if (isSupabaseAvailable) {
        try {
          const { supabase } = await import('../config/supabase');
          await supabase.from('profiles').update({
            username: newUsername.trim(),
            bio: newBio.trim(),
            avatar_url: newAvatar,
            updated_at: new Date().toISOString(),
          }).eq('id', user.id);
          if (newEmail !== user.email) {
            await supabase.auth.updateUser({
              email: newEmail.trim(),
              data: { username: newUsername.trim(), avatar_url: newAvatar }
            });
          }
        } catch {
          console.warn('Sauvegarde Supabase échouée, locale uniquement');
        }
      }
      await saveProfileLocally(updatedUser, updatedProfile);
      setUser(updatedUser);
      setProfile(updatedProfile);
      setEditing(false);
      showMessage(isSupabaseAvailable ? "Profil mis à jour" : "Profil mis à jour localement");
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isSupabaseAvailable) {
                const { supabase } = await import('../config/supabase');
                await supabase.auth.signOut();
              }
              await clearLocalProfile();
              showMessage("Déconnexion réussie");
              navigation.replace('Login');
            } catch {
              await clearLocalProfile();
              navigation.replace('Login');
            }
          },
        },
      ]
    );
  };

  const handleRefreshConnection = async () => {
    setConnectionStatus('checking');
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
      try {
        await loadSupabaseProfile();
        showMessage("Connexion rétablie");
      } catch {
        setConnectionStatus('offline');
        showMessage("Impossible de se reconnecter");
      }
    } else {
      showMessage("Toujours hors ligne");
    }
  };

  const handleMenuPress = (itemId) => {
    const actions = {
      events: () => Alert.alert('Mes Événements', `Vous avez créé ${userStats.eventsCreated} événement(s)`),
      favorites: () => Alert.alert('Favoris', 'Fonctionnalité en cours de développement'),
      settings: () => Alert.alert('Paramètres', 'Fonctionnalité en cours de développement'),
      notifications: () => Alert.alert('Notifications', 'Fonctionnalité en cours de développement'),
      help: () => Alert.alert('Aide & Support', 'support@eventparty.com'),
      privacy: () => Alert.alert('Confidentialité', 'Consultez notre politique de confidentialité'),
    };
    actions[itemId]?.();
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      checking: { color: '#2196F3', icon: 'refresh', text: 'Vérification...' },
      connected: { color: '#4CAF50', icon: 'cloud-done', text: 'Connecté' },
      offline: { color: '#FF6B6B', icon: 'cloud-offline', text: 'Mode hors ligne' },
    };
    const config = statusConfig[connectionStatus];
    return (
      <View style={[styles.statusBar, { backgroundColor: config.color }]}>
        <Ionicons name={config.icon} size={16} color="#fff" />
        <Text style={styles.statusText}>{config.text}</Text>
        {connectionStatus === 'offline' && (
          <TouchableOpacity onPress={handleRefreshConnection} style={styles.refreshButton}>
            <Ionicons name="refresh" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // --- UI inchangée ---
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        {renderConnectionStatus()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={styles.loadingText}>Chargement de votre profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        {renderConnectionStatus()}
        <View style={styles.centered}>
          <Ionicons name="person-circle" size={80} color="#666" />
          <Text style={styles.noUserTitle}>Aucun utilisateur connecté</Text>
          <Text style={styles.noUserSubtitle}>Connectez-vous pour accéder à votre profil</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.replace('Login')}
          >
            <Ionicons name="log-in" size={20} color="#fff" />
            <Text style={styles.loginText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentProfile = profile || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      {renderConnectionStatus()}

      <Animated.ScrollView 
        style={[styles.container, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec gradient */}
        <LinearGradient colors={['#8A2BE2', '#6A1B9A']} style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mon Profil</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profil principal */}
          <Animated.View style={[styles.profileSection, { transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity onPress={editing ? pickImage : null} style={styles.avatarContainer}>
              <Image source={{ uri: newAvatar }} style={styles.avatar}
                onError={() => setNewAvatar('https://i.ibb.co/2n9H0hZ/default-avatar.png')} />
              {editing && (
                <View style={styles.avatarOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              )}
              <View style={[
                styles.statusIndicator,
                { backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#FF6B6B' }
              ]} />
            </TouchableOpacity>

            {editing ? (
              <View style={styles.editContainer}>
                <TextInput style={styles.editInput} value={newUsername} onChangeText={setNewUsername} placeholder="Nom d'utilisateur" placeholderTextColor="#ccc" />
                <TextInput style={styles.editInput} value={newEmail} onChangeText={setNewEmail} placeholder="Email" keyboardType="email-address" placeholderTextColor="#ccc" />
                <TextInput style={[styles.editInput, styles.bioInput]} value={newBio} onChangeText={setNewBio} placeholder="Bio (optionnelle)" placeholderTextColor="#ccc" multiline numberOfLines={3} />
              </View>
            ) : (
              <View style={styles.userInfo}>
                <Text style={styles.username}>{currentProfile.username || user.user_metadata?.username || 'Utilisateur'}</Text>
                <Text style={styles.email}>{user.email}</Text>
                {currentProfile.bio ? <Text style={styles.bio}>{currentProfile.bio}</Text> : null}
                <View style={styles.membershipBadge}>
                  <Ionicons name="diamond" size={14} color="#FFD700" />
                  <Text style={styles.membershipText}>
                    {currentProfile.role === 'organisateur' ? 'Organisateur' : 'Membre'}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.editButton, editing && styles.saveButton]}
              onPress={editing ? handleSaveProfile : () => setEditing(true)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name={editing ? 'checkmark' : 'pencil'} size={18} color="#fff" />
                  <Text style={styles.editText}>{editing ? 'Sauvegarder' : 'Modifier'}</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.eventsCreated}</Text>
            <Text style={styles.statLabel}>Événements créés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.eventsAttended}</Text>
            <Text style={styles.statLabel}>Participations</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.followers}</Text>
            <Text style={styles.statLabel}>Abonnés</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Options</Text>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuPress(item.id)}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Infos utilisateur */}
        <View style={styles.userInfoSection}>
          <Text style={styles.infoTitle}>Informations du compte</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Mode:</Text>
            <Text style={styles.infoValue}>{isSupabaseAvailable ? 'Connecté' : 'Hors ligne'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>ID Utilisateur:</Text>
            <Text style={styles.infoValue}>{user.id.substring(0, 8)}...</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Inscrit le:</Text>
            <Text style={styles.infoValue}>{user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Non dispo'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Dernière maj:</Text>
            <Text style={styles.infoValue}>{currentProfile.updated_at ? new Date(currentProfile.updated_at).toLocaleDateString('fr-FR') : 'Non dispo'}</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES (identiques à ton code) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a1a' },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  statusBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 8 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  refreshButton: { marginLeft: 10 },
  loadingText: { color: '#fff', marginTop: 15, fontSize: 16 },
  noUserTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 20, marginBottom: 8 },
  noUserSubtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 30 },
  headerGradient: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileSection: { alignItems: 'center', paddingHorizontal: 20 },
  avatarContainer: { position: 'relative', marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  statusIndicator: { position: 'absolute', bottom: 8, right: 8, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#fff' },
  userInfo: { alignItems: 'center', marginBottom: 25 },
  username: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  email: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  bio: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 10, paddingHorizontal: 20 },
  membershipBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, gap: 5 },
  membershipText: { color: '#FFD700', fontSize: 12, fontWeight: '600' },
  editContainer: { width: '100%', marginBottom: 20 },
  editInput: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 10, color: '#fff', textAlign: 'center', marginBottom: 10, fontSize: 16 },
  bioInput: { textAlign: 'left', minHeight: 80, textAlignVertical: 'top' },
  editButton: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, alignItems: 'center', gap: 8 },
  saveButton: { backgroundColor: '#4CAF50' },
  editText: { color: '#fff', fontWeight: '600' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#222', marginHorizontal: 20, marginTop: -20, marginBottom: 30, borderRadius: 15, padding: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#8A2BE2', marginBottom: 5 },
  statLabel: { fontSize: 12, color: '#ccc', textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: '#333', marginHorizontal: 10 },
  menuContainer: { paddingHorizontal: 20, marginBottom: 20 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', padding: 15, borderRadius: 12, marginBottom: 8 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '500' },
  userInfoSection: { margin: 20, padding: 15, backgroundColor: '#333', borderRadius: 10, marginBottom: 40 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 15 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#444' },
  infoLabel: { color: '#ccc', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
  loginButton: { flexDirection: 'row', backgroundColor: '#8A2BE2', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', gap: 8 },
  loginText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
