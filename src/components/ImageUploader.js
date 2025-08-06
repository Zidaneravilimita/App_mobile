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
  const [selectedDateObject, setSelectedDateObject] = useState(new Date()); // Objet Date pour le sélecteur

  const [submittingForm, setSubmittingForm] = useState(false);

  // Fonction utilitaire pour formater une date en YYYY-MM-DD
  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
    console.log('--- pickImage: Début ---');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Désolé, nous avons besoin des permissions pour accéder à votre galerie !');
      console.log('--- pickImage: Permission refusée ---');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // WARN: deprecated, but functional
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setDownloadURL(null);
      console.log('--- pickImage: Image sélectionnée, URI:', result.assets[0].uri.substring(0, 50), '...');
    } else {
      console.log('--- pickImage: Sélection d\'image annulée ---');
    }
    console.log('--- pickImage: Fin ---');
  };

  const uploadImageToSupabase = async () => {
    if (!imageUri) {
      Alert.alert('Aucune image sélectionnée', 'Veuillez sélectionner une image pour l\'événement.');
      return null;
    }

    setUploading(true);
    console.log('--- uploadImageToSupabase: setUploading(true) ---');

    try {
      console.log('--- uploadImageToSupabase: Tentative de fetch de l\'URI de l\'image:', imageUri.substring(0, 50), '...');
      const response = await fetch(imageUri);
      
      // Ajout de logs pour le débogage du réseau
      if (!response.ok) {
        console.error(`--- uploadImageToSupabase: Erreur HTTP lors du fetch: ${response.status} ${response.statusText}`);
        // Tenter de lire le corps de la réponse pour plus de détails si disponible
        try {
          const errorBody = await response.text();
          console.error('--- uploadImageToSupabase: Corps de la réponse d\'erreur:', errorBody.substring(0, 100));
        } catch (e) {
          console.error('--- uploadImageToSupabase: Impossible de lire le corps de la réponse d\'erreur.');
        }
        throw new Error(`Erreur HTTP lors du fetch: ${response.status} ${response.statusText}`);
      }
      console.log('--- uploadImageToSupabase: Réponse fetch obtenue (OK) ---');
      const blob = await response.blob();
      console.log('--- uploadImageToSupabase: Blob de l\'image créé, type:', blob.type);

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
      console.log(`--- uploadImageToSupabase: Préparation upload vers bucket: ${bucketName}, filename: ${filename} ---`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filename, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('--- uploadImageToSupabase: Erreur Supabase Storage:', uploadError.message);
        throw uploadError;
      }

      console.log('--- uploadImageToSupabase: Image téléchargée avec succès vers Supabase Storage ! ---', uploadData);
      // Alert.alert('Upload Réussi', 'Image téléchargée vers le stockage !'); // Déplacé vers la fin de handlePublish

      console.log('--- uploadImageToSupabase: Tentative d\'obtention de l\'URL publique ---');
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);

      if (!publicUrlData || !publicUrlData.publicUrl) {
          console.error('--- uploadImageToSupabase: Erreur: Impossible d\'obtenir l\'URL publique de l\'image.');
          throw new Error('Impossible d\'obtenir l\'URL publique de l\'image.');
      }

      const url = publicUrlData.publicUrl;
      setDownloadURL(url);
      console.log('--- uploadImageToSupabase: URL de téléchargement obtenue:', url.substring(0, 50), '...');
      return url;

    } catch (error) {
      console.error('--- uploadImageToSupabase: Erreur générale capturée dans le catch ---', error);
      // Afficher une alerte plus générique pour les erreurs réseau non spécifiques
      if (error instanceof TypeError && error.message === 'Network request failed') {
        Alert.alert('Erreur Réseau', 'Impossible de se connecter au serveur. Vérifiez votre connexion internet ou réessayez plus tard.');
      } else {
        Alert.alert('Erreur d\'Upload', error.message);
      }
      return null;
    } finally {
      setUploading(false);
      console.log('--- uploadImageToSupabase: setUploading(false) dans finally ---');
    }
  };

  const handlePublish = async () => {
    setSubmittingForm(true);
    console.log('--- handlePublish: Début ---');

    if (!eventTitle || !eventDescription || !eventDate || !selectedVilleId || !selectedTypeEventId || !imageUri) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs et sélectionner une image.");
      setSubmittingForm(false);
      console.log('--- handlePublish: Champs manquants ---');
      return;
    }

    if (!eventDate) {
        Alert.alert("Date manquante", "Veuillez sélectionner une date pour l'événement.");
        setSubmittingForm(false);
        console.log('--- handlePublish: Date manquante ---');
        return;
    }

    console.log('--- handlePublish: Appel de uploadImageToSupabase ---');
    const imageUrl = await uploadImageToSupabase();
    if (!imageUrl) {
      setSubmittingForm(false);
      console.log('--- handlePublish: Upload de l\'image échoué ---');
      return;
    }
    console.log('--- handlePublish: Image URL obtenue:', imageUrl.substring(0, 50), '...');

    try {
      console.log('--- handlePublish: Tentative d\'insertion en base de données ---');
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
        console.error('--- handlePublish: Erreur d\'Insertion (Base de Données):', eventInsertError.message);
        throw eventInsertError;
      }

      console.log('--- handlePublish: Référence de l\'image ajoutée à la base de données Supabase ! ---');
      // Notification de succès améliorée
      Alert.alert('🎉 Succès ! 🎉', 'Votre événement a été publié avec succès !', [
        { text: 'OK', onPress: () => {
            setImageUri(null);
            setDownloadURL(null);
            setEventTitle('');
            setEventDescription('');
            setEventDate('');
            setSelectedDateObject(new Date());
            if (villes.length > 0) setSelectedVilleId(villes[0].id_ville);
            if (typeEvenements.length > 0) setSelectedTypeEventId(typeEvenements[0].id_type_event);
            if (onUploadComplete) {
              onUploadComplete();
            }
            console.log('--- handlePublish: Formulaire réinitialisé et onUploadComplete appelé ---');
          }
        }
      ]);

    } catch (error) {
      console.error('--- handlePublish: Erreur lors de la publication de l\'événement (catch final):', error.message);
      Alert.alert('Erreur de publication', error.message);
    } finally {
      setSubmittingForm(false);
      console.log('--- handlePublish: setSubmittingForm(false) dans finally ---');
      console.log('--- handlePublish: Fin ---');
    }
  };

  const handleCancel = () => {
    setImageUri(null);
    setDownloadURL(null);
    setEventTitle('');
    setEventDescription('');
    setEventDate('');
    setSelectedDateObject(new Date());
    if (villes.length > 0) setSelectedVilleId(villes[0].id_ville);
    if (typeEvenements.length > 0) setSelectedTypeEventId(typeEvenements[0].id_type_event);
    setUploading(false);
    setSubmittingForm(false);
    if (onUploadComplete) {
      onUploadComplete();
    }
    console.log('--- handleCancel: Formulaire annulé et réinitialisé ---');
  };

  // Gestionnaire de changement de date pour DateTimePicker
  const onDateChange = (event, selectedDate) => {
    console.log('--- onDateChange: Événement de date déclenché ---');
    console.log('--- onDateChange: selectedDate object:', selectedDate);
    const currentDate = selectedDate || selectedDateObject;
    setShowDatePicker(Platform.OS === 'ios'); // Sur iOS, le sélecteur reste ouvert, sur Android il se ferme
    setSelectedDateObject(currentDate);
    setEventDate(formatDateToYYYYMMDD(currentDate)); // Mettre à jour la date formatée
    console.log('--- onDateChange: eventDate formatée:', formatDateToYYYYMMDD(currentDate));
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

        {/* Section Date (avec sélecteur de date) */}
        <Text style={styles.label}>Date de l'événement :</Text>
        <TouchableOpacity 
          onPress={() => {
            console.log('--- TouchableOpacity Date pressé: setShowDatePicker(true) ---');
            setShowDatePicker(true);
          }} 
          style={styles.dateInputButton}
        >
          <Text style={styles.dateInputText}>
            {eventDate ? eventDate : "Sélectionner une date"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDateObject}
            mode="date"
            display="default" // ou 'spinner' pour iOS, 'calendar' pour Android
            onChange={onDateChange}
            minimumDate={new Date()} // Empêche de sélectionner des dates passées
          />
        )}
        
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
    color: '#fff', // Couleur du texte sélectionné affiché dans le Picker
  },
  pickerItem: {
    color: '#000', // Texte noir pour les éléments du Picker (pour visibilité sur fond blanc)
    backgroundColor: '#fff', // Fond blanc pour les éléments du Picker (pour visibilité du texte noir)
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
  dateInputButton: {
    width: '100%',
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'flex-start', // Aligner le texte à gauche
    height: 50, // Hauteur similaire aux autres inputs
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
