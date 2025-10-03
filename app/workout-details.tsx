import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFitnessStore } from '@/store/fitness-store';
import { ArrowLeft, Calendar, Clock, User, Share2, MessageSquare, X } from 'lucide-react-native';
import { colors } from '@/constants/branding';

export default function WorkoutDetails() {
  const router = useRouter();
  const { workoutId } = useLocalSearchParams();
  const { workouts, clients, measurementSettings, updateWorkout } = useFitnessStore();
  const [commentModalVisible, setCommentModalVisible] = useState<boolean>(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  
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

  const handleOpenCommentModal = (exerciseId: string, currentComment?: string) => {
    setSelectedExerciseId(exerciseId);
    setCommentText(currentComment || '');
    setCommentModalVisible(true);
  };

  const handleSaveComment = () => {
    if (!workout || !selectedExerciseId) return;

    const updatedExercises = workout.exercises.map(ex => 
      ex.id === selectedExerciseId 
        ? { ...ex, comments: commentText.trim() || undefined }
        : ex
    );

    updateWorkout(workout.id, { exercises: updatedExercises });
    setCommentModalVisible(false);
    setSelectedExerciseId(null);
    setCommentText('');
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
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                <TouchableOpacity 
                  onPress={() => handleOpenCommentModal(exercise.id, exercise.comments)}
                  style={styles.commentButton}
                >
                  <MessageSquare 
                    size={20} 
                    color={exercise.comments ? colors.primary : colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
              
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

              {exercise.comments && (
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsLabel}>Comments:</Text>
                  <Text style={styles.commentsText}>{exercise.comments}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Comment</Text>
              <TouchableOpacity 
                onPress={() => setCommentModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add your comments about this exercise..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity 
                onPress={() => setCommentModalVisible(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveComment}
                style={[styles.modalButton, styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentButton: {
    padding: 8,
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  commentsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  commentsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});