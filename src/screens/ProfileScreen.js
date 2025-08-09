// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';

// Composant pour une petite carte d'événement à afficher dans le profil
const ProfileEventCard = ({ title, date, image }) => (
  <View style={profileStyles.eventCard}>
    <Image source={{ uri: image }} style={profileStyles.eventCardImage} />
    <View style={profileStyles.eventCardTextContainer}>
      <Text style={profileStyles.eventCardTitle}>{title}</Text>
      <Text style={profileStyles.eventCardDate}>{date}</Text>
    </View>
  </View>
);

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [myEvents, setMyEvents] = useState([]);

  useEffect(() => {
    // Dans une vraie application, vous feriez une requête à Supabase ici pour
    // récupérer les informations de l'utilisateur connecté et ses événements.
    // Exemple : const { data: user, error } = await supabase.auth.getUser();

    // Pour l'instant, nous utilisons des données fictives pour l'interface
    const dummyUser = {
      id: '123',
      name: 'John Doe',
      avatar: 'https://placehold.co/100x100/A020F0/ffffff?text=JD', // Placeholder
      bio: 'Développeur passionné et amateur de festivals.',
      eventsCount: 3,
    };
    setUserProfile(dummyUser);

    const dummyEvents = [
      { id: '1', title: 'Festival de musique', date: '2025-11-20', image: 'https://kttziaqzsvtamgaijtzj.supabase.co/storage/v1/object/public/images/public_images/1754399043646.jpg' },
      { id: '2', title: 'Soirée DJ Urbaine', date: '2025-08-11', image: 'https://kttziaqzsvtamgaijtzj.supabase.co/storage/v1/object/public/images/public_images/1754563337183.png' },
      { id: '3', title: 'Soirée à la plage', date: '2025-09-01', image: 'https://placehold.co/600x400/8A2BE2/ffffff?text=Plage' },
    ];
    setMyEvents(dummyEvents);
  }, []);

  const handleLogout = () => {
    // Logique de déconnexion
    // Exemple : supabase.auth.signOut();
    // navigation.navigate('Login'); // Rediriger vers l'écran de connexion
    console.log("Déconnexion de l'utilisateur");
    alert('Déconnexion...');
  };

  if (!userProfile) {
    return <Text style={profileStyles.loadingText}>Chargement du profil...</Text>;
  }

  return (
    <SafeAreaView style={profileStyles.safeArea}>
      <ScrollView contentContainerStyle={profileStyles.container}>
        {/* Bouton de retour */}
        <TouchableOpacity style={profileStyles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Section de l'en-tête du profil */}
        <View style={profileStyles.header}>
          <Image source={{ uri: userProfile.avatar }} style={profileStyles.avatar} />
          <Text style={profileStyles.name}>{userProfile.name}</Text>
          <Text style={profileStyles.bio}>{userProfile.bio}</Text>
          <Text style={profileStyles.stats}>{userProfile.eventsCount} Événements créés</Text>
        </View>

        {/* Bouton de déconnexion */}
        <TouchableOpacity style={profileStyles.logoutButton} onPress={handleLogout}>
          <Text style={profileStyles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>

        {/* Section des événements de l'utilisateur */}
        <Text style={profileStyles.sectionTitle}>Mes Événements</Text>
        
        <FlatList
          data={myEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProfileEventCard title={item.title} date={item.date} image={item.image} />}
          style={profileStyles.eventList}
          ListEmptyComponent={<Text style={profileStyles.emptyListText}>Vous n'avez pas encore créé d'événement.</Text>}
        />
        
      </ScrollView>
    </SafeAreaView>
  );
}

const profileStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 15,
    zIndex: 1,
    padding: 10,
    borderRadius: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#8A2BE2',
    marginBottom: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  bio: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  stats: {
    fontSize: 14,
    color: '#bbb',
  },
  logoutButton: {
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
    marginHorizontal: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  eventList: {
    // Style pour le FlatList
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    alignItems: 'center',
  },
  eventCardImage: {
    width: 100,
    height: 100,
  },
  eventCardTextContainer: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  eventCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  eventCardDate: {
    fontSize: 14,
    color: '#bbb',
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
  emptyListText: {
    color: '#bbb',
    textAlign: 'center',
    marginTop: 20,
  }
});
