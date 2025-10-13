import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TrendingUp, Award, Calendar, Target } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitnessStore } from '@/store/fitness-store';
import { colors } from '@/constants/branding';
import { router } from 'expo-router';
import NavigationDropdown from '@/components/NavigationDropdown';

export default function ProgressScreen() {
  const { workouts, personalRecords, loadData, isLoading } = useFitnessStore();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getWorkoutStats = () => {
    const now = new Date();
    const startDate = new Date();
    
    if (selectedPeriod === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    const filteredWorkouts = workouts.filter(w => 
      new Date(w.date) >= startDate
    );

    const totalWorkouts = filteredWorkouts.length;
    const totalDuration = filteredWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

    return {
      totalWorkouts,
      totalDuration,
      avgDuration,
    };
  };

  const stats = getWorkoutStats();



  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <NavigationDropdown />
        </View>

        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Calendar color={colors.primary} size={24} />
            </View>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp color={colors.success} size={24} />
            </View>
            <Text style={styles.statValue}>{stats.totalDuration}</Text>
            <Text style={styles.statLabel}>Minutes Trained</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Target color={colors.warning} size={24} />
            </View>
            <Text style={styles.statValue}>{stats.avgDuration}</Text>
            <Text style={styles.statLabel}>Avg Duration (min)</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Award color={colors.secondary} size={24} />
            </View>
            <Text style={styles.statValue}>{personalRecords.length}</Text>
            <Text style={styles.statLabel}>Personal Bests</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => router.push('/personal-bests')}
        >
          <View style={styles.sectionHeader}>
            <Award color={colors.primary} size={24} />
            <Text style={styles.sectionTitle}>Personal Bests</Text>
          </View>
          <Text style={styles.sectionDescription}>
            View and track your personal records
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sectionCard}
          onPress={() => router.push('/video-records')}
        >
          <View style={styles.sectionHeader}>
            <Calendar color={colors.primary} size={24} />
            <Text style={styles.sectionTitle}>Video Records</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Record and review your form
          </Text>
        </TouchableOpacity>

        <View style={styles.recentWorkouts}>
          <Text style={styles.recentTitle}>Recent Activity</Text>
          {workouts.slice(0, 5).map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={styles.recentWorkoutCard}
              onPress={() => router.push(`/workout-details?workoutId=${workout.id}`)}
            >
              <View style={styles.recentWorkoutInfo}>
                <Text style={styles.recentWorkoutName}>{workout.name}</Text>
                <Text style={styles.recentWorkoutDate}>
                  {new Date(workout.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.recentWorkoutExercises}>
                {workout.exercises.length} exercises
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recentWorkouts: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  recentWorkoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentWorkoutInfo: {
    flex: 1,
  },
  recentWorkoutName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: 4,
  },
  recentWorkoutDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recentWorkoutExercises: {
    fontSize: 12,
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bottomSpacing: {
    height: 40,
  },
});
