import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

export default function ImageUploader({ onUploadComplete, onClose }) {
  const [imageUri, setImageUri] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState('');
  const [typeEvenements, setTypeEvenements] = useState([]);
  const [selectedTypeEventId, setSelectedTypeEventId] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVilles();
    fetchTypeEvenements();
  }, []);

  const fetchVilles = async () => {
    const { data, error } = await supabase.from('ville').select('*');
    if (error) {
      Alert.alert('Erreur', 'Impossible de charger les villes.');
      return;
    }
    setVilles(data);
    if (data.length > 0) setSelectedVilleId(data[0].id_ville);
  };

  const fetchTypeEvenements = async () => {
    const { data, error } = await supabase.from('type_evenements').select('*');
    if (error) {
      Alert.alert('Erreur', 'Impossible de charger les types d\'événements.');
      return;
    }
    setTypeEvenements(data);
    if (data.length > 0) setSelectedTypeEventId(data[0].id_type_event);
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Accès à la galerie nécessaire.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const onDateChange = (event, newDate) => {
    const currentDate = newDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    setEventDate(currentDate.toISOString().split('T')[0]);
  };

  const uploadImage = async () => {
    if (!imageUri) return null;
    const fileExt = imageUri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public_images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, { uri: imageUri, type: `image/${fileExt}` });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  };

  const handleFormSubmit = async () => {
    if (!imageUri || !eventTitle || !eventDescription || !eventDate || !selectedVilleId || !selectedTypeEventId) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et sélectionner une image.');
      return;
    }
    setUploading(true);
    try {
      const imageUrl = await uploadImage();
      if (!imageUrl) throw new Error('Impossible d\'obtenir l\'URL de l\'image.');

      const { error } = await supabase.from('event').insert([{
        nom_event: eventTitle,
        description: eventDescription,
        date: eventDate,
        photo: imageUrl,
        id_type_event: parseInt(selectedTypeEventId, 10),
        id_ville: parseInt(selectedVilleId, 10),
      }]);
      if (error) throw error;

      Alert.alert('Succès', 'Événement ajouté avec succès !');
      setEventTitle('');
      setEventDescription('');
      setImageUri(null);
      setEventDate('');
      onUploadComplete();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <Ionicons name="close" size={30} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Créer un Événement</Text>

      <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
        <Text style={styles.pickImageButtonText}>Sélectionner une image</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}

      <TextInput
        style={styles.input}
        placeholder="Titre de l'événement"
        placeholderTextColor="#999"
        value={eventTitle}
        onChangeText={setEventTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description de l'événement"
        placeholderTextColor="#999"
        multiline
        value={eventDescription}
        onChangeText={setEventDescription}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedVilleId}
          onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Sélectionner une ville" value="" />
          {villes.map((ville) => (
            <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTypeEventId}
          onValueChange={(itemValue) => setSelectedTypeEventId(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Sélectionner le type d'événement" value="" />
          {typeEvenements.map((type) => (
            <Picker.Item key={type.id_type_event} label={type.nom_event} value={type.id_type_event} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
        <Text style={styles.dateInputText}>
          {eventDate ? `Date : ${eventDate}` : 'Sélectionner la date'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
      )}

      {uploading && <ActivityIndicator size="large" color="#8A2BE2" style={{ marginTop: 10 }} />}

      <TouchableOpacity style={styles.submitButton} onPress={handleFormSubmit} disabled={uploading}>
        <Text style={styles.submitButtonText}>
          {uploading ? 'Téléchargement...' : 'Ajouter l\'événement'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  backButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    marginBottom: 15,
  },
  picker: {
    height: 50,
    color: '#fff',
  },
  pickImageButton: {
    backgroundColor: '#8A2BE2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  pickImageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
  },
  dateInputButton: {
    width: '100%',
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateInputText: {
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#8A2BE2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
