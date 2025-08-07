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
        source={resolvedImage} 
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
              <Image source={participantAvatarImage} style={[styles.participantAvatar, { zIndex: 3 }]} />
              <Image source={participantAvatarImage} style={[styles.participantAvatar, { left: -10, zIndex: 2 }]} />
              <Image source={participantAvatarImage} style={[styles.participantAvatar, { left: -20, zIndex: 1 }]} />
              <Text style={styles.participantsText}>+ {participants.length || 0}</Text>
            </View>
            <TouchableOpacity style={styles.bookmarkButton}>
              <Ionicons name="bookmark-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 300,
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 15,
    justifyContent: 'space-between',
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
  participantsText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  bookmarkButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 20,
  },
});