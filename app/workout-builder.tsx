import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { 
  Plus, 
  Minus, 
  X, 
  Save, 
  Play, 
  Pause, 
  RotateCcw,
  Clock,
  Dumbbell,
  FileText,
  Users,
  VideoIcon
} from 'lucide-react-native';
import { useFitnessStore } from '@/store/fitness-store';
import type { Exercise, WorkoutExercise, WorkoutSet, WorkoutTemplate } from '@/types';
import VideoRecorder from '@/components/VideoRecorder';
import AddExerciseModal from '@/components/AddExerciseModal';
import { colors } from '@/constants/branding';

export default function WorkoutBuilderScreen() {
  const params = useLocalSearchParams();
  const clientIds = (params.clientIds as string)?.split(',') || [];
  const clientNames = (params.clientNames as string) || '';
  const date = params.date as string;
  const isMultiClient = params.isMultiClient === 'true';

  const { 
    exercises, 
    workoutTemplates,
    clients,
    addWorkout, 
    addExercise: addExerciseToStore,
    checkAndAddPersonalRecord,
    addVideoRecord,
    loadData 
  } = useFitnessStore();

  const [workoutName, setWorkoutName] = useState<string>('');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState<boolean>(false);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [showAddCustomExerciseModal, setShowAddCustomExerciseModal] = useState<boolean>(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [currentSetTimer, setCurrentSetTimer] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [showVideoRecorder, setShowVideoRecorder] = useState<boolean>(false);
  const [recordingSetInfo, setRecordingSetInfo] = useState<{
    exerciseId: string;
    setId: string;
    clientId: string;
    exerciseName: string;
    clientName: string;
  } | null>(null);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
    const workoutTitle = isMultiClient 
      ? `Multi-Client Workout - ${new Date(date).toLocaleDateString()}`
      : `${clientNames}'s Workout - ${new Date(date).toLocaleDateString()}`;
    setWorkoutName(workoutTitle);
  }, [loadData, clientNames, date, isMultiClient]);

  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const startWorkout = () => {
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());
  };

  const pauseWorkout = () => {
    setIsWorkoutActive(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const startSetTimer = (restTime: number = 60) => {
    setCurrentSetTimer(restTime);
    
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    const interval = setInterval(() => {
      setCurrentSetTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerInterval(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  const addExerciseFromTemplate = (template: WorkoutTemplate) => {
    const newExercises: WorkoutExercise[] = template.exercises.map(templateEx => ({
      id: Date.now().toString() + Math.random(),
      exerciseId: templateEx.exerciseId,
      exercise: templateEx.exercise,
      sets: templateEx.sets.map(templateSet => ({
        id: Date.now().toString() + Math.random(),
        reps: templateSet.reps,
        weight: templateSet.weight || 0,
        restTime: templateSet.restTime || 60,
      })),
    }));

    setWorkoutExercises([...workoutExercises, ...newExercises]);
    setShowTemplateModal(false);
  };

  const addExercise = (exercise: Exercise) => {
    const newWorkoutExercise: WorkoutExercise = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exercise,
      sets: [
        {
          id: Date.now().toString(),
          reps: 10,
          weight: 0,
          restTime: 60,
          clientWeights: isMultiClient ? clientIds.map(clientId => ({
            clientId,
            weight: 0,
            reps: 10,
          })) : undefined,
        }
      ],
    };

    setWorkoutExercises([...workoutExercises, newWorkoutExercise]);
    setShowExerciseModal(false);
  };

  const removeExercise = (exerciseId: string) => {
    setWorkoutExercises(workoutExercises.filter(ex => ex.id !== exerciseId));
  };

  const addSet = (exerciseId: string) => {
    setWorkoutExercises(workoutExercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: Date.now().toString(),
          reps: lastSet?.reps || 10,
          weight: lastSet?.weight || 0,
          restTime: lastSet?.restTime || 60,
          clientWeights: isMultiClient ? clientIds.map(clientId => {
            const lastClientWeight = lastSet?.clientWeights?.find(cw => cw.clientId === clientId);
            return {
              clientId,
              weight: lastClientWeight?.weight || 0,
              reps: lastClientWeight?.reps || 10,
            };
          }) : undefined,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setWorkoutExercises(workoutExercises.map(ex => {
      if (ex.id === exerciseId) {
        return { ...ex, sets: ex.sets.filter(set => set.id !== setId) };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: number) => {
    setWorkoutExercises(workoutExercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId) {
              return { ...set, [field]: value };
            }
            return set;
          })
        };
      }
      return ex;
    }));
  };

  const updateClientWeight = (exerciseId: string, setId: string, clientId: string, weight: number) => {
    setWorkoutExercises(workoutExercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId && set.clientWeights) {
              return {
                ...set,
                clientWeights: set.clientWeights.map(cw => 
                  cw.clientId === clientId ? { ...cw, weight } : cw
                )
              };
            }
            return set;
          })
        };
      }
      return ex;
    }));
  };

  const updateClientReps = (exerciseId: string, setId: string, clientId: string, reps: number) => {
    setWorkoutExercises(workoutExercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId && set.clientWeights) {
              return {
                ...set,
                clientWeights: set.clientWeights.map(cw => 
                  cw.clientId === clientId ? { ...cw, reps } : cw
                )
              };
            }
            return set;
          })
        };
      }
      return ex;
    }));
  };

  const completeSet = (exerciseId: string, setId: string) => {
    const exercise = workoutExercises.find(ex => ex.id === exerciseId);
    const set = exercise?.sets.find(s => s.id === setId);
    
    if (set && exercise) {
      if (isMultiClient && set.clientWeights) {
        set.clientWeights.forEach(clientWeight => {
          const volume = clientWeight.weight * clientWeight.reps;
          const hasNewPR = checkAndAddPersonalRecord(
            clientWeight.clientId,
            exercise.exerciseId,
            clientWeight.weight,
            volume,
            'temp-workout-id',
            clientWeight.videoUri
          );

          if (hasNewPR) {
            const clientName = clients.find(c => c.id === clientWeight.clientId)?.name || 'Client';
            Alert.alert('🎉 Personal Record!', `${clientName} achieved a new personal best!`);
          }
        });
      } else {
        const targetClientId = clientIds[0];
        const volume = set.weight * set.reps;
        const hasNewPR = checkAndAddPersonalRecord(
          targetClientId,
          exercise.exerciseId,
          set.weight,
          volume,
          'temp-workout-id',
          set.videoUri
        );

        if (hasNewPR) {
          const clientName = clients.find(c => c.id === targetClientId)?.name || 'Client';
          Alert.alert('🎉 Personal Record!', `${clientName} achieved a new personal best!`);
        }
      }

      startSetTimer(set.restTime || 60);
    }
  };

  const startVideoRecording = (exerciseId: string, setId: string, clientId: string) => {
    const exercise = workoutExercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const client = clients.find(c => c.id === clientId);
    
    setRecordingSetInfo({
      exerciseId,
      setId,
      clientId,
      exerciseName: exercise.exercise.name,
      clientName: client?.name || 'Client',
    });
    setShowVideoRecorder(true);
  };

  const handleVideoRecorded = (videoUri: string) => {
    if (!recordingSetInfo) return;

    setWorkoutExercises(workoutExercises.map(ex => {
      if (ex.id === recordingSetInfo.exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === recordingSetInfo.setId) {
              if (isMultiClient && set.clientWeights) {
                return {
                  ...set,
                  clientWeights: set.clientWeights.map(cw =>
                    cw.clientId === recordingSetInfo.clientId 
                      ? { ...cw, videoUri }
                      : cw
                  )
                };
              } else {
                return { ...set, videoUri };
              }
            }
            return set;
          })
        };
      }
      return ex;
    }));

    const exercise = workoutExercises.find(ex => ex.id === recordingSetInfo.exerciseId);
    const set = exercise?.sets.find(s => s.id === recordingSetInfo.setId);

    if (set && exercise) {
      const weight = isMultiClient && set.clientWeights
        ? set.clientWeights.find(cw => cw.clientId === recordingSetInfo.clientId)?.weight || 0
        : set.weight;
      
      const reps = isMultiClient && set.clientWeights
        ? set.clientWeights.find(cw => cw.clientId === recordingSetInfo.clientId)?.reps || 0
        : set.reps;

      addVideoRecord({
        clientId: recordingSetInfo.clientId,
        exerciseId: exercise.exerciseId,
        workoutId: 'temp-workout-id',
        setId: recordingSetInfo.setId,
        videoUri,
        weight,
        reps,
      });
    }

    setRecordingSetInfo(null);
  };

  const saveWorkout = () => {
    if (!workoutName.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    if (workoutExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    const duration = workoutStartTime 
      ? Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60)
      : undefined;

    if (isMultiClient) {
      const selectedClients = clients.filter(c => clientIds.includes(c.id));
      
      selectedClients.forEach(client => {
        const clientExercises = workoutExercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(set => {
            const clientWeight = set.clientWeights?.find(cw => cw.clientId === client.id);
            return {
              ...set,
              reps: clientWeight?.reps || set.reps,
              weight: clientWeight?.weight || 0,
              videoUri: clientWeight?.videoUri,
              clientWeights: undefined,
            };
          }),
        }));

        const clientTotalVolume = clientExercises.reduce((total, ex) => {
          return total + ex.sets.reduce((setTotal, set) => {
            return setTotal + (set.weight * set.reps);
          }, 0);
        }, 0);

        const clientWorkout = {
          clientId: client.id,
          client,
          name: `${client.name}'s ${workoutName.trim()}`,
          date,
          exercises: clientExercises,
          duration,
          totalVolume: clientTotalVolume,
          isMultiClient: true,
          clients: selectedClients,
        };

        addWorkout(clientWorkout);
      });
    } else {
      const totalVolume = workoutExercises.reduce((total, ex) => {
        return total + ex.sets.reduce((setTotal, set) => {
          return setTotal + (set.weight * set.reps);
        }, 0);
      }, 0);

      const workout = {
        clientId: clientIds[0],
        client: clients.find(c => c.id === clientIds[0]) || { id: clientIds[0], name: clientNames } as any,
        name: workoutName.trim(),
        date,
        exercises: workoutExercises,
        duration,
        totalVolume,
      };
      
      addWorkout(workout);
    }

    Alert.alert(
      'Workout Saved!',
      isMultiClient 
        ? `Workouts saved for ${clientIds.length} clients successfully.`
        : 'The workout has been saved successfully.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const renderSet = (set: WorkoutSet, exerciseId: string, setIndex: number) => (
    <View key={set.id} style={styles.setRow}>
      <View style={styles.setNumberContainer}>
        <Text style={styles.setNumber}>{setIndex + 1}</Text>
      </View>
      
      <View style={styles.setInputsContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            style={styles.setInput}
            value={set.reps.toString()}
            onChangeText={(text) => updateSet(exerciseId, set.id, 'reps', parseInt(text) || 0)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9ca3af"
            selectTextOnFocus
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Rest</Text>
          <TextInput
            style={styles.setInput}
            value={set.restTime?.toString() || '60'}
            onChangeText={(text) => updateSet(exerciseId, set.id, 'restTime', parseInt(text) || 60)}
            keyboardType="numeric"
            placeholder="60"
            placeholderTextColor="#9ca3af"
            selectTextOnFocus
          />
        </View>
      </View>

      {isMultiClient && set.clientWeights ? (
        <View style={styles.multiClientWeightsContainer}>
          {set.clientWeights.map((clientWeight) => {
            const client = clients.find(c => c.id === clientWeight.clientId);
            return (
              <View key={clientWeight.clientId} style={styles.clientWeightRow}>
                <Text style={styles.clientWeightLabel}>{client?.name || 'Client'}</Text>
                <View style={styles.clientInputsRow}>
                  <View style={styles.clientWeightInputContainer}>
                    <Text style={styles.clientInputLabel}>kg</Text>
                    <TextInput
                      style={styles.clientWeightInput}
                      value={clientWeight.weight.toString()}
                      onChangeText={(text) => updateClientWeight(exerciseId, set.id, clientWeight.clientId, parseFloat(text) || 0)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      selectTextOnFocus
                    />
                  </View>
                  <View style={styles.clientWeightInputContainer}>
                    <Text style={styles.clientInputLabel}>reps</Text>
                    <TextInput
                      style={styles.clientWeightInput}
                      value={clientWeight.reps.toString()}
                      onChangeText={(text) => updateClientReps(exerciseId, set.id, clientWeight.clientId, parseInt(text) || 0)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                      selectTextOnFocus
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.clientVideoButton,
                      clientWeight.videoUri && styles.clientVideoButtonActive
                    ]}
                    onPress={() => startVideoRecording(exerciseId, set.id, clientWeight.clientId)}
                  >
                    <VideoIcon color={clientWeight.videoUri ? "#10b981" : "#6b7280"} size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.singleClientWeightContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight</Text>
            <TextInput
              style={styles.setInput}
              value={set.weight.toString()}
              onChangeText={(text) => updateSet(exerciseId, set.id, 'weight', parseFloat(text) || 0)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#9ca3af"
              selectTextOnFocus
            />
          </View>
        </View>
      )}

      <View style={styles.setActions}>
        {!isMultiClient && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.videoButton,
              set.videoUri && styles.videoButtonActive
            ]}
            onPress={() => startVideoRecording(exerciseId, set.id, clientIds[0])}
          >
            <VideoIcon color={set.videoUri ? "#10b981" : "#6b7280"} size={18} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={() => completeSet(exerciseId, set.id)}
        >
          <Text style={styles.completeButtonText}>✓</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.removeSetButton]}
          onPress={() => removeSet(exerciseId, set.id)}
        >
          <Minus color="#ffffff" size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExercise = ({ item }: { item: WorkoutExercise }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.exercise.name}</Text>
          <Text style={styles.exerciseCategory}>{item.exercise.category}</Text>
        </View>
        <View style={styles.exerciseActions}>
          <TouchableOpacity
            style={styles.addSetButton}
            onPress={() => addSet(item.id)}
          >
            <Plus color="#6366f1" size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeExerciseButton}
            onPress={() => removeExercise(item.id)}
          >
            <X color="#ffffff" size={16} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.setsContainer}>
        {item.sets.map((set, index) => renderSet(set, item.id, index))}
      </View>
    </View>
  );

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => addExercise(item)}
    >
      <View style={styles.exerciseItemInfo}>
        <Text style={styles.exerciseItemName}>{item.name}</Text>
        <Text style={styles.exerciseItemCategory}>{item.category}</Text>
      </View>
      <Plus color="#6366f1" size={20} />
    </TouchableOpacity>
  );

  const renderTemplateItem = ({ item }: { item: WorkoutTemplate }) => (
    <TouchableOpacity
      style={styles.templateItem}
      onPress={() => addExerciseFromTemplate(item)}
    >
      <View style={styles.templateItemInfo}>
        <Text style={styles.templateItemName}>{item.name}</Text>
        <Text style={styles.templateItemDescription}>
          {item.exercises.length} exercises
        </Text>
      </View>
      <Plus color="#6366f1" size={20} />
    </TouchableOpacity>
  );

  const filteredExercises = exercises.filter(exercise => 
    exercise.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
    exercise.muscleGroups?.some(muscle => 
      muscle.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
    )
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Workout Builder',
          headerRight: () => (
            <TouchableOpacity onPress={saveWorkout} style={styles.saveButton}>
              <Save color="#6366f1" size={20} />
            </TouchableOpacity>
          ),
        }} 
      />

      <View style={styles.header}>
        <TextInput
          style={styles.workoutNameInput}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Workout name"
          placeholderTextColor="#9ca3af"
        />
        
        <View style={styles.workoutControls}>
          {!isWorkoutActive ? (
            <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
              <Play color="#ffffff" size={16} />
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.pauseButton} onPress={pauseWorkout}>
              <Pause color="#ffffff" size={16} />
              <Text style={styles.pauseButtonText}>Pause</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {currentSetTimer > 0 && (
        <View style={styles.timerContainer}>
          <Clock color="#6366f1" size={20} />
          <Text style={styles.timerText}>Rest: {currentSetTimer}s</Text>
          <TouchableOpacity
            style={styles.resetTimerButton}
            onPress={() => {
              if (timerInterval) {
                clearInterval(timerInterval);
                setTimerInterval(null);
              }
              setCurrentSetTimer(0);
            }}
          >
            <RotateCcw color="#6b7280" size={16} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.addExerciseButtons}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowTemplateModal(true)}
        >
          <FileText color="#6366f1" size={16} />
          <Text style={styles.addButtonText}>From Template</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowExerciseModal(true)}
        >
          {isMultiClient ? <Users color="#6366f1" size={16} /> : <Plus color="#6366f1" size={16} />}
          <Text style={styles.addButtonText}>
            {isMultiClient ? 'Add Exercise' : 'Add Exercise'}
          </Text>
        </TouchableOpacity>
      </View>

      {workoutExercises.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Dumbbell color="#9ca3af" size={64} />
          <Text style={styles.emptyTitle}>No exercises added</Text>
          <Text style={styles.emptyText}>
            Add exercises from templates or individually to build your workout
          </Text>
        </View>
      ) : (
        <FlatList
          data={workoutExercises}
          renderItem={renderExercise}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.exercisesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onShow={() => setExerciseSearchQuery('')}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Exercise</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowExerciseModal(false);
                setExerciseSearchQuery('');
              }}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                value={exerciseSearchQuery}
                onChangeText={setExerciseSearchQuery}
                placeholder="🔍 Search exercises by name, category, or muscle group..."
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
              />
              {exerciseSearchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setExerciseSearchQuery('')}
                >
                  <X color="#6b7280" size={16} />
                </TouchableOpacity>
              )}
            </View>
            {exerciseSearchQuery.length > 0 && (
              <Text style={styles.searchResultsText}>
                {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.createCustomButton}
            onPress={() => {
              setShowExerciseModal(false);
              setShowAddCustomExerciseModal(true);
              setExerciseSearchQuery('');
            }}
          >
            <Plus color="#6366f1" size={20} />
            <Text style={styles.createCustomButtonText}>Create Custom Exercise</Text>
          </TouchableOpacity>
          
          {filteredExercises.length === 0 ? (
            <View style={styles.emptySearchContainer}>
              <Text style={styles.emptySearchTitle}>
                {exerciseSearchQuery ? 'No exercises found' : 'No exercises available'}
              </Text>
              <Text style={styles.emptySearchText}>
                {exerciseSearchQuery 
                  ? `Try searching for "${exerciseSearchQuery}" with different terms`
                  : 'Add exercises to your library to see them here'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              renderItem={renderExerciseItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showTemplateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Template</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTemplateModal(false)}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>
          
          {workoutTemplates.length === 0 ? (
            <View style={styles.emptyModalContainer}>
              <FileText color="#9ca3af" size={64} />
              <Text style={styles.emptyModalTitle}>No templates available</Text>
              <Text style={styles.emptyModalText}>
                Create workout templates to quickly add exercise groups
              </Text>
            </View>
          ) : (
            <FlatList
              data={workoutTemplates}
              renderItem={renderTemplateItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>

      <VideoRecorder
        visible={showVideoRecorder}
        onClose={() => {
          setShowVideoRecorder(false);
          setRecordingSetInfo(null);
        }}
        onVideoRecorded={handleVideoRecorded}
        clientName={recordingSetInfo?.clientName}
        exerciseName={recordingSetInfo?.exerciseName}
      />

      <AddExerciseModal
        visible={showAddCustomExerciseModal}
        onClose={() => setShowAddCustomExerciseModal(false)}
        onAdd={(exerciseData) => {
          addExerciseToStore(exerciseData);
          
          const newExercise = {
            ...exerciseData,
            id: Date.now().toString(),
          } as Exercise;
          
          addExercise(newExercise);
          setShowAddCustomExerciseModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  workoutNameInput: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginBottom: 12,
    padding: 0,
  },
  workoutControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pauseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: colors.primary,
    marginHorizontal: 8,
  },
  resetTimerButton: {
    padding: 4,
  },
  addExerciseButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
    marginLeft: 4,
  },
  exercisesList: {
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addSetButton: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  removeExerciseButton: {
    backgroundColor: colors.error,
    padding: 8,
    borderRadius: 20,
  },
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  setRow: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setNumberContainer: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  setNumber: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.white,
  },
  setInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  setInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    height: 40,
    width: '100%',
    minWidth: 0,
  },
  multiClientWeightsContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientWeightRow: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  clientWeightLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  clientInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientWeightInputContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  clientInputLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
  },
  clientWeightInput: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    padding: 0,
  },
  clientVideoButton: {
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientVideoButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  singleClientWeightContainer: {
    marginBottom: 12,
  },
  setActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    minHeight: 36,
  },
  videoButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  removeSetButton: {
    backgroundColor: colors.error,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  saveButton: {
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalList: {
    padding: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseItemInfo: {
    flex: 1,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  exerciseItemCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateItemInfo: {
    flex: 1,
  },
  templateItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  templateItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyModalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyModalText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  createCustomButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primary,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 45,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
  },
  searchResultsText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
    fontWeight: '600' as const,
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
