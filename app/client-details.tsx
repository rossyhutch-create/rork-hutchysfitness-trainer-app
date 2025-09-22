import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Calendar,
  TrendingUp,
  Trophy,
  Activity,
  ChevronLeft,
  Edit,
  Trash2,
  Dumbbell,
  Target,
  Award,
  Camera,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitnessStore } from '@/store/fitness-store';
import ClientProgressManager from '@/components/ClientProgressManager';

export default function ClientDetailsScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const insets = useSafeAreaInsets();
  const [showProgress, setShowProgress] = useState(false);
  const {
    clients,
    workouts,
    personalRecords,
    exercises,
    deleteClient,
    getClientPersonalRecords,
    formatWeight,
  } = useFitnessStore();

  const client = clients.find(c => c.id === clientId);
  const clientWorkouts = workouts.filter(w => w.clientId === clientId);
  const clientPRs = getClientPersonalRecords(clientId || '');

  if (!client) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Client not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleDeleteClient = () => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}? This will also delete all their workouts and records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteClient(client.id);
            router.back();
          },
        },
      ]
    );
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  const stats = {
    totalWorkouts: clientWorkouts.length,
    lastWorkout: clientWorkouts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0]?.date,
    totalVolume: clientWorkouts.reduce((sum, workout) => 
      sum + workout.exercises.reduce((exSum, ex) => 
        exSum + ex.sets.reduce((setSum, set) => 
          setSum + (set.weight * set.reps), 0
        ), 0
      ), 0
    ),
    personalRecords: clientPRs.length,
  };

  const recentPRs = clientPRs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color="#ffffff" size={24} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push(`/edit-client?clientId=${client.id}`)}
            >
              <Edit color="#ffffff" size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDeleteClient}
            >
              <Trash2 color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.clientHeader}>
          <View style={styles.avatarContainer}>
            <User color="#ffffff" size={40} />
          </View>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.email && (
            <Text style={styles.clientEmail}>{client.email}</Text>
          )}
          {client.phone && (
            <Text style={styles.clientPhone}>{client.phone}</Text>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Activity color="#6366f1" size={24} />
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy color="#f59e0b" size={24} />
            <Text style={styles.statValue}>{stats.personalRecords}</Text>
            <Text style={styles.statLabel}>Personal Records</Text>
          </View>
          <View style={styles.statCard}>
            <Dumbbell color="#10b981" size={24} />
            <Text style={styles.statValue}>
              {formatWeight(stats.totalVolume)}
            </Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar color="#8b5cf6" size={24} />
            <Text style={styles.statValue}>
              {stats.lastWorkout
                ? new Date(stats.lastWorkout).toLocaleDateString()
                : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Last Workout</Text>
          </View>
        </View>

        {/* Personal Records Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award color="#f59e0b" size={20} />
            <Text style={styles.sectionTitle}>Recent Personal Records</Text>
          </View>
          {recentPRs.length > 0 ? (
            <View style={styles.prList}>
              {recentPRs.map((pr) => (
                <View key={pr.id} style={styles.prCard}>
                  <View style={styles.prIcon}>
                    <Trophy color="#f59e0b" size={16} />
                  </View>
                  <View style={styles.prInfo}>
                    <Text style={styles.prExercise}>
                      {getExerciseName(pr.exerciseId)}
                    </Text>
                    <Text style={styles.prType}>
                      {pr.type === 'max_weight' ? 'Max Weight' : 'Max Volume'}
                    </Text>
                  </View>
                  <View style={styles.prValue}>
                    <Text style={styles.prValueText}>
                      {pr.type === 'max_weight'
                        ? formatWeight(pr.value)
                        : `${pr.value.toFixed(0)} kg`}
                    </Text>
                    <Text style={styles.prDate}>
                      {new Date(pr.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPR}>
              <Text style={styles.emptyPRText}>No personal records yet</Text>
            </View>
          )}
        </View>

        {/* Recent Workouts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity color="#6366f1" size={20} />
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
          </View>
          {clientWorkouts.length > 0 ? (
            <View style={styles.workoutList}>
              {clientWorkouts
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((workout) => (
                  <TouchableOpacity
                    key={workout.id}
                    style={styles.workoutCard}
                    onPress={() => router.push(`/workout-details?workoutId=${workout.id}`)}
                  >
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>
                        {workout.name || 'Workout'}
                      </Text>
                      <Text style={styles.workoutDate}>
                        {new Date(workout.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.workoutStats}>
                      <Text style={styles.workoutStatText}>
                        {workout.exercises.length} exercises
                      </Text>
                      <Text style={styles.workoutDuration}>
                        {workout.duration ? `${workout.duration} min` : 'N/A'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          ) : (
            <View style={styles.emptyWorkouts}>
              <Text style={styles.emptyWorkoutsText}>No workouts recorded yet</Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowProgress(!showProgress)}
          >
            <Camera color="#10b981" size={20} />
            <Text style={styles.sectionTitle}>Progress Tracking</Text>
            <Text style={styles.expandText}>
              {showProgress ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
          {showProgress && (
            <ClientProgressManager clientId={client.id} />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/add-workout?clientId=${client.id}`)}
          >
            <Text style={styles.actionButtonText}>Start New Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  header: {
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clientHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientName: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  clientPhone: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  expandText: {
    marginLeft: 'auto',
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500' as const,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#1f2937',
  },
  prList: {
    gap: 12,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  prIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prInfo: {
    flex: 1,
  },
  prExercise: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 2,
  },
  prType: {
    fontSize: 12,
    color: '#6b7280',
  },
  prValue: {
    alignItems: 'flex-end',
  },
  prValueText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#f59e0b',
    marginBottom: 2,
  },
  prDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyPR: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyPRText: {
    fontSize: 14,
    color: '#6b7280',
  },
  workoutList: {
    gap: 12,
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  workoutInfo: {
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 2,
  },
  workoutDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutStatText: {
    fontSize: 12,
    color: '#6b7280',
  },
  workoutDuration: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyWorkouts: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyWorkoutsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});