import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFitnessStore } from '@/store/fitness-store';
import { ArrowLeft, Calendar, Clock, User, Share2 } from 'lucide-react-native';
import { colors } from '@/constants/branding';

export default function WorkoutDetails() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  const { workouts, clients, measurementSettings } = useFitnessStore();
  
  const workout = workouts.find(w => w.id === workoutId);
  const client = workout ? clients.find(c => c.id === workout.clientId) : null;

  if (!workout) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout Not Found</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const calculateDuration = () => {
    if (!workout.duration) return 'Not recorded';
    const hours = Math.floor(workout.duration / 60);
    const minutes = workout.duration % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const generateWorkoutSummary = () => {
    let summary = `🏋️ Workout Summary\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    summary += `📋 ${workout.name}\n`;
    summary += `👤 Client: ${client?.name || 'Unknown'}\n`;
    summary += `📅 Date: ${formatDate(workout.date)}\n`;
    summary += `⏱️ Duration: ${calculateDuration()}\n\n`;
    
    if (workout.notes) {
      summary += `📝 Notes: ${workout.notes}\n\n`;
    }
    
    summary += `💪 Exercises:\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    workout.exercises.forEach((exercise, index) => {
      summary += `${index + 1}. ${exercise.exercise.name}\n`;
      exercise.sets.forEach((set, setIndex) => {
        summary += `   Set ${setIndex + 1}: `;
        if (set.weight !== undefined) {
          summary += `${set.weight} ${measurementSettings.weightUnit === 'imperial' ? 'lbs' : 'kg'}`;
        }
        if (set.reps !== undefined) {
          summary += ` × ${set.reps} reps`;
        }
        summary += `\n`;
      });
      if (exercise.notes) {
        summary += `   Notes: ${exercise.notes}\n`;
      }
      summary += `\n`;
    });
    
    summary += `━━━━━━━━━━━━━━━━━━━━\n`;
    summary += `Completed with FitTracker Pro 💪`;
    
    return summary;
  };

  const handleShare = async () => {
    try {
      const message = generateWorkoutSummary();
      
      if (Platform.OS === 'web') {
        // Web share API or fallback to clipboard
        if (navigator.share) {
          await navigator.share({
            title: `Workout: ${workout.name}`,
            text: message,
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(message);
          alert('Workout summary copied to clipboard!');
        }
      } else {
        // Mobile share
        await Share.share({
          message,
          title: `Workout: ${workout.name}`,
        });
      }
    } catch (error) {
      console.error('Error sharing workout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Share2 size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.workoutName}>{workout.name}</Text>
          
          <View style={styles.infoRow}>
            <User size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>{client?.name || 'Unknown Client'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>{formatDate(workout.date)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {formatTime(workout.date)} • {calculateDuration()}
            </Text>
          </View>

          {workout.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          
          {workout.exercises.map((exercise, index) => (
            <View key={`exercise-${exercise.id}`} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
              
              <View style={styles.setsContainer}>
                {exercise.sets.map((set, setIndex) => (
                  <View key={`set-${set.id}`} style={styles.setRow}>
                    <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                    <View style={styles.setDetails}>
                      {set.weight !== undefined && (
                        <Text style={styles.setText}>
                          {set.weight} {measurementSettings.weightUnit === 'imperial' ? 'lbs' : 'kg'}
                        </Text>
                      )}
                      {set.reps !== undefined && (
                        <Text style={styles.setText}>× {set.reps} reps</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {exercise.notes && (
                <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  shareButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  workoutName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  exercisesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  setsContainer: {
    marginTop: 8,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  setDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  exerciseNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
});