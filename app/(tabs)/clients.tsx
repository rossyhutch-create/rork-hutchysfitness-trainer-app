import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Plus, User, Calendar, TrendingUp, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitnessStore } from '@/store/fitness-store';
import { Client } from '@/types';
import { colors } from '@/constants/branding';

export default function ClientsScreen() {
  const { clients, workouts, loadData, isLoading, deleteClient } = useFitnessStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getClientStats = (clientId: string) => {
    const clientWorkouts = workouts.filter(w => w.clientId === clientId);
    const totalWorkouts = clientWorkouts.length;
    const lastWorkout = clientWorkouts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    return {
      totalWorkouts,
      lastWorkout: lastWorkout?.date,
    };
  };

  const handleDeleteClient = (client: Client) => {
    if (Platform.OS === 'web') {
      deleteClient(client.id);
      return;
    }
    
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}? This will also delete all their workouts, personal records, and other data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteClient(client.id),
        },
      ]
    );
  };

  const renderClient = ({ item }: { item: Client }) => {
    const stats = getClientStats(item.id);
    
    return (
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() => router.push(`/client-details?clientId=${item.id}`)}
        onLongPress={() => handleDeleteClient(item)}
        delayLongPress={500}
        testID={`client-card-${item.id}`}
      >
        <View style={styles.clientAvatar}>
          <User color={colors.white} size={24} />
        </View>
        
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          <View style={styles.clientStats}>
            <View style={styles.statItem}>
              <Calendar color={colors.textSecondary} size={14} />
              <Text style={styles.statText}>
                {stats.totalWorkouts} workouts
              </Text>
            </View>
            {stats.lastWorkout && (
              <View style={styles.statItem}>
                <TrendingUp color={colors.textSecondary} size={14} />
                <Text style={styles.statText}>
                  Last: {new Date(stats.lastWorkout).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteClient(item)}
          testID={`delete-client-${item.id}`}
        >
          <Trash2 color={colors.error} size={18} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading clients...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Clients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-client')}
          testID="add-client-button"
        >
          <Plus color={colors.white} size={24} />
        </TouchableOpacity>
      </View>

      {clients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <User color={colors.textSecondary} size={64} />
          <Text style={styles.emptyTitle}>No clients yet</Text>
          <Text style={styles.emptyText}>
            Add your first client to start tracking their fitness journey
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/add-client')}
          >
            <Text style={styles.emptyButtonText}>Add Your First Client</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={clients}
          renderItem={renderClient}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  clientStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});