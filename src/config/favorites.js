// src/config/favorites.js
// Simple favorites manager using AsyncStorage, per-user
import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (userId) => `favorites_${userId}`;

export const getFavorites = async (userId) => {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setFavorites = async (userId, list) => {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(list || []));
  } catch {}
};

export const isFavorite = async (userId, id_event) => {
  if (!userId || !id_event) return false;
  const list = await getFavorites(userId);
  return list.some((e) => e?.id_event === id_event);
};

export const addFavorite = async (userId, event) => {
  if (!userId || !event?.id_event) return [];
  const list = await getFavorites(userId);
  if (!list.some((e) => e.id_event === event.id_event)) {
    const minimal = {
      id_event: event.id_event,
      titre: event.titre || 'Sans titre',
      image_url: event.image_url || null,
      date_event: event.date_event || null,
      villeName: event.villeName || event.lieu_detail || null,
      categoryName: event.category?.nom_category || event.nom_category || event.categoryName || null,
    };
    const updated = [minimal, ...list];
    await setFavorites(userId, updated);
    return updated;
  }
  return list;
};

export const removeFavorite = async (userId, id_event) => {
  if (!userId || !id_event) return [];
  const list = await getFavorites(userId);
  const updated = list.filter((e) => e.id_event !== id_event);
  await setFavorites(userId, updated);
  return updated;
};

export const toggleFavorite = async (userId, event) => {
  if (!userId || !event?.id_event) return { list: [], active: false };
  const active = await isFavorite(userId, event.id_event);
  if (active) {
    const list = await removeFavorite(userId, event.id_event);
    return { list, active: false };
  } else {
    const list = await addFavorite(userId, event);
    return { list, active: true };
  }
};
