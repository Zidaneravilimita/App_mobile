// src/components/ImageUploader.js
import React, { useState, useEffect } from "react";
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
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../config/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ImageUploader({ onUploadComplete }) {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [villes, setVilles] = useState([]);
  const [selectedVilleId, setSelectedVilleId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLieu, setEventLieu] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loadingData, setLoadingData] = useState(true);
  const [bucketExists, setBucketExists] = useState(false);
  const [checkingBucket, setCheckingBucket] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  
  // États pour la notification temporaire
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    initializeApp();
  }, []);

  // Afficher une notification temporaire
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setNotificationVisible(true);
    
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        hideNotification();
      }, 3000);
    });
  };

  // Cacher la notification
  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setNotificationVisible(false);
    });
  };

  const initializeApp = async () => {
    const configOk = await checkSupabaseConfig();
    if (configOk) {
      await loadInitialData();
      await checkBucketExists();
    } else {
      setNetworkError(true);
      showNotification("Problème de configuration", "error");
      loadDefaultData();
    }
  };

  const checkSupabaseConfig = async () => {
    try {
      console.log("Vérification de la configuration Supabase...");
      
      // Test de base pour vérifier que Supabase répond
      const { data: testData, error: testError } = await supabase
        .from('ville')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error("Erreur test Supabase:", testError);
        return false;
      }
      
      console.log("Supabase configuré correctement");
      return true;
    } catch (error) {
      console.error("Erreur configuration Supabase:", error);
      return false;
    }
  };

  const configureBucketPermissions = async () => {
    try {
      console.log("Configuration des permissions du bucket...");
      
      // Policies pour accès public
      const policies = [
        {
          name: 'Public Access',
          bucket_id: 'images',
          operation: 'SELECT',
          definition: 'true',
          check: 'true'
        },
        {
          name: 'Authenticated Upload',
          bucket_id: 'images',
          operation: 'INSERT',
          definition: 'auth.role() = "authenticated"',
          check: 'true'
        }
      ];

      for (const policy of policies) {
        try {
          const { error } = await supabase
            .from('storage.policies')
            .insert(policy)
            .select();

          if (error && !error.message.includes('duplicate key')) {
            console.log("Erreur policy:", policy.name, error);
          }
        } catch (policyError) {
          console.log("Policy peut exister déjà:", policy.name);
        }
      }
      
      console.log("Policies configurées");
    } catch (error) {
      console.error("Erreur configuration permissions:", error);
    }
  };

  const forceBucketDetection = async () => {
    try {
      console.log("Détection du bucket...");
      
      const methods = [
        // Méthode 1: Accès direct
        async () => {
          const { data, error } = await supabase.storage
            .from('images')
            .list('', { limit: 1 });
          return { success: !error, method: 'direct_access' };
        },
        // Méthode 2: List buckets
        async () => {
          const { data, error } = await supabase.storage.listBuckets();
          const exists = data?.some(bucket => bucket.name === 'images');
          return { success: exists && !error, method: 'list_buckets' };
        }
      ];
      
      for (const method of methods) {
        try {
          const result = await method();
          if (result.success) {
            console.log(`Bucket détecté via: ${result.method}`);
            return true;
          }
        } catch (error) {
          console.log(`Échec méthode:`, error);
        }
      }
      
      console.log("Bucket non détecté par aucune méthode");
      return false;
      
    } catch (error) {
      console.error("Erreur détection bucket:", error);
      return false;
    }
  };

  const checkBucketExists = async () => {
    try {
      setCheckingBucket(true);
      setNetworkError(false);
      console.log("Vérification du bucket 'images'...");
      
      // Test de connexion réseau
      try {
        const networkTest = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!networkTest.ok) {
          throw new Error('Network test failed');
        }
      } catch (networkError) {
        console.log("Aucune connexion internet:", networkError);
        setNetworkError(true);
        showNotification("Aucune connexion internet", "error");
        setBucketExists(false);
        setCheckingBucket(false);
        return;
      }

      // Détection du bucket
      const bucketDetected = await forceBucketDetection();
      
      if (bucketDetected) {
        setBucketExists(true);
        showNotification("Storage disponible ✓", "success");
        await configureBucketPermissions();
      } else {
        setBucketExists(false);
        showNotification("Bucket inaccessible", "warning");
      }
      
    } catch (error) {
      console.error("Erreur vérification bucket:", error);
      setNetworkError(true);
      showNotification("Erreur de connexion", "error");
      setBucketExists(false);
    } finally {
      setCheckingBucket(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      setNetworkError(false);
      
      // Vérifier la connexion réseau
      try {
        const networkTest = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!networkTest.ok) {
          throw new Error('Network test failed');
        }
      } catch (networkError) {
        console.log("Aucune connexion internet pour les données:", networkError);
        setNetworkError(true);
        showNotification("Connexion internet requise", "error");
        loadDefaultData();
        return;
      }
      
      // Charger les données depuis Supabase
      try {
        await Promise.all([fetchVilles(), fetchCategories()]);
        
      } catch (error) {
        console.error("Erreur chargement données:", error);
        setNetworkError(true);
        showNotification("Erreur de chargement", "error");
        loadDefaultData();
      }
      
    } catch (error) {
      console.error("Erreur chargement initial:", error);
      setNetworkError(true);
      showNotification("Erreur de chargement", "error");
      loadDefaultData();
    } finally {
      setLoadingData(false);
    }
  };

  // Charger des données par défaut en cas d'erreur
  const loadDefaultData = () => {
    console.log("Chargement des données par défaut");
    
    const defaultVilles = [
      { id_ville: 1, nom_ville: "Paris" },
      { id_ville: 2, nom_ville: "Lyon" },
      { id_ville: 3, nom_ville: "Marseille" },
      { id_ville: 4, nom_ville: "Toulouse" },
      { id_ville: 5, nom_ville: "Bordeaux" }
    ];
    
    const defaultCategories = [
      { id_category: 1, nom_category: "Concert" },
      { id_category: 2, nom_category: "Festival" },
      { id_category: 3, nom_category: "Exposition" },
      { id_category: 4, nom_category: "Conférence" },
      { id_category: 5, nom_category: "Sport" }
    ];
    
    setVilles(defaultVilles);
    setCategories(defaultCategories);
    
    if (defaultVilles.length > 0) {
      setSelectedVilleId(defaultVilles[0].id_ville);
    }
    
    if (defaultCategories.length > 0) {
      setSelectedCategoryId(defaultCategories[0].id_category);
    }
  };

  const fetchVilles = async () => {
    try {
      const { data, error } = await supabase
        .from("ville")
        .select("id_ville, nom_ville")
        .order("nom_ville");

      if (error) {
        console.error("Erreur fetch villes:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setVilles(data);
        setSelectedVilleId(data[0].id_ville);
      } else {
        throw new Error('No cities found');
      }
    } catch (err) {
      console.error("Erreur fetch villes:", err);
      throw err;
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("category")
        .select("id_category, nom_category")
        .order("nom_category");

      if (error) {
        console.error("Erreur fetch categories:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        setCategories(data);
        setSelectedCategoryId(data[0].id_category);
      } else {
        throw new Error('No categories found');
      }
    } catch (err) {
      console.error("Erreur fetch categories:", err);
      throw err;
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Accès à la galerie nécessaire');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erreur sélection image:", error);
      Alert.alert("Erreur", "Impossible de sélectionner une image");
    }
  };

  const uploadImageToStorage = async (imageUri, userId) => {
    try {
      console.log("Tentative d'upload vers le bucket 'images'...");
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const timestamp = new Date().getTime();
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${userId}_${timestamp}.${fileExt}`;
      
      console.log("Upload du fichier:", fileName);
      
      try {
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, blob, {
            contentType: blob.type || `image/${fileExt}`,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error("Erreur upload:", error);
          return "https://placehold.co/600x400/8A2BE2/white?text=Image+Event";
        }

        console.log("Upload réussi!");
        
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(data.path);

        console.log("URL publique générée:", publicUrl);
        return publicUrl;
        
      } catch (uploadError) {
        console.error("Erreur lors de l'upload:", uploadError);
        return "https://placehold.co/600x400/8A2BE2/white?text=Image+Event";
      }

    } catch (error) {
      console.error("Erreur détaillée traitement image:", error);
      return "https://placehold.co/600x400/8A2BE2/white?text=Image+Event";
    }
  };

  const ensureUserProfileExists = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Erreur vérification profil:", error);
        return false;
      }

      if (!profile) {
        console.log("Profil n'existe pas, tentative de création...");
        
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: userId }]);

          if (insertError) {
            console.error("Erreur création profil minimaliste:", insertError);
            return false;
          }
          
          console.log("Profil créé avec succès");
          return true;
        } catch (insertError) {
          console.error("Erreur création profil:", insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Erreur inattendue vérification profil:", error);
      return false;
    }
  };

  const uploadEvent = async () => {
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventLieu.trim() || !imageUri) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setUploading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Utilisateur non connecté");
      }

      console.log("Tentative d'upload avec utilisateur:", user.id);

      const profileExists = await ensureUserProfileExists(user.id);
      
      let imageUrl = null;

      try {
        const uploadedUrl = await uploadImageToStorage(imageUri, user.id);
        if (uploadedUrl && uploadedUrl.startsWith('http')) {
          imageUrl = uploadedUrl;
          console.log("Image uploadée avec succès:", imageUrl);
        }
      } catch (uploadError) {
        console.warn("Échec upload image:", uploadError);
      }

      const insertData = {
        titre: eventTitle.trim(),
        description: eventDescription.trim(),
        date_event: new Date(eventDate).toISOString(),
        lieu_detail: eventLieu.trim(),
        image_url: imageUrl,
        id_category: parseInt(selectedCategoryId, 10),
        id_ville: parseInt(selectedVilleId, 10)
      };

      if (profileExists) {
        insertData.id_user = user.id;
      }

      const { error: insertError } = await supabase
        .from("events")
        .insert(insertData);

      if (insertError) {
        console.error("Erreur insertion événement:", insertError);
        
        if (insertError.code === '23503') {
          console.log("Tentative sans id_user due à l'erreur de clé étrangère");
          delete insertData.id_user;
          
          const { error: secondError } = await supabase
            .from("events")
            .insert(insertData);

          if (secondError) {
            console.error("Deuxième tentative échouée:", secondError);
            throw new Error("Impossible de créer l'événement");
          }
        } else {
          throw new Error("Impossible de créer l'événement");
        }
      }

      Alert.alert("Succès", "Événement créé avec succès !", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("Home");
            onUploadComplete?.();
          }
        }
      ]);

    } catch (err) {
      console.error("❌ Erreur finale:", err);
      Alert.alert("Erreur", err.message || "Impossible de créer l'événement. Contactez l'administrateur.");
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (event, date) => {
    const currentDate = date || selectedDate;
    setShowDatePicker(Platform.OS === "ios");
    setSelectedDate(currentDate);
    setEventDate(currentDate.toISOString().split("T")[0]);
  };

  const retryConnection = async () => {
    showNotification("Tentative de reconnexion...", "info");
    setLoadingData(true);
    await checkBucketExists();
    await loadInitialData();
  };

  const debugBucketAccess = async () => {
    try {
      console.log("=== DEBUG BUCKET ACCESS ===");
      
      // Test de connexion de base
      const { data: testData, error: testError } = await supabase
        .from('ville')
        .select('count')
        .limit(1);
      console.log("Test connexion:", testError ? `Erreur: ${testError.message}` : "OK");
      
      // List buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      console.log("List buckets:", bucketsError ? `Erreur: ${bucketsError.message}` : `Buckets: ${buckets?.map(b => b.name).join(', ')}`);
      
      // Accès direct
      const { data: files, error: filesError } = await supabase.storage
        .from('images')
        .list('', { limit: 1 });
      console.log("Accès direct:", filesError ? `Erreur: ${filesError.message}` : `Fichiers: ${files?.length}`);
      
      console.log("=== FIN DEBUG ===");
      
    } catch (error) {
      console.error("Erreur debug:", error);
    }
  };

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
        {networkError && (
          <TouchableOpacity onPress={retryConnection} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Réessayer la connexion</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Notification temporaire */}
      {notificationVisible && (
        <Animated.View 
          style={[
            styles.notificationContainer,
            notification.type === "success" ? styles.notificationSuccess : 
            notification.type === "warning" ? styles.notificationWarning : 
            styles.notificationError,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Ionicons 
            name={
              notification.type === "success" ? "checkmark-circle" :
              notification.type === "warning" ? "warning" : "alert-circle"
            } 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.notificationText}>{notification.message}</Text>
          <TouchableOpacity onPress={hideNotification}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Créer un événement</Text>

        {/* Indicateur d'erreur réseau */}
        {networkError && (
          <View style={styles.networkErrorContainer}>
            <Ionicons name="cloud-offline" size={20} color="#fff" />
            <Text style={styles.networkErrorText}>Problème de connexion</Text>
            <TouchableOpacity onPress={retryConnection} style={styles.retryButton}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.retryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Statut du bucket */}
        {!networkError && (
          <View style={bucketExists ? styles.successContainer : styles.warningContainer}>
            <Ionicons 
              name={bucketExists ? "checkmark-circle" : "warning"} 
              size={20} 
              color={bucketExists ? "#4CAF50" : "#ff9900"} 
            />
            <Text style={bucketExists ? styles.successText : styles.warningText}>
              {bucketExists ? "Storage prêt ✓" : "Vérification storage..."}
            </Text>
          </View>
        )}

        <TextInput 
          style={styles.input} 
          placeholder="Titre de l'événement" 
          value={eventTitle} 
          onChangeText={setEventTitle} 
          placeholderTextColor="#aaa" 
        />
        
        <TextInput 
          style={[styles.input, styles.textArea]} 
          placeholder="Description" 
          value={eventDescription} 
          onChangeText={setEventDescription} 
          multiline 
          placeholderTextColor="#aaa" 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Lieu détaillé" 
          value={eventLieu} 
          onChangeText={setEventLieu} 
          placeholderTextColor="#aaa" 
        />

        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedVilleId} onValueChange={setSelectedVilleId} style={styles.picker}>
            {villes.map((ville) => (
              <Picker.Item key={ville.id_ville} label={ville.nom_ville} value={ville.id_ville} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedCategoryId} onValueChange={setSelectedCategoryId} style={styles.picker}>
            {categories.map((category) => (
              <Picker.Item key={category.id_category} label={category.nom_category} value={category.id_category} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputButton}>
          <Ionicons name="calendar-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.dateInputText}>
            {eventDate || "Sélectionner une date"}
          </Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" onChange={onDateChange} />
        )}

        <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.pickImageButtonText}>
            {imageUri ? "Changer l'image" : "Sélectionner une image"}
          </Text>
        </TouchableOpacity>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.imagePreview} />}

        {uploading && <ActivityIndicator size="large" color="#8A2BE2" style={styles.loader} />}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.uploadButton]} 
            onPress={uploadEvent} 
            disabled={uploading || checkingBucket || networkError}
          >
            <Text style={styles.buttonText}>
              {uploading ? "Publication..." : (networkError ? "Hors ligne" : "Publier")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bouton debug */}
        <TouchableOpacity onPress={debugBucketAccess} style={styles.debugButton}>
          <Text style={styles.debugButtonText}>Debug</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#1a1a1a", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff", marginBottom: 20, textAlign: "center" },
  
  // Notification styles
  notificationContainer: {
    position: "absolute",
    top: 0,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    zIndex: 1000,
    marginTop: 10,
    gap: 10,
  },
  notificationSuccess: {
    backgroundColor: "#4CAF50",
  },
  notificationWarning: {
    backgroundColor: "#FF9800",
  },
  notificationError: {
    backgroundColor: "#F44336",
  },
  notificationText: {
    color: "#fff",
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },

  // Network error styles
  networkErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  networkErrorText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },

  // Bucket status styles
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e3a1e",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#332900",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ff9900",
  },
  successText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
  },
  warningText: {
    color: "#ff9900",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 10,
  },

  // Debug button
  debugButton: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  debugButtonText: {
    color: "#ccc",
    fontSize: 12,
  },

  input: { backgroundColor: "#333", color: "#fff", padding: 14, borderRadius: 8, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: "#555" },
  textArea: { height: 100, textAlignVertical: "top" },
  pickerContainer: { backgroundColor: "#333", borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "#555", height: 50, justifyContent: "center" },
  picker: { color: "#fff" },
  dateInputButton: { backgroundColor: "#333", padding: 14, borderRadius: 8, flexDirection: "row", alignItems: "center", marginBottom: 12, height: 50, borderWidth: 1, borderColor: "#555" },
  dateInputText: { color: "#fff", fontSize: 16 },
  pickImageButton: { backgroundColor: "#333", padding: 14, borderRadius: 8, flexDirection: "row", alignItems: "center", marginBottom: 12, height: 50, borderWidth: 1, borderColor: "#555" },
  pickImageButtonText: { color: "#fff", fontSize: 16 },
  imagePreview: { width: 200, height: 150, borderRadius: 8, marginBottom: 12, alignSelf: "center" },
  loader: { marginVertical: 20 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 20 },
  button: { flex: 1, padding: 15, borderRadius: 8, alignItems: "center" },
  uploadButton: { backgroundColor: "#8A2BE2" },
  cancelButton: { backgroundColor: "#555" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1a1a1a" },
  loadingText: { color: "#fff", marginTop: 10, marginBottom: 10 }
});