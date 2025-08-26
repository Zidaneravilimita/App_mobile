// src/components/ImageUploader.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  Alert,
  ActivityIndicator,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
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
          Alert.alert(
            'Permission requise',
            "Nous avons besoin de la permission d'accéder à votre galerie pour télécharger une image."
          );
        }
      }
      fetchVilles();
      fetchTypeEvenements();
    })();
  }, []);

  const fetchVilles = async () => {
    const { data, error } = await supabase
      .from('ville')
      .select('*')
      .order('nom_ville', { ascending: true });
    if (error) {
      console.error('Erreur de récupération des villes:', error);
      Alert.alert('Erreur', 'Impossible de charger les villes.');
    } else {
      setVilles(data || []);
    }
  };

  const fetchTypeEvenements = async () => {
    const { data, error } = await supabase
      .from('type_evenements')
      .select('*')
      .order('nom_event', { ascending: true });
    if (error) {
      console.error("Erreur de récupération des types d'événements:", error);
      Alert.alert('Erreur', "Impossible de charger les types d'événements.");
    } else {
      setTypeEvenements(data || []);
    }
  };

  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType || ImagePicker.MediaTypeOptions?.Images || 'Images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setDownloadURL(null);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner l'image.");
    }
  };

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Erreur', "Veuillez sélectionner une image d'abord.");
      return;
    }

    if (!eventTitle.trim() || !eventDescription.trim() || !selectedVilleId || !selectedTypeEventId || !eventDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs du formulaire.');
      return;
    }

    const villeIdNum = Number(selectedVilleId);
    const typeIdNum = Number(selectedTypeEventId);
    if (!Number.isFinite(villeIdNum) || !Number.isFinite(typeIdNum)) {
      Alert.alert('Erreur', 'Ville et Type doivent être choisis dans les listes.');
      return;
    }

    setUploading(true);

    try {
      const blob = await uriToBlob(imageUri);

      const guessedExt =
        (blob.type && blob.type.split('/')[1]) ||
        (imageUri.split('.').pop()?.toLowerCase() || 'png');
      const fileExt = guessedExt.includes('?') ? guessedExt.split('?')[0] : guessedExt;
      const fileName = `${Date.now()}.${fileExt}`;
      const path = `public_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: blob.type || `image/${fileExt}`,
        });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('images').getPublicUrl(path);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) throw new Error("Impossible d'obtenir l'URL publique de l'image.");

      setDownloadURL(publicUrl);

      const { error: insertError } = await supabase.from('event').insert({
        nom_event: eventTitle.trim(),
        description: eventDescription.trim(),
        date: eventDate,
        photo: publicUrl,
        id_type_event: typeIdNum,
        id_ville: villeIdNum,
      });

      if (insertError) throw insertError;

      Alert.alert('Succès', 'Image et événement téléchargés avec succès !');

      setImageUri(null);
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setSelectedVilleId('');
      setSelectedTypeEventId('');
      setSelectedDate(new Date());

      onUploadComplete?.();
    } catch (error) {
      console.error("Erreur lors du téléchargement ou de l'insertion:", error);
      Alert.alert('Erreur', `Échec du téléchargement: ${error.message || 'Inconnu'}`);
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
    setEventDate(currentDate.toISOString().split('T')[0]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>

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

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
          <Ionicons name="calendar-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.dateInputText}>
            {eventDate ? `Date : ${eventDate}` : "Date de l'évènement"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
        )}

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTypeEventId}
            onValueChange={(itemValue) => setSelectedTypeEventId(itemValue)}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Type d'évènement" value="" />
            {typeEvenements.map((type) => (
              <Picker.Item key={type.id_type_event} label={type.nom_event} value={type.id_type_event} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={28} color="#fff" style={styles.pickImageIcon} />
          <Text style={styles.pickImageButtonText}>Ajouter une pièce jointe</Text>
        </TouchableOpacity>

        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          </View>
        )}

        {uploading && <ActivityIndicator size="large" color="#8A2BE2" style={styles.activityIndicator} />}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => onClose?.()}>
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={uploadImage} disabled={uploading}>
            <Text style={styles.buttonText}>{uploading ? 'Téléchargement...' : 'Publier'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingBottom: 60,
  },
  input: {
    width: '100%',
    minWidth: '100%',
    backgroundColor: '#333',
    color: '#fff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#555',
    height: 60,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    padding: 15,
    fontSize: 18,
  },
  dateInputButton: {
    width: '100%',
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
  },
  dateInputText: {
    color: '#fff',
    fontSize: 16,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
    height: 60,
    justifyContent: 'center',
  },
  picker: {
    color: '#fff',
    height: 60,
  },
  pickImageButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 15,
  },
  pickImageIcon: {
    marginRight: 10,
  },
  pickImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  imagePreview: {
    width: 250,
    height: 180,
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
    marginTop: 10,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#8A2BE2',
    padding: 18,
  },
  cancelButton: {
    backgroundColor: '#555',
    padding: 18,
  },
});
