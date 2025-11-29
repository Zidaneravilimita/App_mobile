// src/utils/imageUtils.js
import { imageConverter } from '../services/imageConverter';

/**
 * Utilitaires pour la gestion des images optimisées
 */

/**
 * Fonction utilitaire pour précharger plusieurs images
 */
export async function preloadImages(imageUrls, options = {}) {
  const { quality = 0.8, maxWidth = 800, concurrency = 3 } = options;
  
  console.log(`🚀 Préchargement de ${imageUrls.length} images...`);
  
  // Divise les URLs en lots pour éviter de surcharger le système
  const batches = [];
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    batches.push(imageUrls.slice(i, i + concurrency));
  }

  const results = [];
  
  for (const batch of batches) {
    const batchPromises = batch.map(async (url) => {
      try {
        const optimizedUri = await imageConverter.getOptimizedImage(url, {
          quality,
          maxWidth
        });
        return { url, optimizedUri, success: true };
      } catch (error) {
        console.error(`❌ Erreur préchargement ${url}:`, error);
        return { url, error, success: false };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Pause entre les batches pour éviter la surcharge
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Préchargement terminé: ${successCount}/${imageUrls.length} images optimisées`);
  
  return results;
}

/**
 * Fonction pour nettoyer les anciennes images du cache
 */
export async function cleanupOldImages(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 jours par défaut
  try {
    console.log('🧹 Nettoyage des anciennes images...');
    const stats = await imageConverter.getCacheStats();
    console.log('📊 Statistiques avant nettoyage:', stats);
    
    // Le service gère déjà le nettoyage automatique, mais on peut forcer un nettoyage plus agressif
    await imageConverter.clearCache();
    
    const newStats = await imageConverter.getCacheStats();
    console.log('📊 Statistiques après nettoyage:', newStats);
    
    return newStats;
  } catch (error) {
    console.error('❌ Erreur nettoyage cache:', error);
    throw error;
  }
}

/**
 * Fonction pour obtenir des informations sur une image optimisée
 */
export async function getImageInfo(imageUrl) {
  try {
    const optimizedUri = await imageConverter.getOptimizedImage(imageUrl);
    
    if (optimizedUri && optimizedUri.startsWith('file://')) {
      const fileInfo = await FileSystem.getInfoAsync(optimizedUri);
      return {
        originalUrl: imageUrl,
        optimizedUri,
        size: fileInfo.size,
        isOptimized: true
      };
    }
    
    return {
      originalUrl: imageUrl,
      optimizedUri: imageUrl,
      size: 0,
      isOptimized: false
    };
  } catch (error) {
    console.error('❌ Erreur obtention infos image:', error);
    return {
      originalUrl: imageUrl,
      optimizedUri: imageUrl,
      size: 0,
      isOptimized: false,
      error
    };
  }
}

/**
 * Fonction pour comparer la taille des images avant/après optimisation
 */
export async function compareImageSizes(imageUrl) {
  try {
    // Pour une vraie comparaison, il faudrait télécharger l'image originale
    // et la comparer avec la version optimisée. Ici on simule.
    
    const optimizedInfo = await getImageInfo(imageUrl);
    
    // Simulation : estimation de la réduction de taille (typiquement 60-80% pour WebP)
    const estimatedOriginalSize = optimizedInfo.size * 3.5; // Estimation
    const reduction = estimatedOriginalSize > 0 
      ? ((estimatedOriginalSize - optimizedInfo.size) / estimatedOriginalSize * 100).toFixed(1)
      : 0;

    return {
      original: {
        url: imageUrl,
        estimatedSize: estimatedOriginalSize,
        sizeFormatted: formatBytes(estimatedOriginalSize)
      },
      optimized: {
        url: optimizedInfo.optimizedUri,
        size: optimizedInfo.size,
        sizeFormatted: formatBytes(optimizedInfo.size)
      },
      reduction: `${reduction}%`
    };
  } catch (error) {
    console.error('❌ Erreur comparaison tailles:', error);
    return null;
  }
}

/**
 * Formate les octets en format lisible
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Fonction pour valider une URL d'image
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Fonction pour extraire l'extension d'un fichier image
 */
export function getImageExtension(url) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase();
    
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    return validExtensions.includes(extension) ? extension : null;
  } catch {
    return null;
  }
}

/**
 * Fonction pour générer un placeholder d'image
 */
export function generatePlaceholder(width = 400, height = 300, text = 'Image') {
  // Génère un data URI SVG simple comme placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#333"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#888" font-family="Arial" font-size="16">
        ${text}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default {
  preloadImages,
  cleanupOldImages,
  getImageInfo,
  compareImageSizes,
  formatBytes,
  isValidImageUrl,
  getImageExtension,
  generatePlaceholder
};
