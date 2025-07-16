import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BackgroundWrapperProps {
  children: React.ReactNode;
  style?: any;
}

export default function BackgroundWrapper({ children, style }: BackgroundWrapperProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Dark Horizon Glow Background */}
      <LinearGradient
        colors={['#000000', '#0d1a36']}
        start={{ x: 0.5, y: 0.1 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
}); 