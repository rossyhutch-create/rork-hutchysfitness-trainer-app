import { Redirect } from 'expo-router';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { BRAND, colors } from '@/constants/branding';
import { useAuth } from '@/store/auth-store';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash || isLoading) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: BRAND.logo }} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandName}>{BRAND.name}</Text>
        <Text style={styles.tagline}>{BRAND.tagline}</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/clients" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: colors.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: colors.text,
    letterSpacing: 2,
  },
});