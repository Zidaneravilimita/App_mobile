// src/components/ImageUploader.js
import React, { useState, useEffect } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker'; // Importation du sélecteur de date
import { supabase } from '../config/supabase';

export default function ImageUploader({ onUploadComplete }) {
  // États pour la sélection d'image
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState(null);

  // États pour les données du formulaire
  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState('');
  const [typeEvenements, setTypeEvenements] = useState([]);
  const [selectedTypeEventId, setSelectedTypeEventId] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(''); // Date formatée YYYY-MM-DD pour l'affichage et la BDD

  // États pour le sélecteur de date
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'Désolé, nous avons besoin de la permission pour accéder à la galerie d\'images.');
        }
      }
      fetchVilles();
    })();
  }, []);

  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase.from('ville').select('id_ville, nom_ville');
      if (error) throw error;
      setVilles(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des villes :', error.message);
    }
  };
  
  // Utiliser useEffect pour récupérer les types d'événements lorsque la ville change
  useEffect(() => {
    const fetchTypeEvenements = async () => {
      if (selectedVilleId) {
        try {
          const { data, error } = await supabase
            .from('type_evenements')
            .select('id_type_event, nom_event')
            .eq('id_ville', selectedVilleId);
          if (error) throw error;
          setTypeEvenements(data);
          setSelectedTypeEventId(''); // Réinitialiser le type d'événement
        } catch (error) {
          console.error('Erreur lors de la récupération des types d\'événements :', error.message);
        }
      } else {
        setTypeEvenements([]); // Vider les types d'événements si aucune ville n'est sélectionnée
      }
    };
    fetchTypeEvenements();
  }, [selectedVilleId]);


  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
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
    if (!imageUri || !eventTitle || !eventDescription || !selectedVilleId || !selectedTypeEventId || !eventDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et sélectionner une image.');
      return;
    }

    setUploading(true);
    const fileName = `${Date.now()}.${imageUri.split('.').pop()}`;

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(`public_images/${fileName}`, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(uploadData.path);
      
      if (!publicUrlData) throw new Error("Could not get public URL");
      
      const publicURL = publicUrlData.publicUrl;
      setDownloadURL(publicURL);

      // Insérer les données dans la table 'event' de Supabase
      const { error: insertError } = await supabase.from('event').insert([
        {
          nom_event: eventTitle,
          description: eventDescription,
          date: eventDate,
          id_type_event: selectedTypeEventId,
          photo: publicURL,
        },
      ]);

      if (insertError) throw insertError;
      
      Alert.alert('Succès', 'Image et données de l\'événement téléchargées avec succès !');
      
      // Réinitialiser les états
      setImageUri(null);
      setDownloadURL(null);
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setSelectedVilleId('');
      setSelectedTypeEventId('');

      onUploadComplete(); // Appel de la fonction de rappel
      
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (event, date) => {
    const currentDate = date || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    const formattedDate = currentDate.toISOString().split('T')[0];
    setEventDate(formattedDate);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Titre de l'événement"
          placeholderTextColor="#aaa"
          value={eventTitle}
          onChangeText={setEventTitle}
        />
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedVilleId}
            onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Sélectionner une ville" value="" style={styles.pickerItem} />
            {villes.map((ville) => (
              <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} style={styles.pickerItem} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTypeEventId}
            onValueChange={(itemValue) => setSelectedTypeEventId(itemValue)}
            style={styles.picker}
            dropdownIconColor="#fff"
            enabled={typeEvenements.length > 0} // Désactiver si aucun type d'événement n'est disponible
          >
            <Picker.Item label="Sélectionner un type d'événement" value="" style={styles.pickerItem} />
            {typeEvenements.map((typeEvent) => (
              <Picker.Item key={typeEvent.id_type_event} label={typeEvent.nom_event} value={typeEvent.id_type_event} style={styles.pickerItem} />
            ))}
          </Picker>
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description de l'événement"
          placeholderTextColor="#aaa"
          multiline
          value={eventDescription}
          onChangeText={setEventDescription}
        />

        {/* Bouton pour ouvrir le sélecteur de date */}
        <TouchableOpacity style={styles.dateInputButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateInputText}>
                {eventDate ? `Date: ${eventDate}` : 'Sélectionner la date'}
            </Text>
        </TouchableOpacity>

        {/* Afficheur de date */}
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        
        {imageUri && (
            <View style={styles.imagePreviewContainer}>
                <Text style={styles.imagePreviewText}>Aperçu de l'image :</Text>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage} disabled={uploading}>
              <Text style={styles.buttonText}>Choisir une image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={uploadImage} disabled={uploading}>
              <Text style={styles.buttonText}>{uploading ? 'Téléchargement...' : 'Publier'}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 10,
  },
  formContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    backgroundColor: '#333',
    marginBottom: 15,
  },
  picker: {
    color: '#fff',
  },
  pickerItem: {
    fontSize: 16,
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
  imagePreviewContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '100%',
  },
  imagePreviewText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});