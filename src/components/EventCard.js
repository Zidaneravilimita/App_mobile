import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventCard({ title, participants, image, onPress }) {
  const organizerAvatarImage = require('../../assets/images/Avatar/avatar.jpg'); 
  const participantAvatarImage = require('../../assets/images/Avatar/avatar.jpg'); 
  const resolvedImage = image; 

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <ImageBackground
        source={resolvedImage} // Utilise directement l'image passée par HomeScreen
        style={styles.imageBackground} 
        imageStyle={styles.imageStyle} 
        resizeMode="cover" 
      >
        <View style={styles.overlay}> 
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

          <View style={styles.footerSection}>
            <View style={styles.participantsContainer}>
              <Image source={participantAvatarImage} style={styles.participantAvatar} />
              <Image source={participantAvatarImage} style={[styles.participantAvatar, styles.overlappingAvatar]} />
              <Image source={participantAvatarImage} style={[styles.participantAvatar, styles.overlappingAvatar2]} />
              <View style={styles.participantCount}>
                <Text style={styles.participantCountText}>{participants || '0+'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.likeButton}>
              <Ionicons name="heart-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 340,
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 20, 
    marginBottom: 25, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20, // Espace intérieur pour le contenu de la carte
  },
  imageStyle: {
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 20, // Assure un espacement constant sur tout le contenu
    justifyContent: 'space-between',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', 
    paddingVertical: 8, // Augmenté pour plus d'espace
    paddingHorizontal: 12, // Augmenté pour plus d'espace
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 10, // Ajout d'espace en bas de l'entête
  },
  organizerAvatar: {
    width: 35, // Légèrement plus grand
    height: 35,
    borderRadius: 17.5,
    marginRight: 12, // Augmenté pour plus d'espace
    borderWidth: 1.5, // Légèrement plus épais
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
    width: 32, // Légèrement plus grand
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
  },
  overlappingAvatar: {
    marginLeft: -15, // chevauchement
  },
  overlappingAvatar2: {
    marginLeft: -15, // chevauchement
  },
  participantCount: {
    marginLeft: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  participantCountText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  likeButton: {
    backgroundColor: '#8A2BE2',
    padding: 8,
    borderRadius: 20,
  },
});
