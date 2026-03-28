import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, BRAND } from '@/constants/branding';

interface CustomHeaderProps {
  title?: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
}

export default function CustomHeader({ 
  title, 
  showBackButton = true, 
  rightComponent 
}: CustomHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleContainer}>
          <Image 
            source={{ uri: BRAND.logo }} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      
      {showBackButton && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          testID="back-button"
        >
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
      )}
      
      {rightComponent && (
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
    paddingTop: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    bottom: 12,
    zIndex: 10,
  },
  rightContainer: {
    position: 'absolute',
    right: 16,
    bottom: 12,
    zIndex: 10,
  },
});