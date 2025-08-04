// src/components/ImageUploader.js
import React, { useState } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';

export default function ImageUploader({ onUploadComplete }) {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState(null);

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
      setDownloadURL(null);
      console.log('--- pickImage: Image sélectionnée, URI:', result.assets[0].uri.substring(0, 50), '...');
    } else {
      console.log('--- pickImage: Sélection d\'image annulée ---');
    }
    console.log('--- pickImage: Fin ---');
  };

  const uploadImage = async () => {
    console.log('--- uploadImage: Début ---');
    if (!imageUri) {
      Alert.alert('Aucune image sélectionnée', 'Veuillez sélectionner une image d\'abord.');
      console.log('--- uploadImage: Aucune image sélectionnée ---');
      return;
    }

    setUploading(true);
    console.log('--- uploadImage: setUploading(true) ---');

    try {
      console.log('--- uploadImage: Tentative de fetch de l\'URI de l\'image ---');
      const response = await fetch(imageUri);
      console.log('--- uploadImage: Réponse fetch obtenue ---');
      if (!response.ok) {
        throw new Error(`Erreur HTTP lors du fetch: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('--- uploadImage: Blob de l\'image créé ---');

      // CORRECTION ICI : Extraction de l'extension à partir du MIME type du blob
      let fileExtension = 'jpg'; // Valeur par défaut
      if (blob.type) {
        const mimeParts = blob.type.split('/');
        if (mimeParts.length > 1) {
          fileExtension = mimeParts[1]; // Ex: 'jpeg' de 'image/jpeg'
          // Gérer les cas spécifiques comme 'image/jpeg' -> 'jpg'
          if (fileExtension === 'jpeg') {
            fileExtension = 'jpg';
          }
        }
      }
      
      const filename = `public_images/${Date.now()}.${fileExtension}`; // <-- CHEMIN DU FICHIER FIXÉ ICI
      const bucketName = 'images';
      console.log(`--- uploadImage: Préparation upload vers bucket: ${bucketName}, filename: ${filename} ---`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filename, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        Alert.alert('Erreur d\'Upload (Stockage)', uploadError.message);
        console.error('--- uploadImage: Erreur d\'Upload (Stockage) ---', uploadError);
        throw uploadError;
      }

      console.log('--- uploadImage: Image téléchargée avec succès vers Supabase Storage ! ---', uploadData);
      Alert.alert('Upload Réussi', 'Image téléchargée vers le stockage !');

      console.log('--- uploadImage: Tentative d\'obtention de l\'URL publique ---');
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);

      if (!publicUrlData || !publicUrlData.publicUrl) {
          Alert.alert('Erreur d\'URL', 'Impossible d\'obtenir l\'URL publique de l\'image.');
          console.error('--- uploadImage: Erreur d\'URL publique ---');
          throw new Error('Impossible d\'obtenir l\'URL publique de l\'image.');
      }

      const url = publicUrlData.publicUrl;
      setDownloadURL(url);
      console.log('--- uploadImage: URL de téléchargement obtenue:', url.substring(0, 50), '...');

      console.log('--- uploadImage: Tentative d\'insertion en base de données ---');
      const { error: dbError } = await supabase.from('gallery_images').insert([
        {
          url: url,
          file_name: filename,
        },
      ]);

      if (dbError) {
        Alert.alert('Erreur d\'Insertion (Base de Données)', dbError.message);
        console.error('--- uploadImage: Erreur d\'Insertion (Base de Données) ---', dbError);
        throw dbError;
      }

      console.log('--- uploadImage: Référence de l\'image ajoutée à la base de données Supabase ! ---');
      Alert.alert('Insertion BDD Réussie', 'Les informations de l\'image ont été enregistrées en base de données !');

      if (onUploadComplete) {
        console.log('--- uploadImage: Appel de onUploadComplete ---');
        onUploadComplete();
      }

    } catch (error) {
      console.error('--- uploadImage: Erreur générale capturée dans le catch ---', error);
      if (!error.message.includes('Erreur d\'Upload (Stockage)') && !error.message.includes('Erreur d\'URL') && !error.message.includes('Erreur d\'Insertion (Base de Données)')) {
          Alert.alert('Échec de l\'Upload', 'Une erreur inattendue est survenue: ' + error.message);
      }
    } finally {
      setUploading(false);
      console.log('--- uploadImage: setUploading(false) dans finally ---');
      console.log('--- uploadImage: Fin ---');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Uploader une Image</Text>
      <Button title="Sélectionner une Image" onPress={pickImage} color="#8A2BE2" />
      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <Button title={uploading ? "Upload en cours..." : "Uploader l'Image"} onPress={uploadImage} disabled={uploading} color="#4CAF50" />
        </>
      )}
      {uploading && <ActivityIndicator size="large" color="#007BFF" style={styles.activityIndicator} />}
      {downloadURL && <Text style={styles.downloadURLText}>URL de l'image: {downloadURL.substring(0, 50)}...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activityIndicator: {
    marginTop: 20,
  },
  downloadURLText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 12,
    textAlign: 'center',
  },
});
