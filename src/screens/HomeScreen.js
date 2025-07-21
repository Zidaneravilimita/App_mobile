import EventCard from '../components/EventCard';
import { View, Text, StyleSheet } from 'react-native'; 


<View style={styles.section}>
  <Text style={styles.sectionTitle}>Les événements populaires</Text>

  <EventCard
    title="Summer Beach Party"
    participants={250}
    image={require('../../assets/images/event_1.jpg')}
    onPress={() => {}}
  />
  <EventCard
    title="Soirée VIP Black & Gold"
    participants={120}
    image={require('../../assets/images/event_1.jpg')} 
    onPress={() => {}}
  />
</View>


const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    // Add other styles for your section container
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    // Add other styles for your section title
  },
});