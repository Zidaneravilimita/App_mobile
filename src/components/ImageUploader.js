// src/components/ImageUploader.js
import React, { useState } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Correction de la syntaxe ici
// Importez le client Supabase que vous avez initialisé
import { supabase } from '../config/supabase'; // Chemin correct pour src/components/ vers src/config/

export default function ImageUploader({ onUploadComplete }) {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadURL, setDownloadURL] = useState(null);

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

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Aucune image sélectionnée', 'Veuillez sélectionner une image d\'abord.');
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const fileExtension = imageUri.split('.').pop();
      const filename = `public_images/${Date.now()}.${fileExtension}`;
      const bucketName = 'images'; // Nom de votre bucket Supabase

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filename, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      console.log('Image téléchargée avec succès vers Supabase Storage !', uploadData);

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);

      if (!publicUrlData || !publicUrlData.publicUrl) {
          throw new Error('Impossible d\'obtenir l\'URL publique de l\'image.');
      }

      const url = publicUrlData.publicUrl;
      setDownloadURL(url);
      Alert.alert('Upload Réussi', 'Image téléchargée et URL obtenue !');
      console.log('URL de téléchargement:', url);

      const { error: dbError } = await supabase.from('gallery_images').insert([
        {
          url: url,
          file_name: filename,
        },
      ]);

      if (dbError) {
        throw dbError;
      }
      console.log('Référence de l\'image ajoutée à la base de données Supabase !');

      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (error) {
      console.error('Erreur lors de l\'upload ou de l\'ajout à Supabase:', error);
      Alert.alert('Erreur d\'upload', error.message);
    } finally {
      setUploading(false);
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
