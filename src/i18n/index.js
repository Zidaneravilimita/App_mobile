// src/i18n/index.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANG_KEY = 'pref_lang'; // 'fr' | 'en'

const messages = {
  fr: {
    settings: 'Paramètres',
    appearance: 'Apparence',
    darkTheme: 'Thème sombre',
    notifications: 'Notifications',
    enableNotifications: 'Activer les notifications',
    language: 'Langue',
    french: 'Français',
    english: 'Anglais',
    saving: 'Sauvegarde...',
    // Common
    back: 'Retour',
    loading: 'Chargement...',
    retry: 'Réessayer',
    cancel: 'Annuler',
    send: 'Envoyer',
    sent: 'Envoyé',
    requestReceived: 'Votre demande a été prise en compte.',
    // EventDetails
    loadingEvent: "Chargement de l'événement...",
    description: 'Description',
    interested: 'Intéressée',
    participate: 'Participer',
    unknownTitle: 'Titre non disponible',
    unknownPlace: 'Lieu non défini',
    unknownType: 'Type inconnu',
    errorNoEventId: "Aucun identifiant d'événement fourni.",
    // Favorites
    myFavorites: 'Mes Favoris',
    emptyFavorites: 'Aucun favori pour le moment',
    emptyFavoritesHint: 'Cliquez sur "Intéressée" dans une fiche événement',
    // My Events
    myEvents: 'Mes Événements',
    noCreatedEvents: 'Aucun événement créé',
    // Attended
    attended: 'Participations',
    attendedPlaceholder: 'Liste des événements auxquels vous avez participé (à implémenter)',
    // Help
    helpSupport: 'Aide & Support',
    faqComing: 'FAQ à venir. Pour toute aide, contactez-nous :',
    contactSupport: 'Contacter le support',
    // Privacy
    privacy: 'Confidentialité',
    policyComing: "Politique de confidentialité et conditions d'utilisation à venir.",
    deleteAccount: 'Supprimer mon compte',
    deleteConfirmTitle: 'Supprimer mon compte',
    deleteConfirmMsg: 'Pour des raisons de sécurité, la suppression totale nécessite une confirmation. Voulez-vous envoyer une demande ?',
    // Profile
    profileTitle: 'Mon Profil',
    loadingProfile: 'Chargement de votre profil...',
    noUserTitle: 'Aucun utilisateur connecté',
    noUserSubtitle: 'Connectez-vous pour accéder à votre profil',
    login: 'Se connecter',
    edit: 'Modifier',
    save: 'Sauvegarder',
    options: 'Options',
    eventsCreated: 'Événements créés',
    participations: 'Participations',
    followers: 'Abonnés',
    connected: 'Connecté',
    offline: 'Mode hors ligne',
    checking: 'Vérification...',
    // Menu items
    menu_events: 'Mes Événements',
    menu_favorites: 'Favoris',
    menu_settings: 'Paramètres',
    menu_notifications: 'Notifications',
    menu_help: 'Aide & Support',
    menu_privacy: 'Confidentialité',
    // Edit Event
    editEvent: "Modifier l'événement",
    saveChanges: 'Enregistrer',
    field_title: 'Titre',
    field_description: 'Description',
    field_date: "Date de l'événement",
    field_image: "URL de l'image",
    field_place: 'Lieu',
    field_category: 'Catégorie',
    updateSuccess: 'Événement mis à jour',
    updateFail: "Mise à jour échouée",
  },
  en: {
    settings: 'Settings',
    appearance: 'Appearance',
    darkTheme: 'Dark theme',
    notifications: 'Notifications',
    enableNotifications: 'Enable notifications',
    language: 'Language',
    french: 'French',
    english: 'English',
    saving: 'Saving...',
    // Common
    back: 'Back',
    loading: 'Loading...',
    retry: 'Retry',
    cancel: 'Cancel',
    send: 'Send',
    sent: 'Sent',
    requestReceived: 'Your request has been received.',
    // EventDetails
    loadingEvent: 'Loading event...',
    description: 'Description',
    interested: 'Interested',
    participate: 'Participate',
    unknownTitle: 'Title not available',
    unknownPlace: 'Unknown place',
    unknownType: 'Unknown type',
    errorNoEventId: 'No event identifier provided.',
    // Favorites
    myFavorites: 'My Favorites',
    emptyFavorites: 'No favorites yet',
    emptyFavoritesHint: 'Tap "Interested" on an event card',
    // My Events
    myEvents: 'My Events',
    noCreatedEvents: 'No events created',
    // Attended
    attended: 'Attended',
    attendedPlaceholder: 'List of events you attended (to implement)',
    // Help
    helpSupport: 'Help & Support',
    faqComing: 'FAQ coming soon. For help, contact us:',
    contactSupport: 'Contact support',
    // Privacy
    privacy: 'Privacy',
    policyComing: 'Privacy policy and terms coming soon.',
    deleteAccount: 'Delete my account',
    deleteConfirmTitle: 'Delete my account',
    deleteConfirmMsg: 'For security reasons, full deletion requires confirmation. Send a request?',
    // Profile
    profileTitle: 'My Profile',
    loadingProfile: 'Loading your profile...',
    noUserTitle: 'No user signed in',
    noUserSubtitle: 'Sign in to access your profile',
    login: 'Sign in',
    edit: 'Edit',
    save: 'Save',
    options: 'Options',
    eventsCreated: 'Events created',
    participations: 'Attendance',
    followers: 'Followers',
    connected: 'Online',
    offline: 'Offline mode',
    checking: 'Checking...',
    // Menu items
    menu_events: 'My Events',
    menu_favorites: 'Favorites',
    menu_settings: 'Settings',
    menu_notifications: 'Notifications',
    menu_help: 'Help & Support',
    menu_privacy: 'Privacy',
    // Edit Event
    editEvent: 'Edit event',
    saveChanges: 'Save changes',
    field_title: 'Title',
    field_description: 'Description',
    field_date: 'Event date',
    field_image: 'Image URL',
    field_place: 'Place',
    field_category: 'Category',
    updateSuccess: 'Event updated',
    updateFail: 'Update failed',
  },
};

const I18nContext = createContext({
  lang: 'fr',
  t: (k) => k,
  setLanguage: (_l) => {},
});

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved === 'fr' || saved === 'en') setLang(saved);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setLanguage = async (l) => {
    if (l !== 'fr' && l !== 'en') return;
    setLang(l);
    try { await AsyncStorage.setItem(LANG_KEY, l); } catch {}
  };

  const t = useMemo(() => {
    const dict = messages[lang] || messages.fr;
    return (key) => dict[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, t, setLanguage }), [lang, t]);

  if (!ready) return null; // avoid flash before lang loads

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
