// src/components/Screen.js
import React from 'react';
import { View, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Generic Screen wrapper
 * - Provides SafeArea
 * - Optional scroll (with flexGrow so content can stretch on tall screens)
 * - Keyboard avoidance for forms
 */
export default function Screen({
  children,
  style,
  scroll = false,
  contentContainerStyle,
  keyboard = false,
}) {
  const Inner = (
    <View style={[{ flex: 1 }, style]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTouches="handled"
          contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );

  const MaybeKeyboard = keyboard ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {Inner}
    </KeyboardAvoidingView>
  ) : (
    Inner
  );

  return <SafeAreaView style={{ flex: 1 }}>{MaybeKeyboard}</SafeAreaView>;
}
