import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import * as NavigationBar from "expo-navigation-bar";
import React, { useEffect } from "react";
import { StyleSheet, Platform, StatusBar, BackHandler } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BRAND, colors } from "@/constants/branding";
import { AuthProvider } from "@/store/auth-store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ 
      headerBackTitle: "Back",
      headerTintColor: colors.primary,
      headerStyle: {
        backgroundColor: colors.cardBackground,
      },
      headerTitleStyle: {
        color: colors.text,
      },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="clients" options={{ headerShown: false }} />
      <Stack.Screen name="workouts" options={{ headerShown: false }} />
      <Stack.Screen name="exercises" options={{ headerShown: false }} />
      <Stack.Screen name="progress" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="add-client" options={{ presentation: "modal", title: "Add Client" }} />
      <Stack.Screen name="add-workout" options={{ presentation: "modal", title: "Add Workout" }} />
      <Stack.Screen name="workout-builder" options={{ presentation: "modal", title: "Workout Builder" }} />
      <Stack.Screen name="templates" options={{ presentation: "modal", title: "Templates" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    
    // Configure Android-friendly system UI
    if (Platform.OS === 'android') {
      // Set status bar style for Android
      StatusBar.setBarStyle('light-content', true);
      StatusBar.setBackgroundColor(colors.background, true);
      StatusBar.setTranslucent(false); // Ensure proper status bar behavior
      
      // Configure system navigation bar for Android
      SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
      
      // Configure navigation bar for better Android experience
      NavigationBar.setBackgroundColorAsync(colors.background).catch(() => {});
      NavigationBar.setButtonStyleAsync('light').catch(() => {});
      
      // Handle Android back button - allow default behavior for navigation
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Return false to allow default back button behavior
        // This ensures proper navigation stack handling and system integration
        return false;
      });
      
      return () => backHandler.remove();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GestureHandlerRootView style={styles.container}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});