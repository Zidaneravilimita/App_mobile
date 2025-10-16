// src/screens/ProfileScreen.js - Version hybride avec fallback + notifications
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../config/supabase';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';
import { ms, hp, wp } from '../theme/responsive';
import { useResponsive } from '../hooks/useResponsive';

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
  const { t, lang } = useI18n();
  const { colors } = useTheme();
  const { spacing, spacingTokens, font, isTablet } = useResponsive();
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
  const [showStatusBanner, setShowStatusBanner] = useState(true);

  useEffect(() => {
    initializeProfile();
    const timer = setTimeout(() => setShowStatusBanner(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Affichage message cross-platform
  const showMessage = (msg, title = "Info") => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert(title, msg);
    }
  };

  // Helper: return a public URL for a stored path or pass-through http URLs
  const getPublicAvatarUrl = (pathOrUrl) => {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith('http')) return pathOrUrl;
    try {
      const { data } = supabase.storage.from('images').getPublicUrl(pathOrUrl);
      // supabase v1/v2 returns data.publicUrl or data.publicURL
      return data?.publicUrl || data?.publicURL || null;
    } catch (e) {
      console.warn('Impossible d’obtenir l’URL publique:', e);
      return null;
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
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error) {
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        showMessage("Vous n'avez pas encore inscrit", "Connexion");
        throw new Error("Utilisateur non inscrit");
      }

      setUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, email, bio, avatar_url, role, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const currentProfile = profileData || {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Utilisateur',
        email: user.email,
        bio: '',
        avatar_url: user.user_metadata?.avatar_url || 'https://i.ibb.co/2n9H0hZ/default-avatar.png',
        role: 'visiteur',
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Ensure avatar_url is a public URL (if stored as a storage path)
      const publicAvatar = getPublicAvatarUrl(currentProfile.avatar_url);
      currentProfile.avatar_url = publicAvatar || currentProfile.avatar_url;

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
        .from('events')
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

  // pickImage only selects image and stores local uri in newAvatar
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
        // result.assets[0].uri is a local URI (file://...) - keep local until save
        setNewAvatar(result.assets[0].uri);
      }
    } catch (e) {
      console.error('pickImage erreur', e);
      Alert.alert('Erreur', 'Impossible de sélectionner une image.');
    }
  };

  // Save profile: if newAvatar is local (not http) upload to storage then update profiles.avatar_url
  const handleSaveProfile = async () => {
    try {
      if (!user) return;
      setLoading(true);
      let avatarUrlToSave = profile?.avatar_url || newAvatar;

      // If newAvatar is a local URI (file:// or content://) upload it to Supabase storage bucket 'images'
      if (newAvatar && !newAvatar.startsWith('http')) {
        try {
          // fetch local file and convert to blob
          const response = await fetch(newAvatar);
          const blob = await response.blob();

          const extMatch = (newAvatar.match(/\.(\w+)(\?.*)?$/) || [])[1];
          const ext = extMatch ? extMatch.replace(/\?.*$/, '') : 'jpg';
          const filePath = `avatars/${user.id}_${Date.now()}.${ext}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, blob, { upsert: true });

          if (uploadError) {
            console.warn('Upload avatar échoué:', uploadError);
          } else {
            // get public URL
            const { data: publicData } = supabase.storage.from('images').getPublicUrl(filePath);
            avatarUrlToSave = publicData?.publicUrl || publicData?.publicURL || avatarUrlToSave;
          }
        } catch (e) {
          console.warn('Erreur upload avatar:', e);
        }
      }

      const updatedProfile = {
        ...profile,
        username: newUsername.trim(),
        email: newEmail.trim(),
        bio: newBio.trim(),
        avatar_url: avatarUrlToSave,
        updated_at: new Date().toISOString(),
      };

      const updatedUser = {
        ...user,
        email: newEmail.trim(),
        user_metadata: {
          ...user.user_metadata,
          username: newUsername.trim(),
          avatar_url: avatarUrlToSave,
        }
      };

      if (isSupabaseAvailable) {
        try {
          // update profiles table avatar_url and other fields
          await supabase.from('profiles').upsert({
            id: user.id,
            username: newUsername.trim(),
            bio: newBio.trim(),
            avatar_url: avatarUrlToSave,
            updated_at: new Date().toISOString(),
            email: newEmail.trim(),
          }, { returning: 'minimal' });

          // if email changed update auth email
          if (newEmail !== user.email) {
            await supabase.auth.updateUser({
              email: newEmail.trim(),
              data: { username: newUsername.trim(), avatar_url: avatarUrlToSave }
            });
          }
        } catch (e) {
          console.warn('Sauvegarde Supabase échouée, locale uniquement', e);
        }
      }

      // save locally as fallback
      await saveProfileLocally(updatedUser, updatedProfile);
      setUser(updatedUser);
      setProfile(updatedProfile);
      setEditing(false);
      showMessage(isSupabaseAvailable ? "Profil mis à jour" : "Profil mis à jour localement");
    } catch (e) {
      console.error('handleSaveProfile erreur', e);
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
        setShowStatusBanner(true);
        setTimeout(() => setShowStatusBanner(false), 3000);
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
      events: () => navigation.navigate('MyEvents'),
      favorites: () => navigation.navigate('Favorites'),
      settings: () => navigation.navigate('Settings'),
      notifications: () => navigation.navigate('Notify'),
      help: () => navigation.navigate('Help'),
      privacy: () => navigation.navigate('Privacy'),
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
    if (!showStatusBanner) return null;
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        {renderConnectionStatus()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>{t('loadingProfile')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        {renderConnectionStatus()}
        <View style={styles.centered}>
          <Ionicons name="person-circle" size={80} color={colors.muted} />
          <Text style={[styles.noUserTitle, { color: colors.text }]}>{t('noUserTitle')}</Text>
          <Text style={[styles.noUserSubtitle, { color: colors.subtext }]}>{t('noUserSubtitle')}</Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.replace('Login')}
          >
            <Ionicons name="log-in" size={20} color="#fff" />
            <Text style={styles.loginText}>{t('login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentProfile = profile || {};

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      {renderConnectionStatus()}

      <Animated.ScrollView 
        style={[styles.container, { opacity: fadeAnim, backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec gradient */}
        <LinearGradient colors={['#8A2BE2', '#6A1B9A']} style={[styles.headerGradient, { paddingBottom: ms(36) }]}>
          <View style={[styles.header, { padding: spacing, paddingTop: spacingTokens.s }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={ms(22)} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { fontSize: font(20, { min: 18, max: 22 }) }]}>{t('profileTitle')}</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={ms(22)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profil principal */}
          <Animated.View style={[styles.profileSection, { transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity onPress={editing ? pickImage : null} style={styles.avatarContainer}>
              <Image source={{ uri: newAvatar }} style={[styles.avatar, { width: ms(116), height: ms(116), borderRadius: ms(58), borderWidth: ms(4) }]}
                onError={() => setNewAvatar('https://i.ibb.co/2n9H0hZ/default-avatar.png')} />
              {editing && (
                <View style={[styles.avatarOverlay, { borderRadius: ms(58) }]}>
                  <Ionicons name="camera" size={ms(20)} color="#fff" />
                </View>
              )}
              <View style={[
                styles.statusIndicator,
                { backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#FF6B6B', width: ms(18), height: ms(18), borderRadius: ms(9), borderWidth: ms(3) }
              ]} />
            </TouchableOpacity>

            {editing ? (
              <View style={[styles.editContainer, { marginBottom: spacingTokens.m }]}>
                <TextInput style={[styles.editInput, { backgroundColor: colors.card, color: colors.text, padding: ms(14), borderRadius: ms(10), fontSize: font(16, { min: 14, max: 18 }) }]} value={newUsername} onChangeText={setNewUsername} placeholder="Nom d'utilisateur" placeholderTextColor={colors.subtext} />
                <TextInput style={[styles.editInput, { backgroundColor: colors.card, color: colors.text, padding: ms(14), borderRadius: ms(10), fontSize: font(16, { min: 14, max: 18 }) }]} value={newEmail} onChangeText={setNewEmail} placeholder="Email" keyboardType="email-address" placeholderTextColor={colors.subtext} />
                <TextInput style={[styles.editInput, styles.bioInput, { backgroundColor: colors.card, color: colors.text, padding: ms(14), borderRadius: ms(10), fontSize: font(14, { min: 13, max: 16 }) }]} value={newBio} onChangeText={setNewBio} placeholder="Bio (optionnelle)" placeholderTextColor={colors.subtext} multiline numberOfLines={3} />
              </View>
            ) : (
              <View style={styles.userInfo}>
                <Text style={[styles.username, { color: colors.text, fontSize: font(28, { min: 22, max: 30 }) }]}>{currentProfile.username || user.user_metadata?.username || 'Utilisateur'}</Text>
                <Text style={[styles.email, { color: colors.subtext, fontSize: font(16, { min: 14, max: 18 }) }]}>{user.email}</Text>
                {currentProfile.bio ? <Text style={[styles.bio, { color: colors.subtext, fontSize: font(14, { min: 13, max: 16 }) }]}>{currentProfile.bio}</Text> : null}
                <View style={styles.membershipBadge}>
                  <Ionicons name="diamond" size={ms(12)} color="#FFD700" />
                  <Text style={styles.membershipText}>
                    {currentProfile.role === 'organisateur' ? 'Organisateur' : 'Membre'}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.editButton, editing && styles.saveButton, { paddingHorizontal: ms(18), paddingVertical: ms(10), borderRadius: ms(24) }]}
              onPress={editing ? handleSaveProfile : () => setEditing(true)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name={editing ? 'checkmark' : 'pencil'} size={ms(16)} color="#fff" />
                  <Text style={[styles.editText, { fontSize: font(14, { min: 12, max: 16 }) }]}>{editing ? t('save') : t('edit')}</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surface, shadowOpacity: 0.08, marginHorizontal: spacing, padding: spacing }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary, fontSize: font(22, { min: 18, max: 24 }) }]}>{userStats.eventsCreated}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext, fontSize: font(12, { min: 11, max: 13 }) }]}>{t('eventsCreated')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary, fontSize: font(22, { min: 18, max: 24 }) }]}>{userStats.eventsAttended}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext, fontSize: font(12, { min: 11, max: 13 }) }]}>{t('participations')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary, fontSize: font(22, { min: 18, max: 24 }) }]}>{userStats.followers}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext, fontSize: font(12, { min: 11, max: 13 }) }]}>{t('followers')}</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={[styles.menuContainer, { backgroundColor: colors.surface, paddingHorizontal: spacing }]}>
          <Text style={[styles.menuTitle, { color: colors.text, fontSize: font(18, { min: 16, max: 20 }), marginBottom: spacingTokens.s }]}>{t('options')}</Text>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.menuItem, { backgroundColor: colors.surface, padding: spacingTokens.m, borderRadius: ms(12) }]} onPress={() => handleMenuPress(item.id)}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20', width: ms(38), height: ms(38), borderRadius: ms(19), marginRight: spacingTokens.s }]}>
                <Ionicons name={item.icon} size={ms(20)} color={item.color} />
              </View>
              <Text style={[styles.menuText, { color: colors.text, fontSize: font(16, { min: 14, max: 18 }) }]}>{t(`menu_${item.id}`)}</Text>
              <Ionicons name="chevron-forward" size={ms(18)} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.userInfoSection, { backgroundColor: colors.surface, margin: spacing, padding: spacingTokens.m, borderRadius: ms(10), marginBottom: ms(36) }]}>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.subtext, fontSize: font(14, { min: 12, max: 16 }) }]}>Mode:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontSize: font(14, { min: 12, max: 16 }) }]}>{isSupabaseAvailable ? t('connected') : t('offline')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.subtext, fontSize: font(14, { min: 12, max: 16 }) }]}>ID:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontSize: font(14, { min: 12, max: 16 }) }]}>{user.id.substring(0, 8)}...</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.subtext, fontSize: font(14, { min: 12, max: 16 }) }]}>Inscrit le:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontSize: font(14, { min: 12, max: 16 }) }]}>{user.created_at ? new Date(user.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR') : '—'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.subtext, fontSize: font(14, { min: 12, max: 16 }) }]}>Dernière maj:</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontSize: font(14, { min: 12, max: 16 }) }]}>{currentProfile.updated_at ? new Date(currentProfile.updated_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR') : '—'}</Text>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// --- STYLES (identiques à ton code) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  statusBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, gap: 8 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  refreshButton: { marginLeft: 10 },
  loadingText: { marginTop: 15, fontSize: 16 },
  noUserTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  noUserSubtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
  headerGradient: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileSection: { alignItems: 'center', paddingHorizontal: 20 },
  avatarContainer: { position: 'relative', marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  statusIndicator: { position: 'absolute', bottom: 8, right: 8, width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#fff' },
  userInfo: { alignItems: 'center', marginBottom: 25 },
  username: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  email: { fontSize: 16, marginBottom: 8 },
  bio: { fontSize: 14, textAlign: 'center', marginBottom: 10, paddingHorizontal: 20 },
  membershipBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15, gap: 5 },
  membershipText: { color: '#FFD700', fontSize: 12, fontWeight: '600' },
  editContainer: { width: '100%', marginBottom: 20 },
  editInput: { padding: 15, borderRadius: 10, textAlign: 'center', marginBottom: 10, fontSize: 16 },
  bioInput: { textAlign: 'left', minHeight: 80, textAlignVertical: 'top' },
  editButton: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, alignItems: 'center', gap: 8 },
  saveButton: { backgroundColor: '#4CAF50' },
  editText: { color: '#fff', fontWeight: '600' },
  statsContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: -20, marginBottom: 30, borderRadius: 15, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  statLabel: { fontSize: 12, textAlign: 'center' },
  statDivider: { width: 1, marginHorizontal: 10 },
  menuContainer: { paddingHorizontal: 20, marginBottom: 20 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 8 },
  menuIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500' },
  userInfoSection: { margin: 20, padding: 15, borderRadius: 10, marginBottom: 40 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  loginButton: { flexDirection: 'row', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 25, alignItems: 'center', gap: 8 },
  loginText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
;
