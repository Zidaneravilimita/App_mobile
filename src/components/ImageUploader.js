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
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
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
            'Nous avons besoin de la permission d’accéder à votre galerie.'
          );
        }
      }
      fetchVilles();
      fetchCategories();
    })();
  }, []);

  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase
        .from('ville')
        .select('*')
        .order('nom_ville', { ascending: true });

      if (error) throw error;
      setVilles(data || []);
    } catch (err) {
      console.error('Erreur chargement villes:', err.message || err);
      Alert.alert('Erreur', 'Impossible de charger les villes.');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('category')
        .select('*')
        .order('nom_category', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erreur chargement catégories:', err.message || err);
      Alert.alert('Erreur', 'Impossible de charger les catégories.');
    }
  };

  const uriToBlob = async (uri) => {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Impossible de convertir en blob');
    return await response.blob();
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setDownloadURL(null);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l’image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l’image.');
    }
  };

  const uploadEvent = async () => {
    if (!imageUri || !eventTitle.trim() || !eventDescription.trim() || !selectedVilleId || !selectedCategoryId || !eventDate) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setUploading(true);
    try {
      const blob = await uriToBlob(imageUri);
      const ext = blob.type?.split('/')[1] || 'png';
      const fileName = `${Date.now()}.${ext}`;
      const path = `public_images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(path, blob, { cacheControl: '3600', upsert: false, contentType: blob.type });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('images').getPublicUrl(path);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) throw new Error('Impossible d’obtenir l’URL publique de l’image.');

      setDownloadURL(publicUrl);

      const { error: insertError } = await supabase.from('events').insert({
        nom_event: eventTitle.trim(),
        description: eventDescription.trim(),
        date: eventDate,
        photo: publicUrl,
        id_category: Number(selectedCategoryId),
        id_ville: Number(selectedVilleId),
      });

      if (insertError) throw insertError;

      Alert.alert('Succès', 'Événement publié avec succès !');

      // Reset form
      setImageUri(null);
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setSelectedVilleId('');
      setSelectedCategoryId('');
      setSelectedDate(new Date());

      onUploadComplete?.();
    } catch (error) {
      console.error('Erreur upload ou insertion:', error);
      Alert.alert('Erreur', error.message || 'Échec de l’opération.');
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (event, date) => {
    const currentDate = date || selectedDate;
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

        {/* Sélection de la ville */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedVilleId}
            onValueChange={setSelectedVilleId}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Sélectionner une ville" value="" />
            {villes.map((ville) => (
              <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
            ))}
          </Picker>
        </View>

        {/* Sélection de la catégorie */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Sélectionner une catégorie" value="" />
            {categories.map((cat) => (
              <Picker.Item key={cat.id_category} label={cat.nom_category} value={cat.id_category} />
            ))}
          </Picker>
        </View>

        {/* Sélection de la date */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
          <Ionicons name="calendar-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.dateInputText}>
            {eventDate ? `Date : ${eventDate}` : 'Sélectionner la date'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
        )}

        {/* Image */}
        <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={28} color="#fff" />
          <Text style={styles.pickImageButtonText}>Ajouter une image</Text>
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
          <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={uploadEvent} disabled={uploading}>
            <Text style={styles.buttonText}>{uploading ? 'Téléchargement...' : 'Publier'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1a1a1a', padding: 20, paddingBottom: 80 },
  input: { width: '100%', backgroundColor: '#333', color: '#fff', padding: 20, borderRadius: 8, marginBottom: 15, fontSize: 18, borderWidth: 1, borderColor: '#555', height: 60 },
  textArea: { height: 120, textAlignVertical: 'top', padding: 15, fontSize: 18 },
  dateInputButton: { width: '100%', backgroundColor: '#333', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#555', flexDirection: 'row', alignItems: 'center', height: 70 },
  dateInputText: { color: '#fff', fontSize: 16 },
  pickerContainer: { width: '100%', backgroundColor: '#333', borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#555', height: 60, justifyContent: 'center' },
  picker: { color: '#fff', height: 60 },
  pickImageButton: { backgroundColor: '#333', padding: 15, borderRadius: 8, alignItems: 'center', flexDirection: 'row', marginBottom: 15 },
  pickImageButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  imagePreviewContainer: { alignItems: 'center', width: '100%', marginBottom: 15 },
  imagePreview: { width: 250, height: 180, borderRadius: 10, marginVertical: 10, borderWidth: 1, borderColor: '#ddd' },
  activityIndicator: { marginTop: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 30 },
  button: { flex: 1, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  uploadButton: { backgroundColor: '#8A2BE2', padding: 18 },
  cancelButton: { backgroundColor: '#555', padding: 18 },
});
