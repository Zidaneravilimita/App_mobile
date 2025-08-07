// src/components/ImageUploader.js
import React, { useState, useEffect } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
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
  const [eventDate, setEventDate] = useState(''); // Champ de texte pour la date

  const [submittingForm, setSubmittingForm] = useState(false);

  // Chargement des villes depuis Supabase
  useEffect(() => {
    const fetchVilles = async () => {
      const { data, error } = await supabase.from('ville').select('id_ville, nom_ville');
      if (error) {
        console.error("Erreur lors du chargement des villes:", error.message);
        Alert.alert("Erreur", "Impossible de charger les villes.");
      } else {
        setVilles(data);
        if (data.length > 0) {
          setSelectedVilleId(data[0].id_ville);
        }
      }
    };
    fetchVilles();
  }, []);

  // Chargement des types d'événements en fonction de la ville sélectionnée
  useEffect(() => {
    const fetchTypeEvenements = async () => {
      if (!selectedVilleId) {
        setTypeEvenements([]);
        setSelectedTypeEventId('');
        return;
      }

      const { data, error } = await supabase
        .from('type_evenements')
        .select('id_type_event, nom_event')
        .eq('id_ville', selectedVilleId);

      if (error) {
        console.error("Erreur lors du chargement des catégories:", error.message);
        Alert.alert("Erreur", "Impossible de charger les catégories.");
      } else {
        setTypeEvenements(data);
        if (data.length > 0) {
          setSelectedTypeEventId(data[0].id_type_event);
        } else {
          setSelectedTypeEventId('');
        }
      }
    };
    fetchTypeEvenements();
  }, [selectedVilleId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Désolé, nous avons besoin des permissions pour accéder à votre galerie !');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setDownloadURL(null);
    }
  };

  const uploadImageToSupabase = async () => {
    if (!imageUri) {
      Alert.alert('Aucune image sélectionnée', "Veuillez sélectionner une image pour l'événement.");
      return null;
    }

    setUploading(true);

    try {
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP lors du fetch: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      
      let fileExtension = 'jpg';
      if (blob.type) {
        const mimeParts = blob.type.split('/');
        if (mimeParts.length > 1) {
          fileExtension = mimeParts[1];
          if (fileExtension === 'jpeg') {
            fileExtension = 'jpg';
          }
        }
      }
      
      const filename = `public_images/${Date.now()}.${fileExtension}`;
      const bucketName = 'images';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filename, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);

      if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error("Impossible d'obtenir l'URL publique de l'image.");
      }

      const url = publicUrlData.publicUrl;
      setDownloadURL(url);
      return url;

    } catch (error) {
      if (error instanceof TypeError && error.message === 'Network request failed') {
        Alert.alert('Erreur Réseau', 'Impossible de se connecter au serveur. Vérifiez votre connexion internet ou réessayez plus tard.');
      } else {
        Alert.alert('Erreur d\'Upload', error.message);
      }
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    setSubmittingForm(true);

    if (!eventTitle || !eventDescription || !eventDate || !selectedVilleId || !selectedTypeEventId || !imageUri) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs et sélectionner une image.");
      setSubmittingForm(false);
      return;
    }

    const imageUrl = await uploadImageToSupabase();
    if (!imageUrl) {
      setSubmittingForm(false);
      return;
    }

    try {
      const { error: eventInsertError } = await supabase.from('event').insert([
        {
          id_type_event: selectedTypeEventId,
          nom_event: eventTitle,
          description: eventDescription,
          date: eventDate,
          photo: imageUrl,
        },
      ]);

      if (eventInsertError) {
        throw eventInsertError;
      }

      Alert.alert('🎉 Succès ! 🎉', 'Votre événement a été publié avec succès !', [
        { text: 'OK', onPress: () => {
            setImageUri(null);
            setDownloadURL(null);
            setEventTitle('');
            setEventDescription('');
            setEventDate('');
            if (villes.length > 0) setSelectedVilleId(villes[0].id_ville);
            if (typeEvenements.length > 0) setSelectedTypeEventId(typeEvenements[0].id_type_event);
            if (onUploadComplete) {
              onUploadComplete();
            }
          }
        }
      ]);

    } catch (error) {
      Alert.alert('Erreur de publication', error.message);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleCancel = () => {
    setImageUri(null);
    setDownloadURL(null);
    setEventTitle('');
    setEventDescription('');
    setEventDate('');
    if (villes.length > 0) setSelectedVilleId(villes[0].id_ville);
    if (typeEvenements.length > 0) setSelectedTypeEventId(typeEvenements[0].id_type_event);
    setUploading(false);
    setSubmittingForm(false);
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  return (
    <ScrollView style={styles.scrollViewContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Créer un Nouvel Événement</Text>

        {/* Section Choisir une Ville */}
        <Text style={styles.label}>Choisir une ville :</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedVilleId}
            onValueChange={(itemValue) => setSelectedVilleId(itemValue)}
            style={styles.picker}
          >
            {villes.length > 0 ? (
              villes.map((ville) => (
                <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
              ))
            ) : (
              <Picker.Item label="Chargement des villes..." value="" />
            )}
          </Picker>
        </View>

        {/* Section Catégories */}
        <Text style={styles.label}>Catégories :</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTypeEventId}
            onValueChange={(itemValue) => setSelectedTypeEventId(itemValue)}
            style={styles.picker}
          >
            {typeEvenements.length > 0 ? (
              typeEvenements.map((type) => (
                <Picker.Item key={type.id_type_event} label={type.nom_event} value={type.id_type_event} />
              ))
            ) : (
              <Picker.Item label="Sélectionnez une ville d'abord..." value="" />
            )}
          </Picker>
        </View>

        {/* Section Titre */}
        <Text style={styles.label}>Titre de l'événement :</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Soirée DJ au Club 73"
          placeholderTextColor="#888"
          value={eventTitle}
          onChangeText={setEventTitle}
        />

        {/* Section Date (avec saisie manuelle) */}
        <Text style={styles.label}>Date de l'événement (AAAA-MM-JJ) :</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 2025-12-31"
          placeholderTextColor="#888"
          value={eventDate}
          onChangeText={setEventDate}
        />
        
        {/* Section Description */}
        <Text style={styles.label}>Description :</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Décrivez votre événement en détail..."
          placeholderTextColor="#888"
          multiline
          numberOfLines={4}
          value={eventDescription}
          onChangeText={setEventDescription}
        />

        {/* Section Insertion d'Image */}
        <Text style={styles.label}>Image de l'événement :</Text>
        <Button title="Sélectionner une Image" onPress={pickImage} color="#8A2BE2" />
        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            {uploading && <ActivityIndicator size="large" color="#007BFF" style={styles.activityIndicator} />}
            {downloadURL && <Text style={styles.downloadURLText}>URL: {downloadURL.substring(0, 50)}...</Text>}
          </View>
        )}

        {/* Boutons Annuler et Publier */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel} disabled={submittingForm}>
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.publishButton, (submittingForm || uploading) && styles.buttonDisabled]} 
            onPress={handlePublish} 
            disabled={submittingForm || uploading}
          >
            {submittingForm ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Publier</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    width: '100%',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#8A2BE2', 
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#fff',
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
  imagePreviewContainer: {
    marginTop: 20,
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
  downloadURLText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  publishButton: {
    backgroundColor: '#8A2BE2',
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
