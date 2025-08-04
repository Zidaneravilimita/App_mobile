// src/components/ImageUploader.js
import React, { useState, useEffect } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker'; // Pour les sélections déroulantes
import { supabase } from '../config/supabase';

export default function ImageUploader({ onUploadComplete }) {
  // États pour la sélection d'image
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState(null); // URL de l'image uploadée

  // États pour les données du formulaire
  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState(''); // Stocke l'ID de la ville sélectionnée
  const [typeEvenements, setTypeEvenements] = useState([]);
  const [selectedTypeEventId, setSelectedTypeEventId] = useState(''); // Stocke l'ID du type d'événement sélectionné
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(''); // Format YYYY-MM-DD
  const [submittingForm, setSubmittingForm] = useState(false); // État pour la soumission du formulaire

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
          setSelectedVilleId(data[0].id_ville); // Sélectionne la première ville par défaut
        }
      }
    };
    fetchVilles();
  }, []);

  // Chargement des types d'événements en fonction de la ville sélectionnée
  useEffect(() => {
    const fetchTypeEvenements = async () => {
      if (!selectedVilleId) return; // Ne charge pas si aucune ville n'est sélectionnée

      const { data, error } = await supabase
        .from('type_evenements')
        .select('id_type_event, nom_event')
        .eq('id_ville', selectedVilleId); // Filtre par id_ville

      if (error) {
        console.error("Erreur lors du chargement des catégories:", error.message);
        Alert.alert("Erreur", "Impossible de charger les catégories.");
      } else {
        setTypeEvenements(data);
        if (data.length > 0) {
          setSelectedTypeEventId(data[0].id_type_event); // Sélectionne la première catégorie par défaut
        } else {
          setSelectedTypeEventId(''); // Aucune catégorie disponible
        }
      }
    };
    fetchTypeEvenements();
  }, [selectedVilleId]); // Déclenche le rechargement si la ville change

  const pickImage = async () => {
    console.log('--- pickImage: Début ---');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Désolé, nous avons besoin des permissions pour accéder à votre galerie !');
      console.log('--- pickImage: Permission refusée ---');
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
      setDownloadURL(null); // Réinitialiser l'URL de téléchargement si une nouvelle image est sélectionnée
      console.log('--- pickImage: Image sélectionnée, URI:', result.assets[0].uri.substring(0, 50), '...');
    } else {
      console.log('--- pickImage: Sélection d\'image annulée ---');
    }
    console.log('--- pickImage: Fin ---');
  };

  // Fonction d'upload d'image, modifiée pour retourner l'URL
  const uploadImageToSupabase = async () => {
    if (!imageUri) {
      Alert.alert('Aucune image sélectionnée', 'Veuillez sélectionner une image pour l\'événement.');
      return null;
    }

    setUploading(true);
    console.log('--- uploadImageToSupabase: setUploading(true) ---');

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
          throw new Error('Impossible d\'obtenir l\'URL publique de l\'image.');
      }

      const url = publicUrlData.publicUrl;
      setDownloadURL(url); // Mettre à jour l'état de l'URL de téléchargement
      return url; // Retourner l'URL pour l'insertion en BDD

    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      Alert.alert('Erreur d\'Upload', error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Fonction pour publier l'événement
  const handlePublish = async () => {
    setSubmittingForm(true);

    // 1. Validation des champs
    if (!eventTitle || !eventDescription || !eventDate || !selectedVilleId || !selectedTypeEventId || !imageUri) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs et sélectionner une image.");
      setSubmittingForm(false);
      return;
    }

    // Validation du format de date simple (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(eventDate)) {
      Alert.alert("Format de date invalide", "Veuillez utiliser le format AAAA-MM-JJ pour la date.");
      setSubmittingForm(false);
      return;
    }

    // 2. Upload de l'image
    const imageUrl = await uploadImageToSupabase();
    if (!imageUrl) {
      setSubmittingForm(false);
      return; // L'upload a échoué, l'erreur a déjà été affichée
    }

    // 3. Insertion des données de l'événement dans la table 'event'
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

      Alert.alert('Succès', 'Votre événement a été publié avec succès !');
      // Réinitialiser le formulaire après publication réussie
      setImageUri(null);
      setDownloadURL(null);
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      // selectedVilleId et selectedTypeEventId peuvent être réinitialisés ou laisser la première option par défaut
      if (villes.length > 0) setSelectedVilleId(villes[0].id_ville);
      if (typeEvenements.length > 0) setSelectedTypeEventId(typeEvenements[0].id_type_event);

      if (onUploadComplete) {
        onUploadComplete(); // Appeler la fonction de rappel pour revenir à l'écran précédent
      }

    } catch (error) {
      console.error('Erreur lors de la publication de l\'événement:', error.message);
      Alert.alert('Erreur de publication', error.message);
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleCancel = () => {
    // Réinitialiser tous les champs et l'image sélectionnée
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
      onUploadComplete(); // Revenir à l'écran précédent si un callback est fourni
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
            itemStyle={styles.pickerItem} // Style pour les éléments du Picker
          >
            {villes.map((ville) => (
              <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
            ))}
          </Picker>
        </View>

        {/* Section Catégories */}
        <Text style={styles.label}>Catégories :</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedTypeEventId}
            onValueChange={(itemValue) => setSelectedTypeEventId(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {typeEvenements.map((type) => (
              <Picker.Item key={type.id_type_event} label={type.nom_event} value={type.id_type_event} />
            ))}
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

        {/* Section Date */}
        <Text style={styles.label}>Date (AAAA-MM-JJ) :</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 2025-12-31"
          placeholderTextColor="#888"
          value={eventDate}
          onChangeText={setEventDate}
          keyboardType="numeric" 
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
    paddingBottom: 50, // Espace pour le scroll
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
    alignSelf: 'flex-start', // Aligner le label à gauche
    width: '100%',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden', // Pour s'assurer que le borderRadius est appliqué au Picker
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#fff', // Couleur du texte sélectionné
  },
  pickerItem: {
    color: '#fff', // Couleur des options (peut ne pas être visible sur toutes les plateformes)
    backgroundColor: '#333', // Couleur de fond des options (peut ne pas être visible sur toutes les plateformes)
  },
  input: {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', // Aligner le texte en haut pour les zones de texte
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
    backgroundColor: '#8A2BE2', // Violet
  },
  cancelButton: {
    backgroundColor: '#555', // Gris foncé
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
