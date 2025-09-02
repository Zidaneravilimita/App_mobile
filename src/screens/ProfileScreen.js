// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  Image, FlatList, ActivityIndicator, Alert, TextInput, Platform, ToastAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

// 🔹 Carte événement
const ProfileEventCard = ({ title, date, image }) => (
  <View style={styles.eventCard}>
    <Image source={{ uri: image }} style={styles.eventCardImage} />
    <View style={styles.eventCardTextContainer}>
      <Text style={styles.eventCardTitle}>{title}</Text>
      <Text style={styles.eventCardDate}>{date}</Text>
    </View>
  </View>
);

// 🔹 Transforme le chemin relatif en URL publique Supabase
const getPublicUrl = (path) => {
  if (!path) return "https://placehold.co/400x200/222/fff?text=No+Image";

  // Supabase Storage public URL
  const filename = path.includes("_images/") ? path.split("_images/")[1] : path;
  return `https://kttziaqzsvtamgaijtzj.supabase.co/storage/v1/object/public/images/public_images/${filename}`;
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');

  // 🔹 Charger profil + événements
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // 1. Récupérer l’utilisateur authentifié
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const user = userData?.user;
        if (!user) {
          setUserProfile(null);
          return;
        }

        // 2. Récupérer son profil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, bio")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const profile = {
          id: user.id,
          name: profileData?.username || user.email,
          avatar: getPublicUrl(profileData?.avatar_url),
          bio: profileData?.bio || "Pas de bio disponible",
        };

        setUserProfile(profile);
        setNewName(profile.name);
        setNewAvatar(profile.avatar);

        // 3. Charger ses événements
        const { data: events, error: eventError } = await supabase
          .from("event")
          .select("*")
          .eq("id_user", user.id)
          .order("date", { ascending: false });

        if (eventError) throw eventError;

        const eventsWithPhoto = events.map(ev => ({
          ...ev,
          photo: getPublicUrl(ev.photo)
        }));

        setMyEvents(eventsWithPhoto);

      } catch (err) {
        console.error("Erreur chargement profil:", err);
        Alert.alert("Erreur", "Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 🔹 Déconnexion
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      console.error("Erreur déconnexion:", err);
      Alert.alert("Erreur", "Impossible de se déconnecter.");
    }
  };

  // 🔹 Sélectionner une nouvelle image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setNewAvatar(uri);
    }
  };

  // 🔹 Upload avatar
  const uploadAvatar = async (uri, userId) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split(".").pop();
      const fileName = `${userId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      return publicData.publicUrl;
    } catch (err) {
      console.error("Erreur upload avatar:", err);
      Alert.alert("Erreur", "Impossible de téléverser l'image.");
      return null;
    }
  };

  // 🔹 Sauvegarder le profil
  const handleSaveProfile = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      let avatarUrl = newAvatar;
      if (!newAvatar.startsWith("http")) {
        const uploadedUrl = await uploadAvatar(newAvatar, user.id);
        if (uploadedUrl) avatarUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ username: newName, avatar_url: avatarUrl })
        .eq("id", user.id);

      if (error) throw error;

      setUserProfile({ ...userProfile, name: newName, avatar: avatarUrl });
      setEditing(false);

      Platform.OS === "android"
        ? ToastAndroid.show("Profil mis à jour !", ToastAndroid.SHORT)
        : Alert.alert("Succès", "Profil mis à jour !");
    } catch (err) {
      console.error("Erreur mise à jour profil:", err);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
    }
  };

  // 🔹 Loading
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.emptyListText}>Aucun profil trouvé.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profil */}
        <View style={styles.header}>
          <TouchableOpacity onPress={editing ? pickImage : null}>
            <Image
              source={{ uri: editing ? newAvatar : userProfile.avatar }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
            />
          ) : (
            <Text style={styles.name}>{userProfile.name}</Text>
          )}

          <Text style={styles.bio}>{userProfile.bio}</Text>
          <Text style={styles.stats}>{myEvents.length} Événements créés</Text>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => (editing ? handleSaveProfile() : setEditing(true))}
          >
            <Ionicons
              name={editing ? "checkmark-outline" : "pencil-outline"}
              size={20}
              color="#fff"
            />
            <Text style={styles.editButtonText}>
              {editing ? "Enregistrer" : "Modifier Profil"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>

        {/* Mes événements */}
        <Text style={styles.sectionTitle}>Mes Événements</Text>
        <FlatList
          data={myEvents}
          keyExtractor={(item) => item.id_event?.toString()}
          renderItem={({ item }) => (
            <ProfileEventCard
              title={item.nom_event}
              date={item.date}
              image={item.photo}
            />
          )}
          style={styles.eventList}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              Vous n'avez pas encore créé d'événement.
            </Text>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#1a1a1a" },
  container: { paddingVertical: 20, paddingHorizontal: 15 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a1a" },
  header: { alignItems: "center", marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: "#8A2BE2", marginBottom: 15 },
  name: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  nameInput: { fontSize: 26, fontWeight: "bold", color: "#fff", borderBottomWidth: 1, borderBottomColor: "#8A2BE2", textAlign: "center", width: 200 },
  bio: { fontSize: 16, color: "#ccc", textAlign: "center", marginBottom: 10 },
  stats: { fontSize: 14, color: "#bbb" },
  logoutButton: { backgroundColor: "#8A2BE2", padding: 15, borderRadius: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", marginBottom: 30 },
  logoutButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  eventList: {},
  eventCard: { flexDirection: "row", backgroundColor: "#2a2a2a", borderRadius: 15, marginBottom: 15, alignItems: "center" },
  eventCardImage: { width: 100, height: 100 },
  eventCardTextContainer: { flex: 1, padding: 15 },
  eventCardTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  eventCardDate: { fontSize: 14, color: "#bbb" },
  emptyListText: { color: "#bbb", textAlign: "center", marginTop: 20 },
  editButton: { flexDirection: "row", backgroundColor: "#8A2BE2", padding: 10, borderRadius: 8, marginTop: 15, alignItems: "center" },
  editButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 5 },
});
