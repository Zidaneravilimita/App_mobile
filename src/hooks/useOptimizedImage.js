// src/hooks/useOptimizedImage.js
import { useState, useEffect, useCallback } from 'react';
import { imageConverter } from '../services/imageConverter';

/**
 * Hook personnalisé pour gérer les images optimisées WebP
 * @param {string} imageUrl - URL de l'image originale
 * @param {Object} options - Options de conversion
 * @returns {Object} - État et méthodes pour l'image optimisée
 */
export function useOptimizedImage(imageUrl, options = {}) {
  const [optimizedUri, setOptimizedUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(imageUrl);

  // Options par défaut
  const {
    quality = 0.8,
    maxWidth = 800,
    autoConvert = true,
    fallbackToOriginal = true,
    retryOnError = true,
    maxRetries = 2
  } = options;

  const [retryCount, setRetryCount] = useState(0);

  // Fonction pour convertir l'image
  const convertImage = useCallback(async (url, retryAttempt = 0) => {
    if (!url || !url.startsWith('http')) {
      setOptimizedUri(url);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔄 Conversion image (tentative ${retryAttempt + 1}):`, url);
      
      const optimized = await imageConverter.getOptimizedImage(url, {
        quality,
        maxWidth,
        forceRefresh: retryAttempt > 0
      });

      setOptimizedUri(optimized);
      console.log('✅ Image optimisée avec succès');
    } catch (conversionError) {
      console.error('❌ Erreur conversion image:', conversionError);
      
      if (retryOnError && retryAttempt < maxRetries) {
        console.log(`🔄 Nouvelle tentative dans 1s... (${retryAttempt + 1}/${maxRetries})`);
        setTimeout(() => {
          convertImage(url, retryAttempt + 1);
        }, 1000);
        return;
      }

      setError(conversionError);
      
      // Fallback vers l'image originale si activé
      if (fallbackToOriginal) {
        console.log('⚠️ Fallback vers l\'image originale');
        setOptimizedUri(url);
      }
    } finally {
      setIsLoading(false);
      setRetryCount(retryAttempt);
    }
  }, [quality, maxWidth, fallbackToOriginal, retryOnError, maxRetries]);

  // Efface l'image optimisée actuelle
  const clearOptimized = useCallback(() => {
    setOptimizedUri(null);
    setError(null);
    setRetryCount(0);
  }, []);

  // Force la reconversion
  const refresh = useCallback(() => {
    clearOptimized();
    if (originalUrl && autoConvert) {
      convertImage(originalUrl, 0);
    }
  }, [originalUrl, autoConvert, convertImage, clearOptimized]);

  // Change l'URL de l'image et reconvertit
  const changeImage = useCallback((newUrl) => {
    setOriginalUrl(newUrl);
    clearOptimized();
    if (newUrl && autoConvert) {
      convertImage(newUrl, 0);
    }
  }, [autoConvert, convertImage, clearOptimized]);

  // Effet principal pour la conversion automatique
  useEffect(() => {
    if (autoConvert && originalUrl) {
      clearOptimized();
      convertImage(originalUrl, 0);
    } else if (!autoConvert) {
      setOptimizedUri(originalUrl);
      setIsLoading(false);
    }

    // Nettoyage si l'URL change
    return () => {
      if (originalUrl !== imageUrl) {
        clearOptimized();
      }
    };
  }, [imageUrl, autoConvert]); // Dépend de l'URL externe

  // Met à jour l'URL originale si elle change de l'extérieur
  useEffect(() => {
    if (imageUrl !== originalUrl) {
      changeImage(imageUrl);
    }
  }, [imageUrl, originalUrl, changeImage]);

  return {
    // État
    uri: optimizedUri,
    isLoading,
    error,
    retryCount,
    
    // Propriétés utiles
    isOptimized: optimizedUri && optimizedUri !== originalUrl,
    hasError: !!error,
    canRetry: retryOnError && retryCount < maxRetries,
    
    // Méthodes
    refresh,
    retry: () => convertImage(originalUrl, retryCount + 1),
    clear: clearOptimized,
    changeImage,
    
    // Informations de débogage
    debug: {
      originalUrl,
      optimizedUri,
      options: { quality, maxWidth, autoConvert, fallbackToOriginal }
    }
  };
}

/**
 * Hook simplifié pour les cas d'usage basiques
 */
export function useSimpleOptimizedImage(imageUrl, quality = 0.8) {
  const { uri, isLoading, error } = useOptimizedImage(imageUrl, {
    quality,
    autoConvert: true,
    fallbackToOriginal: true,
    retryOnError: true,
    maxRetries: 1
  });

  return {
    source: uri ? { uri } : null,
    isLoading,
    error
  };
}

export default useOptimizedImage;
