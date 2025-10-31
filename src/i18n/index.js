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
    // Navbar & sections
    home: 'Accueil',
    search: 'Recherche',
    chat: 'Chat',
    profile: 'Profil',
    categories: 'Catégories',
    available_events: 'Événements disponibles',
    // Tickets & messaging
    sendMessage: 'Envoyer un message',
    buyTicket: 'Acheter un billet',
    ticket: 'Billet',
    // Interested screen
    addedToFavorites: 'Ajouté aux favoris',
    interested_hint: "Nous avons enregistré votre intérêt pour cet événement.",
    messageOrganizer: "Contacter l'organisateur",
    viewFavorites: 'Voir favoris',
    // Ticket form
    fullName: 'Nom complet',
    email: 'Email',
    quantity: 'Quantité',
    note: 'Note',
    // New purchase fields
    firstName: 'Prénom',
    address: 'Adresse',
    phoneTransfer: 'N° de telephone du déposant',
    wallet: 'Portefeuille',
    orangeMoney: 'Orange Money',
    mvola: 'Mvola',
    airtelMoney: 'Airtel Money',
    amount: "Montant d'achat",
    fillRequired: 'Veuillez renseigner les champs requis.',
    purchase_success: 'Demande de billet envoyée',
    purchase_info: "L'organisateur vous enverra le code QR après validation de l'achat.",
    ticket_request_msg: 'Bonjour, je souhaite acheter un billet.',
    // Messages list actions
    markUnread: 'marquer comme non lu',
    deleteConversation: 'Supprimer la Conversation',
  },
  en: {
    settings: 'Settings',
    appearance: 'Appearance',
    darkTheme: 'Dark Theme',
    notifications: 'Notifications',
    enableNotifications: 'Enable Notifications',
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
    loadingEvent: 'Loading Event...',
    description: 'Description',
    interested: 'Interested',
    participate: 'Participate',
    sendMessage: 'Send Message',
    unknownTitle: 'Title Not Available',
    unknownPlace: 'Unknown Place',
    unknownType: 'Unknown Type',
    errorNoEventId: 'No Event Identifier Provided.',
    // Favorites
    myFavorites: 'My Favorites',
    emptyFavorites: 'No Favorites Yet',
    emptyFavoritesHint: 'Tap "Interested" On An Event Card',
    // My Events
    myEvents: 'My Events',
    noCreatedEvents: 'No Events Created',
    // Attended
    attended: 'Attended',
    attendedPlaceholder: 'List Of Events You Attended (To Implement)',
    // Help
    helpSupport: 'Help & Support',
    faqComing: 'FAQ Coming Soon. For Help, Contact Us:',
    contactSupport: 'Contact Support',
    // Privacy
    privacy: 'Privacy',
    policyComing: 'Privacy Policy And Terms Coming Soon.',
    deleteAccount: 'Delete My Account',
    deleteConfirmTitle: 'Delete My Account',
    deleteConfirmMsg: 'For Security Reasons, Full Deletion Requires Confirmation. Send A Request?',
    // Profile
    profileTitle: 'My Profile',
    loadingProfile: 'Loading Your Profile...',
    noUserTitle: 'No User Signed In',
    noUserSubtitle: 'Sign In To Access Your Profile',
    login: 'Sign In',
    edit: 'Edit',
    save: 'Save',
    options: 'Options',
    eventsCreated: 'Events Created',
    participations: 'Attendance',
    followers: 'Followers',
    connected: 'Online',
    offline: 'Offline Mode',
    checking: 'Checking...',
    // Menu items
    menu_events: 'My Events',
    menu_favorites: 'Favorites',
    menu_settings: 'Settings',
    menu_notifications: 'Notifications',
    menu_help: 'Help & Support',
    menu_privacy: 'Privacy',
    // Edit Event
    editEvent: 'Edit Event',
    saveChanges: 'Save Changes',
    field_title: 'Title',
    field_description: 'Description',
    field_date: 'Event Date',
    field_image: 'Image URL',
    field_place: 'Place',
    field_category: 'Category',
    updateSuccess: 'Event Updated',
    updateFail: 'Update Failed',

    // Home/Lists
    categories: 'Categories',
    available_events: 'Available Events',

    // Tickets & messaging
    ticket: 'Ticket',
    buyTicket: 'Buy Ticket',
    sendMessage: 'Send Message',

    // Navbar
    home: 'Home',
    search: 'Search',
    chat: 'Chat',
    profile: 'Profile',

    // Interested screen
    addedToFavorites: 'Added To Favorites',
    interested_hint: 'We have recorded your interest for this event.',
    messageOrganizer: 'Message Organizer',
    viewFavorites: 'View Favorites',
    // Ticket form
    fullName: 'Full Name',
    email: 'Email',
    quantity: 'Quantity',
    note: 'Note',
    // New purchase fields
    firstName: 'First Name',
    address: 'Address',
    phoneTransfer: 'Transfer Phone Number',
    wallet: 'Wallet',
    orangeMoney: 'Orange Money',
    mvola: 'Mvola',
    airtelMoney: 'Airtel Money',
    amount: 'Purchase Amount',
    fillRequired: 'Please fill the required fields.',
    purchase_success: 'Ticket Request Sent',
    purchase_info: 'The organizer will send you the QR code after purchase validation.',
    ticket_request_msg: 'Hello, I would like to buy a ticket.',
    // Messages list actions
    markUnread: 'mark unread',
    deleteConversation: 'Delete Conversation',
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
