import React from 'react';
import { View, Image, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { BRAND, colors } from '@/constants/branding';

interface LogoHeaderProps {
  size?: 'small' | 'medium' | 'large';
  title?: string;
  inline?: boolean;
}

export default function LogoHeader({ size = 'medium', title, inline = false }: LogoHeaderProps) {
  const { width } = useWindowDimensions();
  const logoSize = {
    small: { width: inline ? 28 : width * 0.3, height: inline ? 28 : width * 0.3 * 0.8 },
    medium: { width: width * 0.4, height: width * 0.4 * 0.8 },
    large: { width: width * 0.5, height: width * 0.5 * 0.8 },
  }[size];

  if (inline && title) {
    return (
      <View style={styles.inlineContainer} testID="logo-header">
        <Image 
          source={{ uri: BRAND.logo }} 
          style={[styles.logo, logoSize]}
          resizeMode="contain"
        />
        <Text style={styles.inlineTitle}>{title}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="logo-header">
      <Image 
        source={{ uri: BRAND.logo }} 
        style={[styles.logo, logoSize]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  logo: {
    // Dimensions set dynamically based on size prop
  },
  inlineTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
});