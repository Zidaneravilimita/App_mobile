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
    console.log('Chargement des informations pour l\'utilisateur:', userId);
    
    if (!userId) {
      console.warn('Aucun ID utilisateur fourni à loadOtherUserInfo');
      return null;
    }

    try {
      console.log('Récupération du profil pour l\'utilisateur:', userId);
      
      // 1. Récupérer le profil de l'utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, first_name, last_name, updated_at')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', {
          error: profileError,
          userId,
          time: new Date().toISOString()
        });
        throw profileError;
      }
      // Clear unread for this conversation after loading
      if (conversationId) {
        await clearUnread(conversationId);
      }

      if (!profile) {
        console.warn('Aucun profil trouvé pour l\'utilisateur:', userId);
        throw new Error('Profil non trouvé');
      }

      console.log('Profil récupéré avec succès:', { 
        userId, 
        hasUsername: !!profile.username,
        hasName: !!(profile.first_name && profile.last_name)
      });
      
      // 2. Récupérer l'email si nécessaire
      let email = null;
      if (!profile.username) {
        try {
          console.log('Récupération de l\'email pour l\'utilisateur:', userId);
          const { data: userRec, error: emailError } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .maybeSingle();
            
          if (emailError) {
            console.warn('Erreur lors de la récupération de l\'email:', emailError);
          } else if (userRec?.email) {
            email = userRec.email;
            console.log('Email récupéré avec succès');
          }
        } catch (emailErr) {
          console.warn('Erreur lors de la récupération de l\'email:', emailErr);
        }
      }

      // 3. Déterminer le nom d'affichage
      const displayName = profile.username || email ||
                        (profile.first_name && profile.last_name ? 
                          `${profile.first_name} ${profile.last_name}` : 
                          profile.full_name) || 
                        t('chat');
      
      console.log('Nom d\'affichage déterminé:', displayName);
      
      // 4. Mettre à jour l'état local
      setHeaderTitle(displayName);
      
      if (profile.avatar_url) {
        console.log('Mise à jour de l\'avatar:', profile.avatar_url);
        setHeaderAvatar(profile.avatar_url);
      }
      
      // 5. Mettre à jour l'en-tête de navigation
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
      
      return displayName;
      
    } catch (error) {
      const errorMessage = error?.message || 'Erreur inconnue';
      console.error('Erreur critique dans loadOtherUserInfo:', {
        error: errorMessage,
        userId,
        stack: error?.stack,
        time: new Date().toISOString()
      });
      
      // En cas d'erreur, utiliser le titre par défaut
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
      
      return null;
    }
  };

  const mapRowToItem = (row) => {
    // Cette vérification n'est plus nécessaire car on filtre déjà au niveau de la requête
    // mais on la garde pour être sûr
    if (row.deleted_at) return null;
    
    try {
      return {
        id: String(row.id),
        text: row.content ?? row.text,
        sender: row.sender_id
          ? (row.sender_id === currentUserRef.current?.id ? 'me' : 'other')
          : (row.user_id === currentUserRef.current?.id ? 'me' : 'other'),
        created_at: row.created_at,
        sender_id: row.sender_id, // Conserver l'ID de l'expéditeur
      };
    } catch (error) {
      console.error('Error mapping message:', error);
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
      
      // Si on a un otherUserId, charger ses informations
      if (otherUserId) {
        await loadOtherUserInfo(otherUserId);
      } else if (validMessages.length > 0 && conversationId) {
        // Sinon, si on a des messages dans une conversation, trouver l'autre utilisateur
        const otherMessage = validMessages.find(msg => 
          msg.sender_id && msg.sender_id !== user.id
        );
        
        if (otherMessage) {
          await loadOtherUserInfo(otherMessage.sender_id);
        }
      }
      
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch current user then load messages and subscribe
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        currentUserRef.current = data?.user || null;
        
        // Si on a un other_user_id dans les paramètres, charger ses informations
        if (otherUserId) {
          await loadOtherUserInfo(otherUserId);
        }
      } catch (e) {
        console.warn('getUser error:', e);
      }
      // Always try to resolve the other participant's profile to set title/avatar
      // Prefer direct lookup if other_user_id is provided
      if (otherUserId) {
        try {
          const { data: prof, error: pErr } = await supabase
            .from('profiles')
            .select('full_name,username,avatar_url')
            .eq('id', otherUserId)
            .maybeSingle();
          if (!pErr && prof) {
            // try to get email if no username
            let email = null;
            if (!prof.username) {
              try {
                const { data: u, error: uErr } = await supabase
                  .from('users')
                  .select('email')
                  .eq('id', otherUserId)
                  .maybeSingle();
                if (!uErr && u?.email) email = u.email;
              } catch {}
            }
            setHeaderTitle(prof.username || email || prof.full_name || initialTitle);
            if (!headerAvatar && prof.avatar_url) setHeaderAvatar(prof.avatar_url);
          }
        } catch {}
      } else if (conversationId) {
        try {
          const me = currentUserRef.current?.id;
          if (me) {
            const { data: members, error: mErr } = await supabase
              .from('conversation_members')
              .select('conversation_id,user_id')
              .eq('conversation_id', conversationId);
            if (!mErr && Array.isArray(members)) {
              const other = members.find(m => m.user_id !== me);
              if (other?.user_id) {
                const { data: prof, error: pErr } = await supabase
                  .from('profiles')
                  .select('full_name,username,avatar_url')
                  .eq('id', other.user_id)
                  .maybeSingle();
                if (!pErr && prof) {
                  let email = null;
                  if (!prof.username) {
                    try {
                      const { data: u, error: uErr } = await supabase
                        .from('users')
                        .select('email')
                        .eq('id', other.user_id)
                        .maybeSingle();
                      if (!uErr && u?.email) email = u.email;
                    } catch (e) {
                    console.error('Error fetching user email:', e);
                  }
                  }
                  setHeaderTitle(prof.username || email || prof.full_name || initialTitle);
                  if (!headerAvatar && prof.avatar_url) setHeaderAvatar(prof.avatar_url);
                }
              } else {
                // Fallback: resolve from last message sender
                const { data: lastMsgs, error: lErr } = await supabase
                  .from('messages')
                  .select('sender_id')
                  .eq('conversation_id', conversationId)
                  .order('created_at', { ascending: false })
                  .limit(1);
                if (!lErr && Array.isArray(lastMsgs) && lastMsgs.length > 0) {
                  const candidate = lastMsgs[0]?.sender_id;
                  if (candidate && candidate !== me) {
                    const { data: prof2, error: p2Err } = await supabase
                      .from('profiles')
                      .select('full_name,username,avatar_url')
                      .eq('id', candidate)
                      .maybeSingle();
                    if (!p2Err && prof2) {
                      let email = null;
                      if (!prof2.username) {
                        try {
                          const { data: u2, error: u2Err } = await supabase
                            .from('users')
                            .select('email')
                            .eq('id', candidate)
                            .maybeSingle();
                          if (!u2Err && u2?.email) email = u2.email;
                        } catch (e) {
                    console.error('Error fetching user email:', e);
                  }
                      }
                      setHeaderTitle(prof2.username || email || prof2.full_name || initialTitle);
                      if (!headerAvatar && prof2.avatar_url) setHeaderAvatar(prof2.avatar_url);
                    }

                    try {
                      const messageData = {
                        content: text,
                        sender_id: currentUserRef.current.id,
                        created_at: new Date().toISOString(),
                      };

                      if (conversationId) {
                        messageData.conversation_id = conversationId;
                      } else if (otherUserId) {
                        messageData.receiver_id = otherUserId;
                      } else {
                        throw new Error('No conversation or user specified');
                      }

                      const { error } = await supabase
                        .from('messages')
                        .insert(messageData);

                      if (error) throw error;

                      setNewMessage('');
                      // Le listener en temps réel mettra à jour l'interface
                    } catch (error) {
                      console.error('Error sending message:', error);
                      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
                    }
                  }
                }
              }
            }
          }
        } catch {}
      }
    })();
  }, [conversationId, otherUserId]);

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
    
    const isMe = item.sender === 'me';
    const messageDate = new Date(item.created_at);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === messageDate.toDateString();
    
    let timeString = '';
    if (isToday) {
      timeString = messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      timeString = `Hier, ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      timeString = messageDate.toLocaleDateString([], { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    if (isMe) {
      return (
        <View style={[styles.messageRow, { justifyContent: 'flex-end' }]}>
          <View style={styles.messageContent}>
            <View 
              style={[
                styles.messageBubble, 
                styles.sentBubble, 
                { 
                  backgroundColor: colors.primary,
                  alignSelf: 'flex-end',
                }
              ]}
              onLongPress={() => handleLongPressMessage(item)}
            >
              <Text style={[styles.messageText, { color: '#fff' }]}>{item.text}</Text>
              <Text style={[styles.messageTime, { color: 'rgba(255,255,255,0.7)' }]}>{timeString}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, { justifyContent: 'flex-start' }]}>
        <View style={styles.avatarContainer}>
          {headerAvatar && (
            <Image 
              source={{ uri: headerAvatar }} 
              style={styles.avatar}
              resizeMode="cover"
            />
          )}
        </View>
        <View style={styles.messageContent}>
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {headerTitle}
          </Text>
          <View 
            style={[
              styles.messageBubble, 
              styles.receivedBubble, 
              { 
                backgroundColor: colors.card,
                borderColor: colors.border,
                alignSelf: 'flex-start',
              }
            ]}
          >
            <Text style={[styles.messageText, { color: colors.text }]}>{item.text}</Text>
            <Text style={[styles.messageTime, { color: colors.subtext }]}>{timeString}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Rendu principal
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>
          {headerTitle}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Liste des messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Aucun message pour le moment
          </Text>
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

      {/* Zone de saisie */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { 
          backgroundColor: colors.background,
          borderTopColor: colors.border 
        }]}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border
            }]}
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
    alignItems: 'center',
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
  topBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  messageContent: {
    flex: 1,
    maxWidth: '80%',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: '100%',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentBubble: {
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  receivedBubble: {
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
    opacity: 0.7,
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
    marginRight: 8,
    justifyContent: 'flex-end',
    paddingBottom: 20, // Pour aligner avec le texte du message
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
  }
});
