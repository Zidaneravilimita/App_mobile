# Système d'Optimisation d'Images WebP

Ce projet intègre un système complet de conversion d'images en format WebP pour améliorer les performances de chargement et réduire la consommation de données.

## 🚀 Fonctionnalités

### Conversion Automatique
- Conversion des images de Supabase en WebP avec une réduction de taille de 60-80%
- Redimensionnement automatique (max 800px par défaut)
- Qualité ajustable (0.8 par défaut)

### Cache Intelligent
- Cache local des images converties pour éviter les conversions répétées
- Gestion automatique de la taille du cache (50 images max)
- Nettoyage automatique des anciennes images

### Gestion d'Erreurs
- Retry automatique en cas d'échec
- Fallback vers l'image originale si la conversion échoue
- Interface utilisateur pour retry manuel

## 📁 Structure des Fichiers

```
src/
├── services/
│   └── imageConverter.js     # Service principal de conversion
├── hooks/
│   └── useOptimizedImage.js  # Hook React pour l'intégration
├── utils/
│   └── imageUtils.js         # Utilitaires et fonctions avancées
└── components/
    └── EventCard.js          # Exemple d'intégration
```

## 🛠️ Installation

Les dépendances nécessaires sont déjà incluses dans `package.json`:

```json
{
  "expo-image-manipulator": "~12.0.5",
  "expo-file-system": "~17.0.1",
  "@react-native-async-storage/async-storage": "1.23.1"
}
```

## 📖 Utilisation

### 1. Hook Simple (Recommandé)

```javascript
import { useOptimizedImage } from '../hooks/useOptimizedImage';

function MonComponent({ imageUrl }) {
  const { uri, isLoading, error, refresh } = useOptimizedImage(imageUrl, {
    quality: 0.8,
    maxWidth: 800,
    autoConvert: true,
    fallbackToOriginal: true
  });

  return (
    <Image
      source={{ uri }}
      style={{ width: 200, height: 200 }}
      onError={() => refresh()}
    />
  );
}
```

### 2. Hook Simplifié

```javascript
import { useSimpleOptimizedImage } from '../hooks/useOptimizedImage';

function MonComponent({ imageUrl }) {
  const { source, isLoading, error } = useSimpleOptimizedImage(imageUrl, 0.8);
  
  return (
    <Image
      source={source}
      style={{ width: 200, height: 200 }}
    />
  );
}
```

### 3. Service Direct

```javascript
import { imageConverter } from '../services/imageConverter';

async function convertImage(imageUrl) {
  try {
    const optimizedUri = await imageConverter.getOptimizedImage(imageUrl, {
      quality: 0.8,
      maxWidth: 800
    });
    return optimizedUri;
  } catch (error) {
    console.error('Erreur conversion:', error);
    return imageUrl; // Fallback
  }
}
```

## ⚙️ Configuration

### Options du Hook

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `quality` | number | 0.8 | Qualité de compression (0-1) |
| `maxWidth` | number | 800 | Largeur maximale de l'image |
| `autoConvert` | boolean | true | Conversion automatique |
| `fallbackToOriginal` | boolean | true | Utiliser l'originale si échec |
| `retryOnError` | boolean | true | Retry automatique |
| `maxRetries` | number | 2 | Nombre maximum de tentatives |

### Options du Service

```javascript
await imageConverter.getOptimizedImage(imageUrl, {
  quality: 0.8,        // Qualité WebP
  maxWidth: 800,        // Redimensionnement
  forceRefresh: false   // Forcer la reconversion
});
```

## 🔧 Fonctions Utilitaires

### Préchargement Multiple

```javascript
import { preloadImages } from '../utils/imageUtils';

const results = await preloadImages([
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg'
], { concurrency: 3 });
```

### Nettoyage Cache

```javascript
import { cleanupOldImages } from '../utils/imageUtils';

await cleanupOldImages(); // Nettoie les images de +7 jours
```

### Statistiques Cache

```javascript
import { imageConverter } from '../services/imageConverter';

const stats = await imageConverter.getCacheStats();
console.log(`Cache: ${stats.count} images, ${stats.sizeFormatted}`);
```

## 📊 Performance

### Avantages
- **Réduction de taille**: 60-80% par rapport aux formats originaux
- **Chargement plus rapide**: Format WebP optimisé pour le web
- **Cache local**: Évite les téléchargements répétés
- **Compression adaptative**: Qualité préservée avec taille réduite

### Benchmark Typique
```
Image originale: 2.5 MB (JPEG)
Image optimisée: 0.6 MB (WebP)
Réduction: 76%
```

## 🐛 Débogage

### Logs Actifs
Le système log automatiquement:
- ✅ Succès de conversion
- ❌ Erreurs de conversion
- 📥 Téléchargements
- 💾 Sauvegardes cache
- 🧹 Nettoyages

### Mode Débogage

```javascript
const { debug } = useOptimizedImage(imageUrl);
console.log('Debug:', debug);
```

## 🔒 Sécurité

- Validation des URLs avant traitement
- Gestion des erreurs de fichier
- Nettoyage automatique des fichiers temporaires
- Pas d'exposition de données sensibles

## 📱 Compatibilité

- **iOS**: ✅ Support natif WebP
- **Android**: ✅ Support natif WebP  
- **Web**: ✅ Support navigateurs modernes
- **Expo Go**: ✅ Testé et fonctionnel

## 🔄 Mises à Jour

Pour mettre à jour le système:
1. Vérifier les nouvelles versions d'Expo
2. Tester les nouvelles fonctionnalités d'ImageManipulator
3. Adapter les options de qualité selon les besoins

## 📝 Notes

- Le cache est stocké dans `FileSystem.cacheDirectory`
- Les images sont automatiquement nettoyées après 50 entrées
- Le fallback garantit que l'application reste fonctionnelle
- La conversion est asynchrone et non-bloquante

## 🆘 Support

En cas de problème:
1. Vérifier les logs dans la console
2. Tester avec différentes URLs
3. Vérifier l'espace de stockage disponible
4. Consulter les statistiques du cache
