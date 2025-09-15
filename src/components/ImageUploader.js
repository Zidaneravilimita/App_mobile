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
  const [selectedVilleId, setSelectedVilleId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLieu, setEventLieu] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- bootstrap : charger villes + catégories, demander permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        try {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permission requise',
              "Nous avons besoin de la permission d’accéder à votre galerie pour sélectionner une image."
            );
          }
        } catch (e) {
          console.warn('Erreur permission image picker:', e);
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
      console.error('Erreur chargement villes:', err);
      Alert.alert('Erreur', 'Impossible de charger les villes.');
    }
  };

  const fetchCategories = async () => {
    try {
      // Ta table des catégories s'appelle "category"
      const { data, error } = await supabase
        .from('category')
        .select('*')
        .order('nom_category', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      // erreur précédente: Could not find table 'public.type_evenements'
      Alert.alert('Erreur', 'Impossible de charger les catégories (vérifie le nom de la table).');
    }
  };

  // convertit uri -> Blob (fonction compatible expo)
  const uriToBlob = async (uri) => {
    // fetch local file and convert to blob
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Impossible de récupérer le fichier local');
    return await response.blob();
  };

  // --- pickImage : compatible avec différentes versions d'expo-image-picker
  const pickImage = async () => {
    try {
      // Préparer les options ; mediaTypes est optionnel si l'export n'existe pas (safety fallback)
      const options = { allowsEditing: true, aspect: [4, 3], quality: 1 };

      // fallback pour plusieurs versions d'expo-image-picker
      const mediaTypes =
        (ImagePicker && ImagePicker.MediaType && ImagePicker.MediaType.Images) ||
        (ImagePicker && ImagePicker.MediaTypeOptions && ImagePicker.MediaTypeOptions.Images);

      if (mediaTypes) options.mediaTypes = mediaTypes;

      const result = await ImagePicker.launchImageLibraryAsync(options);

      // Support nouveaux et anciens formats :
      if (!result) {
        console.warn('ImagePicker: result undefined');
        return;
      }

      // nouveau format (assets) ou ancien format (uri)
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setDownloadURL(null);
        console.log('Image sélectionnée (assets):', uri);
      } else if (!result.canceled && result.uri) {
        // ancien format
        setImageUri(result.uri);
        setDownloadURL(null);
        console.log('Image sélectionnée (uri):', result.uri);
      } else if (result.canceled) {
        console.log('Sélection annulée par l’utilisateur.');
      } else {
        console.log('Format résultat non reconnu', result);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l’image:', error);
      // Spécifique — si l'erreur est "Cannot read property 'Images' of undefined", ça signifie que
      // la variable MediaType / MediaTypeOptions est undefined ; la logique ci-dessus fait un fallback
      // mais on renvoie un message générique aussi
      Alert.alert('Erreur', "Impossible de sélectionner l'image. Mets à jour 'expo-image-picker' si l'erreur persiste.");
    }
  };

  // --- upload / insert event
  const uploadEvent = async () => {
    // validations simples
    if (
      !imageUri ||
      !eventTitle.trim() ||
      !eventDescription.trim() ||
      !selectedVilleId ||
      !selectedCategoryId ||
      !eventDate ||
      !eventLieu.trim()
    ) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs du formulaire.');
      return;
    }

    setUploading(true);
    try {
      // récupérer user connecté
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('userError:', userError);
        Alert.alert('Erreur', 'Vous devez être connecté pour créer un événement.');
        setUploading(false);
        return;
      }

      // convertir uri en blob
      const blob = await uriToBlob(imageUri);

      // deviner extension
      const guessedExt = (blob.type && blob.type.split('/')[1]) || imageUri.split('.').pop() || 'png';
      const fileExt = guessedExt.includes('?') ? guessedExt.split('?')[0] : guessedExt;
      const fileName = `${Date.now()}_${user.id}.${fileExt}`;
      const path = `public_images/${fileName}`;

      // upload dans le bucket 'event-images' (assure-toi que le bucket existe et est public si tu veux getPublicUrl)
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: blob.type || `image/${fileExt}`,
        });

      if (uploadError) {
        console.error('uploadError:', uploadError);
        throw uploadError;
      }

      // récupération URL publique
      const { data: pubData } = supabase.storage.from('event-images').getPublicUrl(path);
      const publicUrl = pubData?.publicUrl;
      if (!publicUrl) throw new Error("Impossible d'obtenir l'URL publique de l'image (vérifie les permissions du bucket).");

      setDownloadURL(publicUrl);

      // insertion dans table 'events' (ton schéma)
      const { error: insertError } = await supabase.from('events').insert({
        titre: eventTitle.trim(),
        description: eventDescription.trim(),
        date_event: eventDate,
        lieu: eventLieu.trim(),
        image_url: publicUrl,
        id_category: Number(selectedCategoryId),
        id_ville: Number(selectedVilleId),
        id_user: user.id,
      });

      if (insertError) {
        console.error('insertError:', insertError);
        throw insertError;
      }

      Alert.alert('Succès', 'Événement publié avec succès !');

      // reset formulaire
      setImageUri(null);
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventLieu('');
      setSelectedVilleId(null);
      setSelectedCategoryId(null);
      setSelectedDate(new Date());

      onUploadComplete?.();
    } catch (err) {
      console.error('Erreur upload ou insertion:', err);
      // Si c'est une erreur réseau (StorageUnknownError: Network request failed), possible causes:
      // - pas d'accès internet sur l'appareil / émulateur
      // - problème CORS / règles du bucket (vérifier si le bucket est public ou policy)
      // - taille / format non supporté
      const message = (err && err.message) || JSON.stringify(err);
      Alert.alert('Erreur', `Échec du téléchargement / insertion: ${message}`);
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
        <Text style={styles.title}>Créer un événement</Text>

        <TextInput
          style={styles.input}
          placeholder="Titre de l'événement"
          placeholderTextColor="#aaa"
          value={eventTitle}
          onChangeText={setEventTitle}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          placeholderTextColor="#aaa"
          value={eventDescription}
          onChangeText={setEventDescription}
          multiline
        />

        <TextInput
          style={styles.input}
          placeholder="Lieu"
          placeholderTextColor="#aaa"
          value={eventLieu}
          onChangeText={setEventLieu}
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedVilleId}
            onValueChange={(val) => setSelectedVilleId(val)}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Sélectionner une ville" value={null} />
            {villes.map((v) => (
              <Picker.Item key={v.id_ville} label={v.nom_ville} value={v.id_ville} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategoryId}
            onValueChange={(val) => setSelectedCategoryId(val)}
            style={styles.picker}
            dropdownIconColor="#fff"
          >
            <Picker.Item label="Sélectionner une catégorie" value={null} />
            {categories.map((c) => (
              <Picker.Item key={c.id_category} label={c.nom_category} value={c.id_category} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
          <Ionicons name="calendar-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.dateInputText}>{eventDate ? `Date : ${eventDate}` : 'Sélectionner la date'}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
        )}

        <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={28} color="#fff" style={{ marginRight: 10 }} />
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
            <Text style={styles.buttonText}>{uploading ? 'Envoi...' : 'Publier'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#1a1a1a', padding: 20, paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16, textAlign: 'center' },
  input: { width: '100%', backgroundColor: '#333', color: '#fff', padding: 14, borderRadius: 8, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: '#555', height: 50 },
  textArea: { height: 110, textAlignVertical: 'top' },
  dateInputButton: { width: '100%', backgroundColor: '#333', padding: 14, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#555', flexDirection: 'row', alignItems: 'center', height: 60 },
  dateInputText: { color: '#fff', fontSize: 15 },
  pickerContainer: { width: '100%', backgroundColor: '#333', borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#555', height: 50, justifyContent: 'center' },
  picker: { color: '#fff', height: 50 },
  pickImageButton: { backgroundColor: '#333', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pickImageButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  imagePreviewContainer: { alignItems: 'center', width: '100%', marginBottom: 12 },
  imagePreview: { width: 260, height: 160, borderRadius: 10, marginVertical: 10, borderWidth: 1, borderColor: '#ddd' },
  activityIndicator: { marginTop: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 30 },
  button: { flex: 1, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  uploadButton: { backgroundColor: '#8A2BE2', padding: 14 },
  cancelButton: { backgroundColor: '#555', padding: 14 },
});
