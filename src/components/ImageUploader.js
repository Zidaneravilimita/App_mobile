// src/components/ImageUploader.js
import React, { useState, useEffect } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../config/supabase';

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
          Alert.alert('Permission requise', 'Désolé, nous avons besoin de la permission pour accéder à la galerie d\'images pour que cela fonctionne !');
        }
      }
      fetchVilles();
      fetchTypeEvenements();
    })();
  }, []);

  const fetchVilles = async () => {
    const { data, error } = await supabase.from('ville').select('*');
    if (error) {
      console.error('Erreur lors du chargement des villes:', error.message);
      return;
    }
    setVilles(data);
    if (data.length > 0) {
      setSelectedVilleId(data[0].id_ville);
    }
  };

  const fetchTypeEvenements = async () => {
    const { data, error } = await supabase.from('type_evenements').select('*');
    if (error) {
      console.error('Erreur lors du chargement des types d\'événements:', error.message);
      return;
    }
    setTypeEvenements(data);
    if (data.length > 0) {
      setSelectedTypeEventId(data[0].id_type_event);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image d\'abord.');
      return null;
    }

    setUploading(true);

    try {
      const fileExt = imageUri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, { uri: imageUri, type: `image/${fileExt}` });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicURLData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setDownloadURL(publicURLData.publicUrl);
      return publicURLData.publicUrl;
    } catch (error) {
      Alert.alert('Erreur de téléchargement', error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // NOUVELLE FONCTION pour gérer la soumission complète du formulaire
  const handleFormSubmit = async () => {
    if (!imageUri || !eventTitle || !eventDescription || !selectedDate || !selectedVilleId || !selectedTypeEventId) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et sélectionner une image.');
      return;
    }

    setUploading(true);

    const imageUrl = await uploadImage();

    if (imageUrl) {
      try {
        // CONVERSION DE L'ID DE TYPE D'ÉVÉNEMENT EN NOMBRE
        const idTypeEventNumber = parseInt(selectedTypeEventId, 10);
        
        // CONVERSION DE L'ID DE VILLE EN NOMBRE
        const idVilleNumber = parseInt(selectedVilleId, 10);

        const { data, error } = await supabase
          .from('event')
          .insert([
            {
              nom_event: eventTitle,
              description: eventDescription,
              date: selectedDate.toISOString(),
              photo: imageUrl,
              id_type_event: idTypeEventNumber, // Assure que le type est un nombre
              id_ville: idVilleNumber, // Assure que le type est un nombre
            },
          ]);

        if (error) {
          throw error;
        }

        Alert.alert('Succès', 'Événement ajouté avec succès !');
        onUploadComplete();
      } catch (error) {
        Alert.alert('Erreur lors de l\'ajout de l\'événement', error.message);
      } finally {
        setUploading(false);
      }
    } else {
      setUploading(false);
    }
  };

  const onDateChange = (event, newDate) => {
    const currentDate = newDate || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Bouton de retour */}
      <TouchableOpacity style={styles.backButton} onPress={onClose}>
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Ajouter un événement</Text>

      {/* Bouton pour sélectionner l'image */}
      <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
        <Text style={styles.pickImageButtonText}>Sélectionner une image</Text>
      </TouchableOpacity>

      {/* Aperçu de l'image */}
      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        </View>
      )}

      {/* Saisie du titre */}
      <TextInput
        style={styles.input}
        placeholder="Titre de l'événement"
        placeholderTextColor="#999"
        value={eventTitle}
        onChangeText={setEventTitle}
      />

      {/* Saisie de la description */}
      <TextInput
        style={styles.input}
        placeholder="Description de l'événement"
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        value={eventDescription}
        onChangeText={setEventDescription}
      />

      {/* Saisie de la ville */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedVilleId}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
          dropdownIconColor="#fff"
        >
          {villes.map((ville) => (
            <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
          ))}
        </Picker>
      </View>

      {/* Saisie du type d'événement */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTypeEventId}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedTypeEventId(itemValue)}
          dropdownIconColor="#fff"
        >
          {typeEvenements.map((type) => (
            <Picker.Item key={type.id_type_event} label={type.nom_event} value={type.id_type_event} />
          ))}
        </Picker>
      </View>

      {/* Saisie de la date */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
        <Text style={styles.dateInputText}>
          Date : {selectedDate.toLocaleDateString()}
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

      {/* Bouton de soumission */}
      <TouchableOpacity style={styles.submitButton} onPress={handleFormSubmit} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Ajouter l'événement</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 50,
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
    marginBottom: 20,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  pickerContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#fff',
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
