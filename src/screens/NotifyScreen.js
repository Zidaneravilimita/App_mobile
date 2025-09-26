import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";
import { useIsFocused } from "@react-navigation/native";

/**
 * NotifyScreen
 * - Affiche la liste des notifications (notifications_queue)
 * - Gère la navigation quand l'utilisateur tape une notification système (response)
 * - Fournit actions : rafraîchir, marquer comme lues / réinitialiser badge
 *
 * Note: pour que l'icône de la Header ouvre cette page, ajoutez dans Header.js:
 *   import { useNavigation } from '@react-navigation/native'
 *   const nav = useNavigation();
 *   <TouchableOpacity style={...} onPress={() => nav.navigate('Notify')}>
 * (ceci est une seule ligne à ajouter dans Header.js)
 */
export default function NotifyScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [expoToken, setExpoToken] = useState(null);
  const responseListener = useRef(null);
  const focused = useIsFocused();

  useEffect(() => {
    // register token and load notifications on mount
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) setExpoToken(token);
      await loadNotifications();
    })();

    // handle user tapping system notification -> navigate to details or to this screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        try {
          const data = response?.notification?.request?.content?.data || {};
          // if payload contains event object, go to EventDetails
          if (data.event) {
            navigation.navigate("EventDetails", { event: data.event });
            return;
          }
          // otherwise open Notify screen
          navigation.navigate("Notify");
        } catch (e) {
          console.warn("Notification response handler failed:", e);
          navigation.navigate("Notify");
        }
      }
    );

    return () => {
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload when screen focused
  useEffect(() => {
    if (focused) loadNotifications();
  }, [focused]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setNotifications(data || []);
    } catch (e) {
      console.warn("loadNotifications error:", e);
      Alert.alert("Erreur", "Impossible de charger les notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await supabase
        .from("notifications_queue")
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .neq("is_sent", true);
      await Notifications.setBadgeCountAsync(0);
      loadNotifications();
      Alert.alert("Ok", "Notifications marquées comme lues.");
    } catch (e) {
      console.warn("markAllRead error:", e);
      Alert.alert("Erreur", "Impossible de marquer comme lues.");
    }
  };

  const handlePressNotification = (item) => {
    if (item?.payload?.event) {
      navigation.navigate("EventDetails", { event: item.payload.event });
    } else {
      // open details screen showing payload
      navigation.navigate("NotifyDetail", { notification: item });
    }
  };

  const clearBadge = async () => {
    try {
      await Notifications.setBadgeCountAsync(0);
      Alert.alert("Ok", "Badge réinitialisé.");
    } catch (e) {
      console.warn("clearBadge error:", e);
    }
  };

  const renderItem = ({ item }) => {
    const title = item.title || "Notification";
    const body = item.body || "";
    const time = new Date(item.created_at).toLocaleString();
    return (
      <TouchableOpacity style={styles.item} onPress={() => handlePressNotification(item)}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.itemBody} numberOfLines={2}>
            {body}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.time}>{time}</Text>
          {!item.is_sent && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={loadNotifications}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={markAllRead}>
            <Ionicons name="checkmark-done" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={clearBadge}>
            <Ionicons name="notifications-off" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#8A2BE2" style={{ marginTop: 20 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>Aucune notification</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.small}>Expo token: {expoToken || "— aucun —"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a", padding: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerActions: { flexDirection: "row", gap: 8 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  backBtn: { padding: 6, marginRight: 6 },
  iconBtn: { marginLeft: 8, padding: 8 },
  item: {
    flexDirection: "row",
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,

  },
  itemTitle: { color: "#fff", fontWeight: "700", marginBottom: 4 },
  itemBody: { color: "#ccc", fontSize: 13 },
  time: { color: "#888", fontSize: 11 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#8A2BE2",
    marginTop: 8,
  },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { color: "#fff", marginTop: 12, fontSize: 16 },
  footer: { marginTop: 12, alignItems: "center" },
  small: { color: "#999", fontSize: 12 },
});