import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../config/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function NotifyScreen() {
  const [expoToken, setExpoToken] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const realtimeRef = useRef(null);
  const notificationListener = useRef(null);

  useEffect(() => {
    // init: permissions, initial badge from server, start realtime if desired
    (async () => {
      await registerForPushNotificationsAsync().then((t) => {
        if (t) setExpoToken(t);
      });
      await updateInitialBadge();
      startRealtime();
    })();

    // foreground notification listener (optional logging)
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

    return () => {
      stopRealtime();
      if (notificationListener.current)
        Notifications.removeNotificationSubscription(notificationListener.current);
    };
  }, []);

  // Get total events count and set badge
  const updateInitialBadge = async () => {
    try {
      const { count, error } = await supabase
        .from("events")
        .select("id_event", { count: "exact", head: false })
        .limit(1);
      // supabase JS may not return count this way in some versions; fallback to fetch all
      if (error || typeof count !== "number") {
        const { data, error: fetchErr } = await supabase
          .from("events")
          .select("id_event");
        if (fetchErr) throw fetchErr;
        const c = (data || []).length;
        await setAppBadge(c);
        setBadgeCount(c);
      } else {
        await setAppBadge(count);
        setBadgeCount(count);
      }
    } catch (e) {
      console.warn("Impossible d'obtenir le nombre d'événements:", e);
    }
  };

  const setAppBadge = async (n) => {
    try {
      if (Platform.OS === "android") {
        // Android support may vary; Expo handles some cases
        await Notifications.setBadgeCountAsync(n);
      } else {
        await Notifications.setBadgeCountAsync(n);
      }
    } catch (e) {
      console.warn("Erreur setBadgeCount:", e);
    }
  };

  // Start realtime subscription to new events
  const startRealtime = () => {
    if (realtimeRef.current) return;
    try {
      // Try new v2-style channel first
      if (supabase.channel) {
        const chan = supabase
          .channel("public:events")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "events" },
            (payload) => handleNewEvent(payload.new)
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              realtimeRef.current = chan;
              setSubscribed(true);
            }
          });
      } else if (supabase.from) {
        // fallback older API
        const sub = supabase
          .from("events")
          .on("INSERT", (payload) => handleNewEvent(payload.new))
          .subscribe();
        realtimeRef.current = sub;
        setSubscribed(true);
      }
    } catch (e) {
      console.warn("Impossible de démarrer realtime:", e);
    }
  };

  const stopRealtime = async () => {
    try {
      if (!realtimeRef.current) return;
      if (realtimeRef.current.unsubscribe) {
        await realtimeRef.current.unsubscribe();
      } else if (supabase.removeChannel) {
        await supabase.removeChannel(realtimeRef.current);
      }
    } catch (e) {
      console.warn("Erreur stopRealtime:", e);
    } finally {
      realtimeRef.current = null;
      setSubscribed(false);
    }
  };

  // Called when a new event is inserted in DB
  const handleNewEvent = async (eventRow) => {
    try {
      // increment badge
      const newCount = badgeCount + 1;
      setBadgeCount(newCount);
      await setAppBadge(newCount);

      // schedule a local notification to inform user
      const title = eventRow?.titre ? `Nouvel événement: ${eventRow.titre}` : "Nouvel événement publié";
      const body = eventRow?.lieu_detail ? `${eventRow.lieu_detail}` : "Consultez les détails dans l'application";

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { event: eventRow },
        },
        trigger: null, // immediate
      });
    } catch (e) {
      console.warn("handleNewEvent erreur:", e);
    }
  };

  const clearBadge = async () => {
    await setAppBadge(0);
    setBadgeCount(0);
  };

  const toggleRealtime = async () => {
    if (subscribed) {
      await stopRealtime();
    } else {
      startRealtime();
    }
  };

  // Option to save expo token to profiles table (so server can push)
  const saveTokenToProfile = async () => {
    try {
      const userResp = await supabase.auth.getUser();
      const user = userResp?.data?.user;
      if (!user) return Alert.alert("Erreur", "Utilisateur non connecté");
      await supabase.from("profiles").upsert({ id: user.id, expo_push_token: expoToken }, { returning: "minimal" });
      Alert.alert("Token sauvegardé");
    } catch (e) {
      console.warn("saveTokenToProfile erreur:", e);
      Alert.alert("Erreur", "Impossible de sauvegarder le token");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications d'événements</Text>

      <View style={styles.row}>
        <Ionicons name="notifications-outline" size={22} color="#fff" />
        <Text style={styles.info}>Badge : {badgeCount}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={toggleRealtime}>
        <Text style={styles.buttonText}>{subscribed ? "Désactiver realtime" : "Activer realtime"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={clearBadge}>
        <Text style={styles.buttonText}>Réinitialiser badge</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={saveTokenToProfile}>
        <Text style={styles.buttonText}>Enregistrer token pour push serveur</Text>
      </TouchableOpacity>

      <Text style={styles.small}>Expo token: {expoToken || "— aucun —"}</Text>
    </View>
  );
}

/* Helpers */
async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      Alert.alert("Attention", "Les notifications push nécessitent un appareil physique.");
      return null;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Permission refusée", "Autorisez les notifications dans les paramètres.");
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData?.data || null;
  } catch (e) {
    console.warn("registerForPushNotificationsAsync erreur:", e);
    return null;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a1a", padding: 16 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  info: { color: "#fff", marginLeft: 8 },
  button: {
    backgroundColor: "#8A2BE2",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  small: { color: "#ccc", marginTop: 12 },
});