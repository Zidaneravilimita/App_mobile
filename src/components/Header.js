// src/components/Header.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header() {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity>
        <Image
          source={require('../../assets/images/Avatar/avatar.jpg')} 
          style={styles.avatar}
        />
      </TouchableOpacity>
      <View style={styles.logoContainer}>
        <Ionicons name="sparkles" size={24} color="#8A2BE2" />
        <Text style={styles.logoText}>EVENT PARTY</Text>
      </View>
      <TouchableOpacity style={styles.notificationContainer}>
        <Ionicons name="notifications" size={24} color="#fff" />
        <View style={styles.notificationBadge}>
          <Text style={styles.badgeText}>12</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a1a',
    marginTop: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});