import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventCard({ title, participants, image, onPress }) {
  // Assurez-vous que ces chemins relatifs sont corrects par rapport à EventCard.js
  const defaultEventImage = require('../../assets/images/Event/event_1.jpg'); 
  const organizerAvatarImage = require('../../assets/images/Avatar/avatar.jpg'); 
  const participantAvatarImage = require('../../assets/images/Avatar/avatar.jpg'); 

  // La prop 'image' doit déjà être le résultat d'un require() du composant parent
  // Si 'image' n'est pas un nombre (résultat de require), nous utilisons l'image par défaut.
  const resolvedImage = typeof image === 'number' ? image : defaultEventImage; 

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <ImageBackground
        source={resolvedImage}
        style={styles.imageBackground} // Cette imageBackground doit remplir TOUTE la carte
        imageStyle={styles.imageStyle} // Applique les coins arrondis à l'image
        resizeMode="cover" // C'est crucial : l'image s'agrandit pour couvrir tout l'espace
      >
        {/* L'overlay contient tout le contenu (titre, avatars, bouton like)
            et gère l'espacement interne pour que le contenu ne touche pas les bords */}
        <View style={styles.overlay}> 
          {/* Section du haut : Informations de l'organisateur */}
          <View style={styles.headerSection}>
            <Image source={organizerAvatarImage} style={styles.organizerAvatar} />
            <View style={styles.headerText}>
              <Text style={styles.organizerName}>{title || "Nom de l'Événement"}</Text>
              <Text style={styles.eventType}>Soirée / Fête</Text>
            </View>
            <TouchableOpacity style={styles.moreIcon}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Section du bas : Participants et bouton "J'aime" */}
          <View style={styles.footerSection}>
            <View style={styles.participantsContainer}>
              <Image source={participantAvatarImage} style={styles.participantAvatar} />
              <Image source={participantAvatarImage} style={[styles.participantAvatar, styles.overlapAvatar]} />
              <Image source={participantAvatarImage} style={[styles.participantAvatar, styles.overlapAvatar]} />
              <View style={styles.participantBadge}>
                <Text style={styles.participantText}>+{participants || 0}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.likeButton}>
              <Ionicons name="heart" size={24} color="#fff" /> 
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden', 
    height: 200, // Définit la hauteur de la carte
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imageBackground: {
    flex: 1,
    width: 400,
    height: 200,
  },
  imageStyle: {
    borderRadius: 20, // Applique des coins arrondis directement à l'image de fond
  },
  overlay: {
    flex: 1, // L'overlay prend toute la hauteur et largeur de l'ImageBackground
    justifyContent: 'space-between', // Pousse le header en haut et le footer en bas
    padding: 15, // C'est ici que l'on définit l'espacement entre le contenu (header/footer) et les bords de la carte
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', 
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
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
    flex: 1,
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
    marginTop: 'auto',
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
    marginLeft: -10,
  },
  participantBadge: {
    backgroundColor: '#8A2BE2',
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
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 50,
  },
});