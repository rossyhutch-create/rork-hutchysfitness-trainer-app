import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Scale, Ruler, Info, Trash2, LogOut, RefreshCw, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitnessStore, type MeasurementUnit } from '@/store/fitness-store';
import { useAuth } from '@/store/auth-store';
import { BRAND, colors } from '@/constants/branding';
import NavigationDropdown from '@/components/NavigationDropdown';

export default function SettingsScreen() {
  const { 
    measurementSettings, 
    updateMeasurementSettings, 
    loadData,
    isLoading 
  } = useFitnessStore();
  const { user, logout, syncData } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWeightUnitChange = (unit: MeasurementUnit) => {
    updateMeasurementSettings({ weightUnit: unit });
  };

  const handleDistanceUnitChange = (unit: MeasurementUnit) => {
    updateMeasurementSettings({ distanceUnit: unit });
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will be saved to your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleSync = async () => {
    try {
      await syncData();
      Alert.alert('Success', 'Data synced successfully!');
    } catch {
      Alert.alert('Error', 'Failed to sync data. Please try again.');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'Data clearing will be available in a future update.');
          },
        },
      ]
    );
  };

  const renderUnitSelector = (
    title: string,
    icon: React.ReactElement,
    currentUnit: MeasurementUnit,
    onUnitChange: (unit: MeasurementUnit) => void,
    metricLabel: string,
    imperialLabel: string
  ) => (
    <View style={styles.settingSection}>
      <View style={styles.settingHeader}>
        <View style={styles.settingIcon}>
          {icon}
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      
      <View style={styles.unitSelector}>
        <TouchableOpacity
          style={[
            styles.unitButton,
            currentUnit === 'metric' && styles.unitButtonActive,
          ]}
          onPress={() => onUnitChange('metric')}
        >
          <Text
            style={[
              styles.unitButtonText,
              currentUnit === 'metric' && styles.unitButtonTextActive,
            ]}
          >
            {metricLabel}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.unitButton,
            currentUnit === 'imperial' && styles.unitButtonActive,
          ]}
          onPress={() => onUnitChange('imperial')}
        >
          <Text
            style={[
              styles.unitButtonText,
              currentUnit === 'imperial' && styles.unitButtonTextActive,
            ]}
          >
            {imperialLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <NavigationDropdown />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.accountCard}>
            <View style={styles.accountHeader}>
              <User color={BRAND.colors.primary} size={24} />
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{user?.name}</Text>
                <Text style={styles.accountEmail}>{user?.email}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
              <RefreshCw color={BRAND.colors.primary} size={20} />
              <Text style={styles.syncButtonText}>Sync Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurement Units</Text>
          
          {renderUnitSelector(
            'Weight Units',
            <Scale color={BRAND.colors.primary} size={24} />,
            measurementSettings.weightUnit,
            handleWeightUnitChange,
            'Kilograms (kg)',
            'Pounds (lbs)'
          )}
          
          {renderUnitSelector(
            'Distance Units',
            <Ruler color={BRAND.colors.primary} size={24} />,
            measurementSettings.distanceUnit,
            handleDistanceUnitChange,
            'Kilometers (km)',
            'Miles (mi)'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Info color={BRAND.colors.primary} size={24} />
              <Text style={styles.infoTitle}>About {BRAND.name}</Text>
            </View>
            <Text style={styles.infoText}>
              Professional fitness tracking app for personal trainers and fitness enthusiasts.
            </Text>
            <Text style={styles.infoVersion}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut color="#ef4444" size={24} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerButton} onPress={clearAllData}>
            <Trash2 color="#ef4444" size={24} />
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginBottom: 16,
  },
  settingSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: BRAND.colors.primary,
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  unitButtonTextActive: {
    color: colors.white,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  infoVersion: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.error,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
    marginLeft: 12,
  },
  accountCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountInfo: {
    marginLeft: 12,
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  accountEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: BRAND.colors.primary,
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.error,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ef4444',
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 40,
  },
});
