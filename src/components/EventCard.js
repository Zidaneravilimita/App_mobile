<<<<<<< HEAD
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventCard({ title, participants, image, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={image} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.footer}>
          <Ionicons name="person" size={16} color="gray" />
          <Text style={styles.participants}>{participants} participants</Text>
          <Ionicons name="heart-outline" size={20} color="red" style={{ marginLeft: 'auto' }} />
        </View>
      </View>
=======
// src/components/EventCard.js
import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventCard({ name, eventType, participants }) {
  // Utilise une image de fond générique pour l'exemple
  const backgroundImage = { uri: 'https://via.placeholder.com/350x200/4B0082/FFFFFF?text=Event+Party' };
  const organizerAvatarImage = { uri: 'https://via.placeholder.com/30' }; // Avatar pour l'organisateur
  const participantAvatarImage = { uri: 'https://via.placeholder.com/25' }; // Avatar pour les participants

  return (
    <TouchableOpacity style={styles.cardContainer}>
      <ImageBackground source={backgroundImage} style={styles.imageBackground} imageStyle={styles.imageStyle}>
        <View style={styles.overlay}>
          <View style={styles.headerSection}>
            <Image source={organizerAvatarImage} style={styles.organizerAvatar} />
            <View style={styles.headerText}>
              <Text style={styles.organizerName}>{name}</Text>
              <Text style={styles.eventType}>{eventType}</Text>
            </View>
            <TouchableOpacity style={styles.moreIcon}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.footerSection}>
            <View style={styles.participantsContainer}>
              {/* Ces images seraient dynamiques dans une vraie app, ici juste pour le visuel */}
              <Image source={participantAvatarImage} style={styles.participantAvatar} />
              <Image source={participantAvatarImage} style={[styles.participantAvatar, styles.overlapAvatar]} />
              {/* Le troisième participant peut être une icône ou une autre image */}
              <Image source={participantAvatarImage} style={[styles.participantAvatar, styles.overlapAvatar]} />
              <View style={styles.participantBadge}>
                <Text style={styles.participantText}>+{participants}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.likeButton}>
              <Ionicons name="heart" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
>>>>>>> 75daf5e30bf511ea6061a2885e4bc5dea904c27e
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 160,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  participants: {
    marginLeft: 4,
    color: 'gray',
  },
});
=======
  cardContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden', // Nécessaire pour les coins arrondis
    height: 250, // Hauteur fixe pour les cartes d'événements
    elevation: 3, // Ombre pour Android
    shadowColor: '#000', // Ombre pour iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 15,
  },
  imageStyle: {
    borderRadius: 20, // Applique le border radius à l'image de fond
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', // Fond semi-transparent pour le texte
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start', // Le conteneur ne prend que la largeur de son contenu
  },
  organizerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  headerText: {
    flex: 1, // Prend l'espace restant
  },
  organizerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventType: {
    color: '#eee',
    fontSize: 12,
  },
  moreIcon: {
    paddingLeft: 10,
  },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto', // Pousse le footer en bas
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  overlapAvatar: {
    marginLeft: -10, // Pour faire chevaucher les avatars
  },
  participantBadge: {
    backgroundColor: '#8A2BE2', // Couleur violette
    borderRadius: 15,
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  participantText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  likeButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 25, // Rendre le bouton rond
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
>>>>>>> 75daf5e30bf511ea6061a2885e4bc5dea904c27e
