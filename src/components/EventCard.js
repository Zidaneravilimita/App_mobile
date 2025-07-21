import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventCard({ title, participants, image, onPress }) {
  // Use the provided image prop for the background.
  // Fallback to a placeholder if image is not provided or fails to load.
  const resolvedImage = typeof image === 'number' ? image : { uri: image || 'https://via.placeholder.com/350x200/4B0082/FFFFFF?text=Event+Party' };

  // Placeholder avatars for demonstration, you'd replace these with actual data
  const organizerAvatarImage = { uri: 'https://placehold.co/30x30/4B0082/FFFFFF?text=Org' };
  const participantAvatarImage = { uri: 'https://placehold.co/25x25/6A5ACD/FFFFFF?text=P' };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      <ImageBackground source={resolvedImage} style={styles.imageBackground} imageStyle={styles.imageStyle}>
        <View style={styles.overlay}>
          {/* Header Section: Organizer Info and More Icon */}
          <View style={styles.headerSection}>
            <Image source={organizerAvatarImage} style={styles.organizerAvatar} />
            <View style={styles.headerText}>
              <Text style={styles.organizerName}>{title || "Nom de l'Événement"}</Text>
              {/* Added a placeholder for eventType, you might want to add a prop for this */}
              <Text style={styles.eventType}>Soirée / Fête</Text>
            </View>
            <TouchableOpacity style={styles.moreIcon}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Footer Section: Participants and Like Button */}
          <View style={styles.footerSection}>
            <View style={styles.participantsContainer}>
              {/* Dynamic participant avatars - showing placeholders */}
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
    overflow: 'hidden', // Necessary for rounded corners
    height: 250, // Fixed height for event cards
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
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
    borderRadius: 20, // Apply border radius to the background image
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent background for text
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start', // Container only takes content width
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
    flex: 1, // Takes remaining space
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
    marginTop: 'auto', // Pushes the footer to the bottom
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
    marginLeft: -10, // To overlap avatars
  },
  participantBadge: {
    backgroundColor: '#8A2BE2', // Violet color
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
    borderRadius: 25, // Make the button round
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});