// src/components/ImageUploader.js
import React, { useState } from 'react';
import { View, Button, Image, Alert, ActivityIndicator, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// Importez le client Supabase que vous avez initialisé
import { supabase } from '../config/supabase'; // Assurez-vous que le chemin est correct

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
      // 1. Convertir l'URI de l'image en Blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // 2. Définir un nom de fichier unique pour Supabase Storage
      const fileExtension = imageUri.split('.').pop();
      // Le chemin sera 'public_images/timestamp.ext' dans le bucket 'images'
      const filename = `public_images/${Date.now()}.${fileExtension}`;
      const bucketName = 'images'; // Nom de votre bucket Supabase

      // 3. Uploader l'image vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filename, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        // Si l'upload vers le stockage échoue
        Alert.alert('Erreur d\'Upload (Stockage)', uploadError.message);
        throw uploadError; // Rejeter l'erreur pour le bloc catch final
      }

      console.log('Image téléchargée avec succès vers Supabase Storage !', uploadData);
      Alert.alert('Upload Réussi', 'Image téléchargée vers le stockage !'); // Notification de succès pour le stockage

      // 4. Obtenir l'URL publique de l'image téléchargée
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);

      if (!publicUrlData || !publicUrlData.publicUrl) {
          Alert.alert('Erreur d\'URL', 'Impossible d\'obtenir l\'URL publique de l\'image.');
          throw new Error('Impossible d\'obtenir l\'URL publique de l\'image.');
      }

      const url = publicUrlData.publicUrl;
      setDownloadURL(url);
      console.log('URL de téléchargement:', url);

      // 5. Enregistrer l'URL et les métadonnées dans la base de données Supabase (PostgreSQL)
      // Assurez-vous d'avoir une table 'gallery_images' avec les colonnes 'url' et 'file_name'
      // Si vous avez une colonne 'created_at' avec DEFAULT NOW() dans votre table, elle sera remplie automatiquement.
      const { error: dbError } = await supabase.from('gallery_images').insert([
        {
          url: url,
          file_name: filename,
          // Si votre table a une colonne 'user_id' et que vous n'utilisez pas l'authentification,
          // cette colonne doit être NULLABLE dans la définition de votre table Supabase,
          // ou avoir une valeur par défaut.
        },
      ]);

      if (dbError) {
        // Si l'insertion en base de données échoue
        Alert.alert('Erreur d\'Insertion (Base de Données)', dbError.message);
        throw dbError; // Rejeter l'erreur pour le bloc catch final
      }

      console.log('Référence de l\'image ajoutée à la base de données Supabase !');
      Alert.alert('Insertion BDD Réussie', 'Les informations de l\'image ont été enregistrées en base de données !'); // Notification de succès pour la BDD

      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (error) {
      // Ce bloc catch attrape toutes les erreurs (upload stockage, URL, insertion BDD)
      console.error('Erreur générale lors du processus d\'upload:', error);
      // L'alerte spécifique aura déjà été affichée, mais on peut en ajouter une générique si besoin.
      // Alert.alert('Échec de l\'Upload', 'Une erreur est survenue: ' + error.message);
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
