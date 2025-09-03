// src/screens/ProfileScreen.js
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Édition
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAvatar, setNewAvatar] = useState('');

  // ✅ Charger profil utilisateur avec fallback
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        let userData = sessionData?.session?.user || null;

        if (!userData) {
          const { data } = await supabase.auth.getUser();
          userData = data?.user || null;
        }

        setUser(userData);

        if (userData) {
          setNewUsername(userData.user_metadata?.username || '');
          setNewEmail(userData.email || '');
          setNewAvatar(
            userData.user_metadata?.avatar_url ||
              'https://i.ibb.co/2n9H0hZ/default-avatar.png'
          );
        }
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger votre profil.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // ✅ Choisir une nouvelle image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewAvatar(result.assets[0].uri);
    }
  };

  // ✅ Upload avatar dans Supabase
  const uploadAvatar = async (uri, userId) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${userId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error('Erreur upload avatar:', err);
      return null;
    }
  };

  // ✅ Sauvegarder profil
  const handleSaveProfile = async () => {
    try {
      if (!user) return;

      let avatarUrl = newAvatar;
      if (!newAvatar.startsWith('http')) {
        const uploadedUrl = await uploadAvatar(newAvatar, user.id);
        if (uploadedUrl) avatarUrl = uploadedUrl;
      }

      // Mise à jour username + avatar dans table profiles
      await supabase
        .from('profiles')
        .update({ username: newUsername, avatar_url: avatarUrl })
        .eq('id', user.id);

      // Mise à jour email dans Supabase Auth
      if (newEmail && newEmail !== user.email) {
        const { error } = await supabase.auth.updateUser({
          email: newEmail,
          data: { username: newUsername, avatar_url: avatarUrl },
        });
        if (error) throw error;
      } else {
        await supabase.auth.updateUser({
          data: { username: newUsername, avatar_url: avatarUrl },
        });
      }

      setUser({
        ...user,
        email: newEmail,
        user_metadata: { username: newUsername, avatar_url: avatarUrl },
      });

      setEditing(false);

      Platform.OS === 'android'
        ? ToastAndroid.show('Profil mis à jour ✅', ToastAndroid.SHORT)
        : Alert.alert('Succès', 'Profil mis à jour ✅');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.');
      console.error(err);
    }
  };

  // ✅ Déconnexion
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.replace('Login');
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8A2BE2" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.centered}>
          <Text style={{ color: '#fff', marginBottom: 10 }}>
            Aucun utilisateur connecté
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.loginText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Infos utilisateur */}
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={editing ? pickImage : null}>
          <Image source={{ uri: newAvatar }} style={styles.avatar} />
        </TouchableOpacity>

        {editing ? (
          <>
            <TextInput
              style={styles.input}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Pseudo"
              placeholderTextColor="#888"
            />
            <TextInput
              style={styles.input}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#888"
            />
          </>
        ) : (
          <>
            <Text style={styles.username}>
              {user.user_metadata?.username || 'Utilisateur'}
            </Text>
            <Text style={styles.email}>{user.email}</Text>
          </>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (editing ? handleSaveProfile() : setEditing(true))}
        >
          <Ionicons
            name={editing ? 'checkmark-outline' : 'pencil-outline'}
            size={20}
            color="#fff"
          />
          <Text style={styles.editText}>
            {editing ? 'Enregistrer' : 'Modifier Profil'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a1a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#111',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileContainer: { alignItems: 'center', marginTop: 40 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#8A2BE2',
  },
  username: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  email: { fontSize: 16, color: '#ccc', marginBottom: 15 },
  input: {
    width: 250,
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 8,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#8A2BE2',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  editText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  loginButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  loginText: { color: '#fff', fontSize: 16 },
});
