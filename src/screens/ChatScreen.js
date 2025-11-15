// src/screens/ChatScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { useTheme } from '../theme';
import { useI18n } from '../i18n';
import { ms } from '../theme/responsive';

export default function ChatScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const conversationId = route?.params?.conversationId || route?.params?.chatId || null;
  const initialTitle = route?.params?.title || t('chat') || 'Chat';
  const avatarUrl = route?.params?.avatar_url || null;
  const otherUserId = route?.params?.other_user_id || null;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const currentUserRef = useRef(null);
  const listRef = useRef(null);
  const [headerTitle, setHeaderTitle] = useState(initialTitle);
  const [headerAvatar, setHeaderAvatar] = useState(avatarUrl);
  const [otherUserInfo, setOtherUserInfo] = useState(null); // Stocker les infos complètes de l'autre utilisateur
  const loadingUserInfoRef = useRef(false); // Pour éviter les appels multiples

  const STORAGE_KEYS = {
    unread: 'ml_unread_conversations',
  };

  const clearUnread = async (convId) => {
    if (!convId) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.unread);
      const arr = raw ? JSON.parse(raw) : [];
      const setObj = new Set(Array.isArray(arr) ? arr : []);
      setObj.delete(convId);
      await AsyncStorage.setItem(STORAGE_KEYS.unread, JSON.stringify(Array.from(setObj)));
    } catch {}
  };

  // Back button in header
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingHorizontal: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.text]);

  // Fonction pour charger les informations de l'autre utilisateur
  const loadOtherUserInfo = async (userId) => {
    if (!userId) {
      console.warn('Aucun ID utilisateur fourni à loadOtherUserInfo');
      return null;
    }

    // Si on a déjà les infos complètes pour cet utilisateur, les retourner
    // Mais seulement si le nom n'est pas le titre par défaut
    if (otherUserInfo?.id === userId && otherUserInfo?.name && otherUserInfo.name !== initialTitle && otherUserInfo.name !== 'Chat' && !otherUserInfo.name.startsWith('User_')) {
      console.log('✅ Informations déjà chargées pour cet utilisateur:', otherUserInfo.name);
      return otherUserInfo;
    }

    // Si un chargement est en cours pour le MÊME utilisateur, attendre et retourner les infos existantes
    if (loadingUserInfoRef.current && otherUserInfo?.id === userId) {
      console.log('⏳ Chargement déjà en cours pour cet utilisateur, attente...');
      // Attendre un peu avant de retourner
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Retourner les infos existantes si disponibles
      if (otherUserInfo?.id === userId) {
        console.log('✅ Retour des infos après attente:', otherUserInfo.name);
        return otherUserInfo;
      }
    }

    // Si un chargement est en cours pour un utilisateur différent, attendre un peu
    if (loadingUserInfoRef.current && otherUserInfo?.id !== userId) {
      console.log('⏳ Chargement en cours pour un autre utilisateur, attente...');
      // Attendre un peu avant de continuer
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    loadingUserInfoRef.current = true;
    console.log('🔄 Chargement des informations pour l\'utilisateur:', userId);
      
    try {
      // 1. Récupérer le profil de l'utilisateur avec maybeSingle pour éviter les erreurs
      // Utiliser uniquement les colonnes qui existent dans la table profiles
      // IMPORTANT: La table profiles contient: id, username, email, avatar_url, full_name, bio, role, id_ville, created_at, updated_at
      console.log('🔍 Tentative de récupération du profil pour userId:', userId);
      
      // Essayer d'abord avec une requête simple
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, full_name, bio, role, id_ville, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();
      
      // Si pas de résultat et pas d'erreur, c'est probablement RLS
      // Essayer avec une requête plus explicite
      if (!profile && !profileError) {
        console.log('⚠️ Aucun résultat, tentative avec une requête alternative...');
        const { data: profileAlt, error: errorAlt } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (profileAlt && !errorAlt) {
          profile = profileAlt;
          console.log('✅ Profil trouvé avec requête alternative');
        } else if (errorAlt) {
          profileError = errorAlt;
          console.error('❌ Erreur avec requête alternative:', errorAlt);
        }
      }
      
      // Log détaillé pour déboguer
      if (profileError) {
        console.error('❌ Erreur lors de la récupération du profil:', profileError);
        console.error('Code erreur:', profileError.code);
        console.error('Message:', profileError.message);
        console.error('Détails:', profileError.details);
        console.error('Hint:', profileError.hint);
      } else if (profile) {
        console.log('✅ Profil trouvé:', {
          id: profile.id,
          username: profile.username,
          hasAvatar: !!profile.avatar_url,
          avatar_url: profile.avatar_url,
          email: profile.email,
          full_name: profile.full_name
        });
      } else {
        console.warn('⚠️ Aucun profil retourné (pas d\'erreur, mais profil null)');
        console.warn('⚠️ Cela peut être dû à:');
        console.warn('   1. L\'utilisateur n\'a pas de profil dans la table profiles');
        console.warn('   2. Les politiques RLS (Row Level Security) empêchent la lecture');
        console.warn('   3. L\'utilisateur n\'existe pas');
      }
      
      // Clear unread for this conversation after loading
      if (conversationId) {
        await clearUnread(conversationId);
      }

      if (profileError) {
        console.error('❌ Erreur lors de la récupération du profil:', profileError);
        console.error('Détails de l\'erreur:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        // Continuer pour essayer les fallbacks même en cas d'erreur
      } else if (profile) {
        console.log('✅ Profil trouvé dans profiles:', {
          id: profile.id,
          username: profile.username,
          hasAvatar: !!profile.avatar_url,
          email: profile.email
        });
      } else {
        console.warn('⚠️ Aucun profil retourné (pas d\'erreur, mais profil null)');
      }

      if (!profile || profileError) {
        console.warn('⚠️ Aucun profil trouvé dans la table profiles pour l\'utilisateur:', userId);
        
        // Vérifier si c'est un problème RLS en essayant une requête différente
        if (!profileError) {
          console.log('🔍 Aucune erreur retournée, le profil n\'existe probablement pas ou RLS bloque l\'accès');
          console.log('💡 Suggestion: Vérifiez les politiques RLS sur la table profiles');
          console.log('💡 Les utilisateurs doivent pouvoir lire les profiles des autres utilisateurs pour le chat');
          console.log('💡 Exemple de politique RLS pour permettre la lecture:');
          console.log('   CREATE POLICY "Users can read other users profiles" ON profiles FOR SELECT USING (true);');
        }
        
        console.log('🔍 Tentative de récupération depuis auth.users...');
      
        // Essayer de récupérer depuis auth.users (uniquement si c'est l'utilisateur actuel)
        // Note: La table 'users' n'existe pas dans cette base de données, seulement 'profiles'
      let email = null;
        let fallbackName = null;
        
        try {
          // Essayer depuis auth.users si c'est l'utilisateur actuel
          const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
          if (!authError && currentUser?.id === userId && currentUser?.email) {
            email = currentUser.email;
            console.log('✅ Email trouvé depuis auth.users (utilisateur actuel):', email);
          } else {
            console.log('ℹ️ L\'utilisateur n\'est pas l\'utilisateur actuel, impossible de récupérer l\'email depuis auth.users');
            console.log('ℹ️ Note: La table users n\'existe pas dans cette base de données');
          }
          
          // Si on a un email, utiliser la partie avant @ comme nom
          if (email) {
            fallbackName = email.split('@')[0];
            // Capitaliser la première lettre pour un meilleur affichage
            fallbackName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
            console.log('📝 Nom généré depuis l\'email:', fallbackName);
          }
        } catch (userError) {
          console.error('❌ Erreur lors de la récupération:', userError);
        }
        
        // Si toujours rien, utiliser un nom générique avec l'ID (mais plus court et plus convivial)
        if (!fallbackName) {
          // Utiliser un format plus convivial : "Utilisateur" + 4 premiers caractères de l'ID
          fallbackName = `Utilisateur ${userId.substring(0, 4).toUpperCase()}`;
          console.log('📝 Utilisation d\'un nom générique:', fallbackName);
        }
        
        const defaultInfo = {
          id: userId,
          name: fallbackName,
          avatar_url: null,
          username: null,
        };
        
        console.log('📝 Informations par défaut créées:', defaultInfo);
        
        // Mettre à jour les états de manière synchrone
        setOtherUserInfo(defaultInfo);
        setHeaderTitle(fallbackName);
        setHeaderAvatar(null);
        
        // Mettre à jour l'en-tête de navigation
        navigation.setOptions({
          title: fallbackName,
          headerTitleAlign: 'center',
        });
        
        loadingUserInfoRef.current = false;
        console.log('✅ États mis à jour avec le nom par défaut:', fallbackName);
        console.log('⚠️ IMPORTANT: Pour afficher le username et avatar_url, l\'utilisateur doit avoir un profil dans la table profiles');
        console.log('⚠️ Vérifiez que les politiques RLS permettent la lecture des profiles des autres utilisateurs');
        return defaultInfo;
      }

      console.log('✅ Profil récupéré avec succès:', { 
        userId, 
        hasUsername: !!profile.username,
        hasEmail: !!profile.email,
        hasFullName: !!profile.full_name
      });
      
      // 2. Déterminer le nom d'affichage - PRIORITÉ ABSOLUE au username
      let displayName = null;
      
      // Priorité 1: username (surnom) - COLONNE EXISTANTE
      if (profile.username && profile.username.trim()) {
        displayName = profile.username.trim();
        console.log('✅ Utilisation du username (surnom):', displayName);
      }
      // Priorité 2: email depuis la colonne email de profiles
      else if (profile.email && profile.email.trim()) {
        displayName = profile.email.trim();
        console.log('📧 Utilisation de l\'email depuis profiles:', displayName);
      }
      // Priorité 3: full_name - COLONNE EXISTANTE
      else if (profile.full_name && profile.full_name.trim()) {
        displayName = profile.full_name.trim();
        console.log('📝 Utilisation du full_name:', displayName);
      }
      // Fallback: titre par défaut
      else {
        displayName = initialTitle || t('chat') || 'Chat';
        console.warn('⚠️ Aucun nom trouvé dans le profil, utilisation du titre par défaut:', displayName);
      }
      
      console.log('📝 Nom d\'affichage final déterminé:', displayName);
      
      // 4. Préparer les informations de l'utilisateur avec avatar_url depuis profiles
      const avatarUrl = profile.avatar_url || null;
      const userInfo = {
        id: userId,
        name: displayName,
        avatar_url: avatarUrl, // Utiliser avatar_url depuis la colonne profiles.avatar_url
        username: profile.username || null,
      };
      
      // 5. Mettre à jour tous les états en une seule fois pour éviter le clignotement
      // FORCER la mise à jour du titre avec le username et l'avatar
      setOtherUserInfo(userInfo);
      setHeaderTitle(displayName); // Forcer la mise à jour
      setHeaderAvatar(avatarUrl); // Forcer la mise à jour de l'avatar depuis profiles.avatar_url
      
      console.log('✅ États mis à jour avec succès:', { 
        title: displayName,
        username: profile.username,
        hasUsername: !!profile.username,
        hasAvatar: !!avatarUrl,
        avatarUrl: avatarUrl, // Log de l'URL de l'avatar
        userId 
      });
      
      // 6. Mettre à jour l'en-tête de navigation
      const headerOptions = {
        title: displayName,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitle: () => (
          <TouchableOpacity 
            style={[styles.headerTitleContainer, { maxWidth: '70%' }]}
            activeOpacity={0.7}
          >
            {headerAvatar && (
              <Image 
                source={{ uri: headerAvatar }} 
                style={[styles.headerAvatar, { 
                  borderColor: colors.primary,
                  backgroundColor: colors.surface,
                  marginRight: 8,
                }]}
                resizeMode="cover"
                onError={(e) => console.warn('Erreur de chargement de l\'avatar:', e.nativeEvent.error)}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text 
                style={[
                  styles.headerTitle, 
                  { 
                    color: colors.text,
                    fontWeight: '600',
                    fontSize: 18,
                  }
                ]} 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {displayName}
              </Text>
              {profile.username && (
                <Text 
                  style={{
                    color: colors.subtext,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  @{profile.username}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ paddingHorizontal: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      };
      
      navigation.setOptions(headerOptions);
      console.log('En-tête de navigation mis à jour avec succès');
      
      loadingUserInfoRef.current = false;
      return userInfo;
      
    } catch (error) {
      const errorMessage = error?.message || 'Erreur inconnue';
      console.error('Erreur critique dans loadOtherUserInfo:', {
        error: errorMessage,
        userId,
        stack: error?.stack,
        time: new Date().toISOString()
      });
      
      // En cas d'erreur, utiliser le titre par défaut
      const defaultInfo = {
        id: userId,
        name: initialTitle,
        avatar_url: null,
        username: null,
      };
      setOtherUserInfo(defaultInfo);
      setHeaderTitle(initialTitle);
      setHeaderAvatar(null);
      
      navigation.setOptions({
        title: t('chat'),
        headerTitle: t('chat'),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ paddingHorizontal: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
      });
      
      loadingUserInfoRef.current = false;
      return defaultInfo;
    }
  };

  // Map a DB row to UI message item
  const mapRowToItem = (row) => {
    if (!row) return null;
    try {
      const me = currentUserRef.current?.id;
      const sender = row.sender_id && me
        ? (row.sender_id === me ? 'me' : 'other')
        : (row.sender || 'other');
      return {
        id: String(row.id),
        text: row.content ?? row.text ?? '',
        sender,
        created_at: row.created_at,
        sender_id: row.sender_id || null,
        user_id: row.user_id || null,
        receiver_id: row.receiver_id || null,
        deleted_at: row.deleted_at || null,
      };
    } catch (e) {
      console.warn('mapRowToItem error:', e);
      return null;
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not authenticated');
      currentUserRef.current = user;

      // Construire la requête de base
      let query = supabase
        .from('messages')
        .select('*')
        .is('deleted_at', null) // Ne récupérer que les messages non supprimés
        .order('created_at', { ascending: true });

      // Ajouter le filtre de conversation si nécessaire
      if (conversationId) {
        query = query.eq('conversation_id', conversationId);
      } else if (otherUserId) {
        // Si on a un otherUserId, on filtre les messages entre les deux utilisateurs
        query = query.or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),` +
          `and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        );
      } else {
        // Si pas de conversationId ni otherUserId, on charge les messages de l'utilisateur
        query = query.or(
          `sender_id.eq.${user.id}`,
          `receiver_id.eq.${user.id}`
        );
      }

      // Exécuter la requête
      const { data, error } = await query;
      if (error) throw error;
      
      // Mapper les messages valides et filtrer les messages supprimés
      const validMessages = data
        .filter(msg => !msg.deleted_at)
        .map(mapRowToItem)
        .filter(Boolean);
      
      // Mettre à jour l'état des messages
      setMessages(validMessages);
      
      // Charger les informations de l'autre utilisateur - PRIORITÉ ABSOLUE
      let targetUserId = null;
      
      if (conversationId) {
        // Méthode 1: Via conversation_members (la plus fiable)
        const me = user.id;
        console.log('🔍 loadMessages: Recherche via conversation_members, conversationId:', conversationId);
        console.log('👤 loadMessages: Utilisateur actuel:', me);
        
        const { data: members, error: mErr } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conversationId);
        
        if (mErr) {
          console.error('❌ loadMessages: Erreur lors de la récupération des membres:', mErr);
        } else if (Array.isArray(members) && members.length > 0) {
          console.log('📋 loadMessages: Membres trouvés:', members);
          const other = members.find(m => m.user_id !== me);
          if (other?.user_id) {
            targetUserId = other.user_id;
            console.log('✅ loadMessages: Autre utilisateur trouvé:', targetUserId);
          } else {
            console.warn('⚠️ loadMessages: Aucun autre utilisateur dans les membres, recherche dans les messages...');
            // Fallback: chercher dans les messages chargés
        for (const m of validMessages) {
              const candidateId = m.sender_id || m.user_id;
              if (candidateId && candidateId !== me) {
                targetUserId = candidateId;
                console.log('✅ loadMessages: Autre utilisateur trouvé via messages:', targetUserId);
                break;
              }
            }
          }
        } else {
          console.warn('⚠️ loadMessages: Aucun membre trouvé, recherche dans les messages...');
          // Fallback: chercher dans les messages chargés
          for (const m of validMessages) {
            const candidateId = m.sender_id || m.user_id;
            if (candidateId && candidateId !== me) {
              targetUserId = candidateId;
              console.log('✅ loadMessages: Autre utilisateur trouvé via messages:', targetUserId);
              break;
            }
          }
        }
      } else if (otherUserId) {
        // Méthode 2: Directement via otherUserId
        targetUserId = otherUserId;
        console.log('✅ loadMessages: Utilisation otherUserId direct:', targetUserId);
      } else if (validMessages.length > 0) {
        // Méthode 3: Fallback via les messages
        const me = user.id;
        console.log('🔍 loadMessages: Recherche via les messages uniquement');
        for (const m of validMessages) {
          const candidateId = m.sender_id || m.user_id;
          if (candidateId && candidateId !== me) { 
            targetUserId = candidateId; 
            console.log('✅ loadMessages: Autre utilisateur trouvé via messages:', targetUserId);
            break; 
          }
        }
      }
      
      // Charger les infos si on a trouvé un utilisateur
      if (targetUserId) {
        console.log('Chargement des infos utilisateur depuis loadMessages:', targetUserId);
        // Ne charger que si on n'a pas déjà les infos pour cet utilisateur
        if (otherUserInfo?.id !== targetUserId) {
          await loadOtherUserInfo(targetUserId);
        } else {
          console.log('ℹ️ Infos déjà chargées pour cet utilisateur, ignoré');
        }
      }
      
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les infos utilisateur au montage et quand conversationId/otherUserId change
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        currentUserRef.current = data?.user || null;
        
        if (!currentUserRef.current?.id) {
          console.warn('⚠️ Aucun utilisateur connecté');
          return;
        }
        
        let targetUserId = null;
        
        // Priorité 1: otherUserId direct
      if (otherUserId) {
          targetUserId = otherUserId;
          console.log('🎯 Utilisation otherUserId direct:', targetUserId);
        } 
        // Priorité 2: conversationId via conversation_members
        else if (conversationId) {
          console.log('🔍 Recherche via conversationId:', conversationId);
          console.log('👤 Utilisateur actuel:', currentUserRef.current.id);
          
            const { data: members, error: mErr } = await supabase
              .from('conversation_members')
            .select('user_id')
              .eq('conversation_id', conversationId);
          
          if (mErr) {
            console.error('❌ Erreur lors de la récupération des membres:', mErr);
          } else if (Array.isArray(members) && members.length > 0) {
            console.log('📋 Membres trouvés:', members);
            console.log('📋 Nombre de membres:', members.length);
            
            // Filtrer pour trouver l'autre utilisateur
            const other = members.find(m => {
              const isOther = m.user_id !== currentUserRef.current.id;
              console.log(`  - user_id: ${m.user_id}, est autre: ${isOther}`);
              return isOther;
            });
            
              if (other?.user_id) {
              targetUserId = other.user_id;
              console.log('✅ Autre utilisateur trouvé via conversation_members:', targetUserId);
              } else {
              console.warn('⚠️ Aucun autre utilisateur trouvé dans les membres');
              console.log('🔍 Tentative via les messages comme fallback...');
              
              // Fallback: chercher dans les messages
              try {
                const { data: messages, error: msgErr } = await supabase
                  .from('messages')
                  .select('sender_id, user_id')
                  .eq('conversation_id', conversationId)
                  .order('created_at', { ascending: false })
                  .limit(10);
                
                if (!msgErr && Array.isArray(messages) && messages.length > 0) {
                  console.log('📨 Messages trouvés:', messages.length);
                  for (const msg of messages) {
                    const candidateId = msg.sender_id || msg.user_id;
                    if (candidateId && candidateId !== currentUserRef.current.id) {
                      targetUserId = candidateId;
                      console.log('✅ Autre utilisateur trouvé via les messages:', targetUserId);
                      break;
                    }
                  }
                }
              } catch (msgError) {
                console.error('❌ Erreur lors de la recherche dans les messages:', msgError);
                    }
            }
          } else {
            console.warn('⚠️ Aucun membre trouvé pour cette conversation');
            console.log('🔍 Tentative via les messages comme fallback...');
            
            // Fallback: chercher dans les messages
            try {
              const { data: messages, error: msgErr } = await supabase
                        .from('messages')
                .select('sender_id, user_id')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(10);

              if (!msgErr && Array.isArray(messages) && messages.length > 0) {
                console.log('📨 Messages trouvés:', messages.length);
                for (const msg of messages) {
                  const candidateId = msg.sender_id || msg.user_id;
                  if (candidateId && candidateId !== currentUserRef.current.id) {
                    targetUserId = candidateId;
                    console.log('✅ Autre utilisateur trouvé via les messages:', targetUserId);
                    break;
                  }
                }
              }
            } catch (msgError) {
              console.error('❌ Erreur lors de la recherche dans les messages:', msgError);
            }
          }
        }
        
        // Charger les infos si on a un targetUserId
        if (targetUserId) {
          // Toujours recharger pour s'assurer que le titre est à jour
          // Ne pas vérifier si on a déjà les infos, car elles peuvent être obsolètes
          console.log('📞 Appel de loadOtherUserInfo avec:', targetUserId);
          const result = await loadOtherUserInfo(targetUserId);
          if (result) {
            console.log('✅ loadOtherUserInfo a retourné:', result);
          } else {
            console.warn('⚠️ loadOtherUserInfo a retourné null');
                }
        } else {
          console.warn('⚠️ Aucun targetUserId trouvé, titre restera:', initialTitle);
          }
      } catch (e) {
        console.error('❌ Erreur dans useEffect loadUserInfo:', e);
      }
    };
    
    loadUserInfo();
  }, [conversationId, otherUserId]); // Recharger quand ces valeurs changent
  
  // Effet pour forcer la mise à jour du titre quand otherUserInfo change
  useEffect(() => {
    if (otherUserInfo?.name) {
      console.log('🔄 Mise à jour du titre depuis otherUserInfo:', otherUserInfo.name);
      setHeaderTitle(otherUserInfo.name);
    }
  }, [otherUserInfo]);

  // Fonction pour envoyer un message
  const sendMessage = async () => {
    const text = newMessage.trim();
    
    // Vérifier que le message n'est pas vide
    if (!text) {
      console.log('Le message est vide');
      return;
    }

    // Vérifier que l'utilisateur est connecté
    const currentUser = currentUserRef.current;
    if (!currentUser?.id) {
      console.error('Aucun utilisateur connecté');
      Alert.alert('Erreur', 'Vous devez être connecté pour envoyer un message');
      return;
    }

    try {
      // Créer l'objet message
      const messageData = {
        content: text,
        sender_id: currentUser.id,
        user_id: currentUser.id,
        created_at: new Date().toISOString(),
      };

      // Ajouter les informations de conversation
      if (conversationId) {
        messageData.conversation_id = conversationId;
      } else if (otherUserId) {
        messageData.receiver_id = otherUserId;
      } else {
        throw new Error('Aucune conversation ou utilisateur spécifié');
      }

      console.log('Envoi du message:', messageData);

      // Envoyer le message à Supabase
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select();

      if (error) {
        console.error('Erreur Supabase lors de l\'envoi du message:', error);
        throw new Error(`Erreur lors de l'envoi du message: ${error.message}`);
      }

      console.log('Message envoyé avec succès:', data);
      
      // Réinitialiser le champ de saisie
      setNewMessage('');
      
      // Forcer le défilement vers le bas après l'envoi
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      
      return data;
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      Alert.alert(
        'Erreur', 
        error.message || 'Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.'
      );
    }
  };

// Supprimer un message
const deleteMessage = async (messageId) => {
if (!messageId || !currentUserRef.current?.id) return false;
  
// Sauvegarder l'état actuel pour le rollback en cas d'erreur
const previousMessages = [...messages];
  
try {
// Mise à jour optimiste
setMessages(prev => prev.filter(msg => msg.id !== messageId));
  
// Marquer le message comme supprimé dans la base de données
const { error } = await supabase.rpc('soft_delete_message', {
message_id: messageId,
deleted_by: currentUserRef.current.id
});
  
if (error) throw error;
  
return true;
  
} catch (error) {
console.error('Error deleting message:', error);
// En cas d'erreur, restaurer les messages précédents
setMessages(previousMessages);
Alert.alert('Erreur', 'Impossible de supprimer le message');
return false;
}
};

// Gestion du clic long sur un message
const handleLongPressMessage = (message) => {
if (message.sender === 'me') {
Alert.alert(
'Supprimer le message',
'Voulez-vous vraiment supprimer ce message ?',
[
{ text: 'Annuler', style: 'cancel' },
{
text: 'Supprimer',
style: 'destructive',
onPress: () => deleteMessage(message.id),
},
]
);
}
};

// Effet pour charger les messages et s'abonner aux mises à jour
useEffect(() => {
// Vérifier que l'utilisateur est connecté avant de charger les messages
const checkUserAndLoad = async () => {
try {
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
console.error('Utilisateur non connecté:', error);
return;
}
currentUserRef.current = user;
await loadMessages();
} catch (err) {
console.error('Erreur lors de la vérification de l\'utilisateur:', err);
}
};
  
checkUserAndLoad();

// Abonnement aux changements de messages
const channel = supabase
.channel('messages')
// Écouter les nouveaux messages
.on(
'postgres_changes',
{
event: 'INSERT',
schema: 'public',
table: 'messages',
filter: conversationId 
? `conversation_id=eq.${conversationId}` 
: otherUserId 
? `or(and(sender_id=eq.${currentUserRef.current?.id},receiver_id=eq.${otherUserId}),and(sender_id=eq.${otherUserId},receiver_id=eq.${currentUserRef.current?.id}))`
: undefined
},
async (payload) => {
const newMessage = payload.new;
if (newMessage.deleted_at) return;
  
setMessages(prev => {
// Éviter les doublons
if (prev.some(m => m.id === String(newMessage.id))) return prev;
  
const mappedMessage = mapRowToItem(newMessage);
if (!mappedMessage) return prev;
  
return [...prev, mappedMessage]
.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
});
// If we are in this conversation, clear unread
if (conversationId && newMessage.conversation_id === conversationId) {
await clearUnread(conversationId);
}
}
)
// Écouter les mises à jour de messages (pour les suppressions)
.on(
'postgres_changes',
{
event: 'UPDATE',
schema: 'public',
table: 'messages',
filter: conversationId 
? `conversation_id=eq.${conversationId}` 
: otherUserId 
? `or(and(sender_id=eq.${currentUserRef.current?.id},receiver_id=eq.${otherUserId}),and(sender_id=eq.${otherUserId},receiver_id=eq.${currentUserRef.current?.id}))`
: undefined
},
(payload) => {
const updatedMessage = payload.new;
  
setMessages(prev => {
// Si le message a été marqué comme supprimé, le retirer de la liste
if (updatedMessage.deleted_at) {
return prev.filter(msg => msg.id !== String(updatedMessage.id));
}
  
// Sinon, mettre à jour le message existant
return prev.map(msg => 
msg.id === String(updatedMessage.id) 
? { ...msg, ...mapRowToItem(updatedMessage) } 
: msg
);
});
}
)
.subscribe();

return () => {
supabase.removeChannel(channel);
};
}, [conversationId, otherUserId]);

// Clear unread on focus
useEffect(() => {
const unsubscribe = navigation.addListener('focus', () => {
if (conversationId) clearUnread(conversationId);
});
return unsubscribe;
}, [navigation, conversationId]);

// Rendu d'un message
const renderMessage = ({ item }) => {
if (!item || item.deleted_at) return null;
const meId = currentUserRef.current?.id ? String(currentUserRef.current.id) : '';
const senderId = item?.sender_id != null ? String(item.sender_id) : (item?.user_id != null ? String(item.user_id) : null);
const isMe = !!meId && !!senderId ? (senderId === meId) : (item?.sender === 'me');

const messageDate = new Date(item.created_at);
const now = new Date();
const isToday = messageDate.toDateString() === now.toDateString();
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const isYesterday = yesterday.toDateString() === messageDate.toDateString();
let timeString = '';
if (isToday) {
timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
} else if (isYesterday) {
timeString = `Hier, ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
} else {
timeString = messageDate.toLocaleDateString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

if (isMe) {
      // Message envoyé - aligné à droite avec couleur primaire
return (
        <View style={styles.messageContainer}>
          <View style={styles.sentMessageContainer}>
            <View 
              style={[
                styles.messageBubble, 
                styles.sentBubble, 
                { 
                  backgroundColor: colors.primary || '#007AFF',
                }
              ]} 
              onLongPress={() => handleLongPressMessage(item)}
            >
              <Text style={[styles.messageText, styles.sentMessageText]}>{item.text}</Text>
              <Text style={[styles.messageTime, styles.sentMessageTime]}>{timeString}</Text>
</View>
</View>
</View>
);
}

    // Message reçu - aligné à gauche avec couleur différente
    // Utiliser avatar_url depuis otherUserInfo (qui vient de profiles.avatar_url)
    const otherAvatar = otherUserInfo?.avatar_url || headerAvatar || null;
    const otherName = otherUserInfo?.name || headerTitle || 'Utilisateur';
    
    // Log pour déboguer l'avatar et le nom
    console.log('📋 Infos pour le message reçu:', {
      hasOtherUserInfo: !!otherUserInfo,
      otherAvatar: otherAvatar,
      otherName: otherName,
      headerAvatar: headerAvatar,
      headerTitle: headerTitle
    });

return (
      <View style={styles.messageContainer}>
        <View style={styles.receivedMessageContainer}>
<View style={styles.avatarContainer}>
            {otherAvatar ? (
              <Image 
                source={{ uri: otherAvatar }} 
                style={[styles.avatar, { borderColor: colors.border }]} 
                resizeMode="cover"
                onError={(e) => {
                  console.warn('❌ Erreur de chargement de l\'avatar dans le message:', e.nativeEvent.error);
                  console.warn('URL de l\'avatar qui a échoué:', otherAvatar);
                  // En cas d'erreur, mettre à jour pour utiliser le placeholder
                  if (otherUserInfo) {
                    setOtherUserInfo({ ...otherUserInfo, avatar_url: null });
                  }
                }}
                onLoad={() => {
                  console.log('✅ Avatar chargé avec succès dans le message:', otherAvatar);
                }}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: (colors.primary || '#007AFF') + '40' }]}>
                <Text style={[styles.avatarPlaceholderText, { color: colors.primary || '#007AFF' }]}>
                  {otherName.charAt(0).toUpperCase()}
                </Text>
              </View>
)}
</View>
          <View style={styles.receivedBubbleContainer}>
            <Text style={[styles.senderName, { color: colors.primary }]}>{otherName}</Text>
            <View 
              style={[
                styles.messageBubble, 
                styles.receivedBubble, 
                { 
                  backgroundColor: colors.surface || '#F0F0F0',
                  borderColor: colors.border || '#E0E0E0',
                }
              ]}
            > 
<Text style={[styles.messageText, { color: colors.text }]}>{item.text}</Text>
<Text style={[styles.messageTime, { color: colors.subtext }]}>{timeString}</Text>
            </View>
</View>
</View>
</View>
);
};

return (
<SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
<StatusBar barStyle="dark-content" />
<View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}> 
<TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarBack}>
<Ionicons name="arrow-back" size={24} color={colors.text} />
</TouchableOpacity>
        <View style={styles.topBarTitleContainer}>
          {/* Utiliser avatar_url depuis otherUserInfo (qui vient de profiles.avatar_url) */}
          {(otherUserInfo?.avatar_url || headerAvatar) ? (
            <Image 
              source={{ uri: otherUserInfo?.avatar_url || headerAvatar }} 
              style={[styles.topBarAvatar, { borderColor: colors.primary }]} 
              resizeMode="cover"
              onError={(e) => {
                console.warn('❌ Erreur de chargement de l\'avatar dans topBar:', e.nativeEvent.error);
                console.warn('URL de l\'avatar qui a échoué:', otherUserInfo?.avatar_url || headerAvatar);
              }}
              onLoad={() => {
                console.log('✅ Avatar chargé avec succès dans topBar:', otherUserInfo?.avatar_url || headerAvatar);
              }}
            />
          ) : null}
<Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>
            {otherUserInfo?.name || otherUserInfo?.username || headerTitle || initialTitle || 'Chat'}
</Text>
        </View>
<View style={{ width: 24 }} />
</View>

{loading ? (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color={colors.primary} />
</View>
) : messages.length === 0 ? (
<View style={styles.emptyContainer}>
<Text style={[styles.emptyText, { color: colors.subtext }]}>Aucun message pour le moment</Text>
</View>
) : (
<FlatList
ref={listRef}
data={messages}
renderItem={renderMessage}
keyExtractor={item => item.id}
contentContainerStyle={styles.messagesContainer}
onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
onLayout={() => listRef.current?.scrollToEnd({ animated: true })}
keyboardDismissMode="interactive"
keyboardShouldPersistTaps="handled"
/>
)}

<KeyboardAvoidingView
behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
<View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}> 
<TextInput
style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
value={newMessage}
onChangeText={setNewMessage}
placeholder="Tapez un message..."
placeholderTextColor={colors.placeholder}
multiline
/>
<TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
onPress={sendMessage}
disabled={!newMessage.trim()}
>
<Ionicons name="send" size={20} color="#fff" />
</TouchableOpacity>
</View>
</KeyboardAvoidingView>
</SafeAreaView>
);
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
loadingContainer: {
flex: 1,
justifyContent: 'center',
},
emptyContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
padding: 20,
},
emptyText: {
fontSize: 16,
textAlign: 'center',
},
headerTitleContainer: {
flexDirection: 'row',
alignItems: 'center',
maxWidth: '70%',
},
headerTitle: {
fontSize: 18,
fontWeight: '600',
flexShrink: 1,
},
headerAvatar: {
width: 32,
height: 32,
borderRadius: 16,
borderWidth: 1,
borderColor: '#e0e0e0',
},
topBar: {
height: 48,
flexDirection: 'row',
alignItems: 'center',
borderBottomWidth: StyleSheet.hairlineWidth,
paddingHorizontal: 12,
},
topBarBack: {
paddingVertical: 6,
paddingRight: 12,
paddingLeft: 4,
},
  topBarTitleContainer: {
flex: 1,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
  },
  topBarAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
marginRight: 8,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 8,
  },
  messageContainer: {
    width: '100%',
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  sentMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  receivedMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    alignItems: 'flex-start',
  },
  receivedBubbleContainer: {
    flex: 1,
    maxWidth: '75%',
    marginLeft: 8,
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sentBubble: {
    borderBottomRightRadius: 4,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    maxWidth: '75%',
  },
  receivedBubble: {
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  sentMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
    opacity: 0.7,
  },
  sentMessageTime: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  senderName: {
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 8,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 120,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 20,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 1,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  avatarPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
