// src/services/imageConverter.js
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ImageConverter {
  constructor() {
    this.cacheDirectory = FileSystem.cacheDirectory;
    this.webpCacheKey = '@webp_image_cache';
    this.maxCacheSize = 50; // Maximum number of cached images
  }

  /**
   * Génère une clé de cache unique pour une URL d'image
   */
  generateCacheKey(imageUrl) {
    // Crée un hash plus robuste de l'URL pour utiliser comme nom de fichier
    // Utilise une combinaison de hash et de timestamp pour éviter les collisions
    const urlHash = this.simpleHash(imageUrl);
    const timestamp = Date.now().toString(36);
    return `${urlHash}_${timestamp}.webp`;
  }

  /**
   * Fonction de hash simple pour les URLs
   */
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Vérifie si une image WebP existe déjà dans le cache
   */
  async getCachedImagePath(imageUrl) {
    try {
      // Récupère le registre du cache pour trouver l'entrée correspondante
      const existingCache = await AsyncStorage.getItem(this.webpCacheKey);
      const cacheData = existingCache ? JSON.parse(existingCache) : {};
      
      // Cherche une entrée avec cette URL
      if (cacheData[imageUrl]) {
        const cacheKey = cacheData[imageUrl].cacheKey;
        const cachedPath = `${this.cacheDirectory}${cacheKey}`;
        
        const fileInfo = await FileSystem.getInfoAsync(cachedPath);
        if (fileInfo.exists) {
          console.log('✅ Image trouvée dans le cache:', cacheKey);
          return cachedPath;
        } else {
          // Le fichier n'existe plus, nettoie l'entrée
          delete cacheData[imageUrl];
          await AsyncStorage.setItem(this.webpCacheKey, JSON.stringify(cacheData));
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur vérification cache:', error);
      return null;
    }
  }

  /**
   * Télécharge une image depuis une URL
   */
  async downloadImage(imageUrl) {
    try {
      console.log('📥 Téléchargement de l\'image...');
      
      // Crée un nom de fichier temporaire
      const tempFileName = `temp_${Date.now()}.jpg`;
      const tempPath = `${this.cacheDirectory}${tempFileName}`;
      
      // Télécharge l'image
      const downloadResult = await FileSystem.downloadAsync(imageUrl, tempPath);
      
      if (downloadResult.status === 200) {
        console.log('✅ Image téléchargée avec succès');
        return tempPath;
      } else {
        throw new Error(`Erreur téléchargement: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur téléchargement image:', error);
      throw error;
    }
  }

  /**
   * Convertit une image locale en WebP avec optimisation
   */
  async convertToWebP(localPath, quality = 0.8, maxWidth = 800) {
    try {
      console.log('🔄 Conversion en WebP...');
      
      // Redimensionne et compresse l'image
      const manipResult = await ImageManipulator.manipulateAsync(
        localPath,
        [
          // Redimensionne si l'image est trop grande
          { resize: { width: maxWidth } }
        ],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.WEBP,
        }
      );

      console.log('✅ Image convertie en WebP');
      return manipResult.uri;
    } catch (error) {
      console.error('❌ Erreur conversion WebP:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde une image convertie dans le cache
   */
  async saveToCache(imageUrl, webpPath) {
    try {
      const cacheKey = this.generateCacheKey(imageUrl);
      const finalPath = `${this.cacheDirectory}${cacheKey}`;
      
      // Déplace le fichier vers le cache avec le nom final
      await FileSystem.moveAsync({
        from: webpPath,
        to: finalPath
      });

      // Met à jour le registre du cache
      await this.updateCacheRegistry(imageUrl, cacheKey);
      
      console.log('💾 Image sauvegardée dans le cache:', cacheKey);
      return finalPath;
    } catch (error) {
      console.error('❌ Erreur sauvegarde cache:', error);
      throw error;
    }
  }

  /**
   * Met à jour le registre du cache
   */
  async updateCacheRegistry(imageUrl, cacheKey) {
    try {
      const existingCache = await AsyncStorage.getItem(this.webpCacheKey);
      const cacheData = existingCache ? JSON.parse(existingCache) : {};
      
      // Ajoute la nouvelle entrée avec timestamp
      cacheData[imageUrl] = {
        cacheKey,
        timestamp: Date.now()
      };

      // Nettoie les anciennes entrées si le cache est trop grand
      const entries = Object.entries(cacheData);
      if (entries.length > this.maxCacheSize) {
        // Trie par timestamp et garde les plus récents
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        const toKeep = entries.slice(0, this.maxCacheSize);
        
        // Supprime les fichiers les plus anciens
        for (let i = this.maxCacheSize; i < entries.length; i++) {
          const [oldUrl, oldData] = entries[i];
          const oldPath = `${this.cacheDirectory}${oldData.cacheKey}`;
          try {
            await FileSystem.deleteAsync(oldPath);
          } catch (error) {
            console.warn('⚠️ Impossible de supprimer l\'ancien fichier cache:', error);
          }
        }

        // Recrée le cache avec uniquement les entrées à garder
        const newCacheData = {};
        toKeep.forEach(([url, data]) => {
          newCacheData[url] = data;
        });
        await AsyncStorage.setItem(this.webpCacheKey, JSON.stringify(newCacheData));
      } else {
        await AsyncStorage.setItem(this.webpCacheKey, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour registre cache:', error);
    }
  }

  /**
   * Nettoie le cache des images
   */
  async clearCache() {
    try {
      const cacheData = await AsyncStorage.getItem(this.webpCacheKey);
      if (cacheData) {
        const parsedCache = JSON.parse(cacheData);
        
        // Supprime tous les fichiers cache
        for (const [url, data] of Object.entries(parsedCache)) {
          const filePath = `${this.cacheDirectory}${data.cacheKey}`;
          try {
            await FileSystem.deleteAsync(filePath);
          } catch (error) {
            console.warn('⚠️ Impossible de supprimer le fichier cache:', filePath);
          }
        }
      }

      // Vide le registre
      await AsyncStorage.removeItem(this.webpCacheKey);
      console.log('🧹 Cache nettoyé');
    } catch (error) {
      console.error('❌ Erreur nettoyage cache:', error);
    }
  }

  /**
   * Fonction principale pour obtenir une image optimisée WebP
   */
  async getOptimizedImage(imageUrl, options = {}) {
    const {
      quality = 0.8,
      maxWidth = 800,
      forceRefresh = false
    } = options;

    try {
      if (!imageUrl || !imageUrl.startsWith('http')) {
        console.log('⚠️ URL invalide, retour de l\'URL originale');
        return imageUrl;
      }

      // Vérifie le cache sauf si rafraîchissement forcé
      if (!forceRefresh) {
        const cachedPath = await this.getCachedImagePath(imageUrl);
        if (cachedPath) {
          return cachedPath;
        }
      }

      // Télécharge l'image originale
      const tempPath = await this.downloadImage(imageUrl);
      
      try {
        // Convertit en WebP
        const webpPath = await this.convertToWebP(tempPath, quality, maxWidth);
        
        // Sauvegarde dans le cache
        const finalPath = await this.saveToCache(imageUrl, webpPath);
        
        // Nettoie le fichier temporaire
        try {
          await FileSystem.deleteAsync(tempPath);
        } catch (error) {
          console.warn('⚠️ Impossible de supprimer le fichier temporaire:', error);
        }

        return finalPath;
      } catch (conversionError) {
        // En cas d'erreur de conversion, nettoie et retourne l'URL originale
        try {
          await FileSystem.deleteAsync(tempPath);
        } catch (error) {
          console.warn('⚠️ Impossible de supprimer le fichier temporaire:', error);
        }
        throw conversionError;
      }
    } catch (error) {
      console.error('❌ Erreur complète de conversion:', error);
      // En cas d'erreur complète, retourne l'URL originale
      return imageUrl;
    }
  }

  /**
   * Récupère des statistiques sur le cache
   */
  async getCacheStats() {
    try {
      const cacheData = await AsyncStorage.getItem(this.webpCacheKey);
      if (!cacheData) return { count: 0, size: 0 };

      const parsedCache = JSON.parse(cacheData);
      const entries = Object.entries(parsedCache);
      
      let totalSize = 0;
      for (const [url, data] of entries) {
        try {
          const filePath = `${this.cacheDirectory}${data.cacheKey}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists) {
            totalSize += fileInfo.size;
          }
        } catch (error) {
          console.warn('⚠️ Erreur lecture fichier cache:', error);
        }
      }

      return {
        count: entries.length,
        size: totalSize,
        sizeFormatted: this.formatBytes(totalSize)
      };
    } catch (error) {
      console.error('❌ Erreur statistiques cache:', error);
      return { count: 0, size: 0, sizeFormatted: '0 B' };
    }
  }

  /**
   * Formate les octets en format lisible
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Exporte une instance singleton
export const imageConverter = new ImageConverter();
export default imageConverter;
