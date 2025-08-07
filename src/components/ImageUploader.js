// src/components/ImageUploader.js
import React, { useState, useEffect } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../config/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ImageUploader({ onUploadComplete, onClose }) {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState(null);

  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState('');
  const [typeEvenements, setTypeEvenements] = useState([]);
  const [selectedTypeEventId, setSelectedTypeEventId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', 'Nous avons besoin de la permission d\'accéder à votre galerie pour télécharger une image.');
        }
      }
      fetchVilles();
      fetchTypeEvenements();
    })();
  }, []);

  const fetchVilles = async () => {
    const { data, error } = await supabase.from('ville').select('*');
    if (error) {
      console.error('Erreur de récupération des villes:', error);
      Alert.alert('Erreur', 'Impossible de charger les villes.');
    } else {
      setVilles(data);
    }
  };

  const fetchTypeEvenements = async () => {
    const { data, error } = await supabase.from('type_evenements').select('*');
    if (error) {
      console.error('Erreur de récupération des types d\'événements:', error);
      Alert.alert('Erreur', 'Impossible de charger les types d\'événements.');
    } else {
      setTypeEvenements(data);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setDownloadURL(null); // Réinitialise l'URL de téléchargement
    }
  };

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image d\'abord.');
      return;
    }

    if (!eventTitle || !eventDescription || !selectedVilleId || !selectedTypeEventId || !eventDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs du formulaire.');
      return;
    }

    setUploading(true);

    try {
      const { data, error } = await supabase.storage
        .from('images')
        .upload(`public_images/${Date.now()}.png`, {
          uri: imageUri,
          type: 'image/png',
          name: `${Date.now()}.png`,
        });

      if (error) {
        throw error;
      }

      // Récupérer l'URL publique de l'image
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);

      if (!publicUrlData) {
        throw new Error('Impossible d\'obtenir l\'URL publique de l\'image.');
      }

      setDownloadURL(publicUrlData.publicUrl);
      console.log('URL de l\'image téléchargée:', publicUrlData.publicUrl);

      // Insérer les données de l'événement dans la table 'event'
      const { data: eventData, error: eventError } = await supabase.from('event').insert({
        nom_event: eventTitle,
        description: eventDescription,
        date: eventDate,
        photo: publicUrlData.publicUrl,
        id_type_event: selectedTypeEventId,
      });

      if (eventError) {
        throw eventError;
      }

      Alert.alert('Succès', 'Image et événement téléchargés avec succès !');
      setImageUri(null);
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setSelectedVilleId('');
      setSelectedTypeEventId('');
      onUploadComplete(); // Appelle la fonction de rappel pour revenir à l'écran principal

    } catch (error) {
      console.error('Erreur lors du téléchargement ou de l\'insertion:', error);
      Alert.alert('Erreur', `Échec du téléchargement: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    setEventDate(currentDate.toISOString().split('T')[0]); // Formatte la date
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close-circle" size={30} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.title}>Créer un Événement</Text>

      <TextInput
        style={styles.input}
        placeholder="Titre de l'événement"
        placeholderTextColor="#aaa"
        value={eventTitle}
        onChangeText={setEventTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description de l'événement"
        placeholderTextColor="#aaa"
        value={eventDescription}
        onChangeText={setEventDescription}
        multiline
      />
      
      {/* Picker pour les villes */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedVilleId}
          onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
          style={styles.picker}
          dropdownIconColor="#fff"
        >
          <Picker.Item label="Sélectionner une ville" value="" />
          {villes.map((ville) => (
            <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
          ))}
        </Picker>
      </View>

      {/* Bouton pour ouvrir le sélecteur de date */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
        <Text style={styles.dateInputText}>
          {eventDate ? `Date : ${eventDate}` : "Sélectionner la date de l'événement"}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Picker pour les types d'événements */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTypeEventId}
          onValueChange={(itemValue) => setSelectedTypeEventId(itemValue)}
          style={styles.picker}
          dropdownIconColor="#fff"
        >
          <Picker.Item label="Sélectionner le type d'événement" value="" />
          {typeEvenements.map((type) => (
            <Picker.Item key={type.id_type_event} label={type.nom_event} value={type.id_type_event} />
          ))}
        </Picker>
      </View>

      {/* Bouton de sélection d'image */}
      <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
        <Text style={styles.pickImageButtonText}>Sélectionner une image</Text>
      </TouchableOpacity>

      {/* Prévisualisation de l'image */}
      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        </View>
      )}

      {/* Indicateur de chargement */}
      {uploading && (
        <ActivityIndicator
          size="large"
          color="#8A2BE2"
          style={styles.activityIndicator}
        />
      )}

      {/* Boutons pour annuler et uploader */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
          <Text style={styles.buttonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={uploadImage} disabled={uploading}>
          <Text style={styles.buttonText}>
            {uploading ? 'Téléchargement...' : 'Publier l\'événement'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  title: {
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
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
    height: 50,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInputButton: {
    width: '100%',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: 50,
  },
  dateInputText: {
    color: '#fff',
    fontSize: 16,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  pickImageButton: {
    backgroundColor: '#8A2BE2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  pickImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    width: '100%',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activityIndicator: {
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#8A2BE2',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
});
