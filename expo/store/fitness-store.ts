import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { Client, Exercise, Workout, PersonalRecord, WorkoutTemplate, VideoRecord, ClientPhoto, BodyWeight } from '@/types';
import { DEFAULT_EXERCISES } from '@/constants/exercises';

// Cloud sync functions
const syncWithCloud = async (userId: string, data: any, dataType: string) => {
  try {
    // In a real implementation, this would sync with your backend
    console.log(`Syncing ${dataType} for user ${userId}:`, data);
    
    // For now, we'll just store locally with user prefix
    const userKey = `user_${userId}_${dataType}`;
    await AsyncStorage.setItem(userKey, JSON.stringify(data));
    
    // You would implement actual API calls here:
    // await fetch(`/api/users/${userId}/${dataType}`, {
    //   method: 'POST',
    //   body: JSON.stringify(data)
    // });
  } catch (error) {
    console.error(`Error syncing ${dataType}:`, error);
  }
};

const loadFromCloud = async (userId: string, dataType: string) => {
  try {
    // In a real implementation, this would load from your backend
    const userKey = `user_${userId}_${dataType}`;
    const data = await AsyncStorage.getItem(userKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error loading ${dataType}:`, error);
    return null;
  }
};

export type MeasurementUnit = 'metric' | 'imperial';

export interface MeasurementSettings {
  weightUnit: MeasurementUnit;
  distanceUnit: MeasurementUnit;
}

interface FitnessStore {
  clients: Client[];
  exercises: Exercise[];
  workouts: Workout[];
  personalRecords: PersonalRecord[];
  workoutTemplates: WorkoutTemplate[];
  videoRecords: VideoRecord[];
  measurementSettings: MeasurementSettings;
  isLoading: boolean;
  currentUserId: string | null;
  
  // Actions
  loadData: (userId?: string) => Promise<void>;
  setCurrentUser: (userId: string | null) => void;
  syncAllData: () => Promise<void>;
  
  // Client actions
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Client photo actions
  addClientPhoto: (clientId: string, photo: Omit<ClientPhoto, 'id'>) => void;
  deleteClientPhoto: (clientId: string, photoId: string) => void;
  
  // Body weight actions
  addBodyWeight: (clientId: string, weight: Omit<BodyWeight, 'id'>) => void;
  updateBodyWeight: (clientId: string, weightId: string, updates: Partial<BodyWeight>) => void;
  deleteBodyWeight: (clientId: string, weightId: string) => void;
  
  // Exercise actions
  addExercise: (exercise: Omit<Exercise, 'id'>) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  
  // Workout actions
  addWorkout: (workout: Omit<Workout, 'id'>) => void;
  updateWorkout: (id: string, updates: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  
  // Template actions
  addWorkoutTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt'>) => void;
  updateWorkoutTemplate: (id: string, updates: Partial<WorkoutTemplate>) => void;
  deleteWorkoutTemplate: (id: string) => void;
  
  // PR actions
  checkAndAddPersonalRecord: (clientId: string, exerciseId: string, weight: number, volume: number, workoutId: string, videoUri?: string) => boolean;
  getClientPersonalRecords: (clientId: string) => PersonalRecord[];
  deletePersonalRecord: (id: string) => void;
  
  // Video actions
  addVideoRecord: (videoRecord: Omit<VideoRecord, 'id' | 'date'>) => void;
  getClientVideoRecords: (clientId: string, exerciseId?: string) => VideoRecord[];
  deleteVideoRecord: (id: string) => void;
  
  // Measurement actions
  updateMeasurementSettings: (settings: Partial<MeasurementSettings>) => void;
  convertWeight: (weight: number, from: MeasurementUnit, to: MeasurementUnit) => number;
  convertDistance: (distance: number, from: MeasurementUnit, to: MeasurementUnit) => number;
  formatWeight: (weight: number) => string;
  formatDistance: (distance: number) => string;
}

export const useFitnessStore = create<FitnessStore>((set, get) => ({
  clients: [],
  exercises: DEFAULT_EXERCISES,
  workouts: [],
  personalRecords: [],
  workoutTemplates: [],
  videoRecords: [],
  measurementSettings: {
    weightUnit: 'metric',
    distanceUnit: 'metric',
  },
  isLoading: true,
  currentUserId: null,
  
  loadData: async (userId?: string) => {
    try {
      const { currentUserId } = get();
      const userIdToUse = userId || currentUserId;
      
      if (!userIdToUse) {
        // Load default data if no user
        set({
          clients: [],
          exercises: DEFAULT_EXERCISES,
          workouts: [],
          personalRecords: [],
          workoutTemplates: [],
          videoRecords: [],
          measurementSettings: {
            weightUnit: 'metric',
            distanceUnit: 'metric',
          },
          isLoading: false,
        });
        return;
      }

      // Try to load from cloud first, fallback to local storage
      const [cloudClients, cloudExercises, cloudWorkouts, cloudPRs, cloudTemplates, cloudVideos, cloudSettings] = await Promise.all([
        loadFromCloud(userIdToUse, 'fitness_clients'),
        loadFromCloud(userIdToUse, 'fitness_exercises'),
        loadFromCloud(userIdToUse, 'fitness_workouts'),
        loadFromCloud(userIdToUse, 'fitness_personal_records'),
        loadFromCloud(userIdToUse, 'fitness_workout_templates'),
        loadFromCloud(userIdToUse, 'fitness_video_records'),
        loadFromCloud(userIdToUse, 'fitness_measurement_settings'),
      ]);
      
      // Fallback to legacy local storage if cloud data doesn't exist
      const [localClients, localExercises, localWorkouts, localPRs, localTemplates, localVideos, localSettings] = await Promise.all([
        AsyncStorage.getItem('fitness_clients'),
        AsyncStorage.getItem('fitness_exercises'),
        AsyncStorage.getItem('fitness_workouts'),
        AsyncStorage.getItem('fitness_personal_records'),
        AsyncStorage.getItem('fitness_workout_templates'),
        AsyncStorage.getItem('fitness_video_records'),
        AsyncStorage.getItem('fitness_measurement_settings'),
      ]);
      
      const workoutsData: Workout[] = cloudWorkouts || (localWorkouts ? JSON.parse(localWorkouts) : []);
      const uniqueWorkouts: Workout[] = Array.from(
        new Map(workoutsData.map((w: Workout) => [w.id, w])).values()
      );
      
      set({
        clients: cloudClients || (localClients ? JSON.parse(localClients) : []),
        exercises: cloudExercises || (localExercises ? JSON.parse(localExercises) : DEFAULT_EXERCISES),
        workouts: uniqueWorkouts,
        personalRecords: cloudPRs || (localPRs ? JSON.parse(localPRs) : []),
        workoutTemplates: cloudTemplates || (localTemplates ? JSON.parse(localTemplates) : []),
        videoRecords: cloudVideos || (localVideos ? JSON.parse(localVideos) : []),
        measurementSettings: cloudSettings || (localSettings ? JSON.parse(localSettings) : {
          weightUnit: 'metric',
          distanceUnit: 'metric',
        }),
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading fitness data:', error);
      set({ isLoading: false });
    }
  },
  
  setCurrentUser: (userId) => {
    set({ currentUserId: userId });
    if (userId) {
      get().loadData(userId);
    }
  },
  
  syncAllData: async () => {
    const { currentUserId, clients, exercises, workouts, personalRecords, workoutTemplates, videoRecords, measurementSettings } = get();
    
    if (!currentUserId) return;
    
    await Promise.all([
      syncWithCloud(currentUserId, clients, 'fitness_clients'),
      syncWithCloud(currentUserId, exercises, 'fitness_exercises'),
      syncWithCloud(currentUserId, workouts, 'fitness_workouts'),
      syncWithCloud(currentUserId, personalRecords, 'fitness_personal_records'),
      syncWithCloud(currentUserId, workoutTemplates, 'fitness_workout_templates'),
      syncWithCloud(currentUserId, videoRecords, 'fitness_video_records'),
      syncWithCloud(currentUserId, measurementSettings, 'fitness_measurement_settings'),
    ]);
  },
  
  addClient: (clientData) => {
    const { currentUserId } = get();
    const newClient: Client = {
      ...clientData,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedClients = [...get().clients, newClient];
    set({ clients: updatedClients });
    AsyncStorage.setItem('fitness_clients', JSON.stringify(updatedClients));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedClients, 'fitness_clients');
    }
  },
  
  updateClient: (id, updates) => {
    const { currentUserId } = get();
    const updatedClients = get().clients.map(client =>
      client.id === id ? { ...client, ...updates } : client
    );
    set({ clients: updatedClients });
    AsyncStorage.setItem('fitness_clients', JSON.stringify(updatedClients));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedClients, 'fitness_clients');
    }
  },
  
  deleteClient: (id) => {
    const { currentUserId } = get();
    const updatedClients = get().clients.filter(client => client.id !== id);
    set({ clients: updatedClients });
    AsyncStorage.setItem('fitness_clients', JSON.stringify(updatedClients));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedClients, 'fitness_clients');
    }
  },
  
  addClientPhoto: (clientId, photoData) => {
    const { currentUserId } = get();
    const newPhoto: ClientPhoto = {
      ...photoData,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedClients = get().clients.map(client => {
      if (client.id === clientId) {
        const photos = client.photos || [];
        return { ...client, photos: [...photos, newPhoto] };
      }
      return client;
    });
    
    set({ clients: updatedClients });
    AsyncStorage.setItem('fitness_clients', JSON.stringify(updatedClients));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedClients, 'fitness_clients');
    }
  },
  
  deleteClientPhoto: (clientId, photoId) => {
    const { currentUserId } = get();
    const updatedClients = get().clients.map(client => {
      if (client.id === clientId) {
        const photos = (client.photos || []).filter(p => p.id !== photoId);
        return { ...client, photos };
      }
      return client;
    });
    
    set({ clients: updatedClients });
    AsyncStorage.setItem('fitness_clients', JSON.stringify(updatedClients));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedClients, 'fitness_clients');
    }
  },
  
  addBodyWeight: (clientId, weightData) => {
    const { currentUserId } = get();
    const newWeight: BodyWeight = {
      ...weightData,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedClients = get().clients.map(client => {
      if (client.id === clientId) {
        const bodyWeights = client.bodyWeights || [];
        return { ...client, bodyWeights: [...bodyWeights, newWeight].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )};
      }
      return client;
    });
    
    set({ clients: updatedClients });
    AsyncStorage.setItem('fitness_clients', JSON.stringify(updatedClients));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedClients, 'fitness_clients');
    }
  },
  
  updateBodyWeight: (clientId, weightId, updates) => {
    const { currentUserId } = get();
    const updatedClients = get().clients.map(client => {
      if (client.id === clientId) {
        const bodyWeights = (client.bodyWeights || []).map(w => 
          w.id === weightId ? { ...w, ...updates } : w
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return { ...client, bodyWeights };
      }
      return client;
    });
    
    set({ clients: updatedClients });
    AsyncStorage.setItem('fitness_clients', JSON.stringify(updatedClients));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedClients, 'fitness_clients');
    }
  },
  
  deleteBodyWeight: (clientId, weightId) => {
    const { currentUserId } = get();
    const updatedClients = get().clients.map(client => {
      if (client.id === clientId) {
        const bodyWeights = (client.bodyWeights || []).filter(w => w.id !== weightId);
        return { ...client, bodyWeights };
      }
      return client;
    });
    
    set({ clients: updatedClients });
    AsyncStorage.setItem('fitness_clients', JSON.stringify(updatedClients));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedClients, 'fitness_clients');
    }
  },
  
  addExercise: (exerciseData) => {
    const { currentUserId } = get();
    const newExercise: Exercise = {
      ...exerciseData,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedExercises = [...get().exercises, newExercise];
    set({ exercises: updatedExercises });
    AsyncStorage.setItem('fitness_exercises', JSON.stringify(updatedExercises));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedExercises, 'fitness_exercises');
    }
  },
  
  updateExercise: (id, updates) => {
    const { currentUserId } = get();
    const updatedExercises = get().exercises.map(exercise =>
      exercise.id === id ? { ...exercise, ...updates } : exercise
    );
    set({ exercises: updatedExercises });
    AsyncStorage.setItem('fitness_exercises', JSON.stringify(updatedExercises));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedExercises, 'fitness_exercises');
    }
  },
  
  deleteExercise: (id) => {
    const { currentUserId } = get();
    const updatedExercises = get().exercises.filter(exercise => exercise.id !== id);
    set({ exercises: updatedExercises });
    AsyncStorage.setItem('fitness_exercises', JSON.stringify(updatedExercises));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedExercises, 'fitness_exercises');
    }
  },
  
  addWorkout: (workoutData) => {
    const { currentUserId } = get();
    const newWorkout: Workout = {
      ...workoutData,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedWorkouts = [...get().workouts, newWorkout];
    set({ workouts: updatedWorkouts });
    AsyncStorage.setItem('fitness_workouts', JSON.stringify(updatedWorkouts));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedWorkouts, 'fitness_workouts');
    }
  },
  
  updateWorkout: (id, updates) => {
    const { currentUserId } = get();
    const updatedWorkouts = get().workouts.map(workout =>
      workout.id === id ? { ...workout, ...updates } : workout
    );
    set({ workouts: updatedWorkouts });
    AsyncStorage.setItem('fitness_workouts', JSON.stringify(updatedWorkouts));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedWorkouts, 'fitness_workouts');
    }
  },
  
  deleteWorkout: (id) => {
    const { currentUserId } = get();
    const updatedWorkouts = get().workouts.filter(workout => workout.id !== id);
    set({ workouts: updatedWorkouts });
    AsyncStorage.setItem('fitness_workouts', JSON.stringify(updatedWorkouts));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedWorkouts, 'fitness_workouts');
    }
  },
  
  addWorkoutTemplate: (templateData) => {
    const { currentUserId } = get();
    const newTemplate: WorkoutTemplate = {
      ...templateData,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedTemplates = [...get().workoutTemplates, newTemplate];
    set({ workoutTemplates: updatedTemplates });
    AsyncStorage.setItem('fitness_workout_templates', JSON.stringify(updatedTemplates));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedTemplates, 'fitness_workout_templates');
    }
  },
  
  updateWorkoutTemplate: (id, updates) => {
    const { currentUserId } = get();
    const updatedTemplates = get().workoutTemplates.map(template =>
      template.id === id ? { ...template, ...updates } : template
    );
    set({ workoutTemplates: updatedTemplates });
    AsyncStorage.setItem('fitness_workout_templates', JSON.stringify(updatedTemplates));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedTemplates, 'fitness_workout_templates');
    }
  },
  
  deleteWorkoutTemplate: (id) => {
    const { currentUserId } = get();
    const updatedTemplates = get().workoutTemplates.filter(template => template.id !== id);
    set({ workoutTemplates: updatedTemplates });
    AsyncStorage.setItem('fitness_workout_templates', JSON.stringify(updatedTemplates));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedTemplates, 'fitness_workout_templates');
    }
  },
  
  checkAndAddPersonalRecord: (clientId, exerciseId, weight, volume, workoutId, videoUri) => {
    const { personalRecords, currentUserId } = get();
    const clientPRs = personalRecords.filter(pr => pr.clientId === clientId && pr.exerciseId === exerciseId);
    
    let newPRs: PersonalRecord[] = [];
    let hasNewPR = false;
    const baseTimestamp = Date.now();
    
    const maxWeightPR = clientPRs.find(pr => pr.type === 'max_weight');
    if (!maxWeightPR || weight > maxWeightPR.value) {
      newPRs.push({
        id: `${baseTimestamp}_${Math.random().toString(36).substr(2, 9)}_weight`,
        clientId,
        exerciseId,
        type: 'max_weight',
        value: weight,
        date: new Date().toISOString(),
        workoutId,
        videoUri,
      });
      hasNewPR = true;
    }
    
    const maxVolumePR = clientPRs.find(pr => pr.type === 'max_volume');
    if (!maxVolumePR || volume > maxVolumePR.value) {
      newPRs.push({
        id: `${baseTimestamp}_${Math.random().toString(36).substr(2, 9)}_volume`,
        clientId,
        exerciseId,
        type: 'max_volume',
        value: volume,
        date: new Date().toISOString(),
        workoutId,
        videoUri,
      });
      hasNewPR = true;
    }
    
    if (hasNewPR) {
      const updatedPRs = [...personalRecords.filter(pr => 
        !(pr.clientId === clientId && pr.exerciseId === exerciseId)
      ), ...newPRs];
      
      set({ personalRecords: updatedPRs });
      AsyncStorage.setItem('fitness_personal_records', JSON.stringify(updatedPRs));
      
      if (currentUserId) {
        syncWithCloud(currentUserId, updatedPRs, 'fitness_personal_records');
      }
    }
    
    return hasNewPR;
  },
  
  getClientPersonalRecords: (clientId) => {
    const { personalRecords } = get();
    return personalRecords.filter(pr => pr.clientId === clientId);
  },
  
  deletePersonalRecord: (id) => {
    const { currentUserId } = get();
    console.log('Deleting personal record with ID:', id);
    const updatedPRs = get().personalRecords.filter(pr => pr.id !== id);
    set({ personalRecords: updatedPRs });
    AsyncStorage.setItem('fitness_personal_records', JSON.stringify(updatedPRs));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedPRs, 'fitness_personal_records');
    }
  },
  
  addVideoRecord: (videoData) => {
    const { currentUserId } = get();
    const newVideoRecord: VideoRecord = {
      ...videoData,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
    };
    
    const updatedVideoRecords = [...get().videoRecords, newVideoRecord];
    set({ videoRecords: updatedVideoRecords });
    AsyncStorage.setItem('fitness_video_records', JSON.stringify(updatedVideoRecords));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedVideoRecords, 'fitness_video_records');
    }
  },
  
  getClientVideoRecords: (clientId, exerciseId) => {
    const { videoRecords } = get();
    return videoRecords.filter(vr => 
      vr.clientId === clientId && (!exerciseId || vr.exerciseId === exerciseId)
    );
  },
  
  deleteVideoRecord: (id) => {
    const { currentUserId } = get();
    const updatedVideoRecords = get().videoRecords.filter(vr => vr.id !== id);
    set({ videoRecords: updatedVideoRecords });
    AsyncStorage.setItem('fitness_video_records', JSON.stringify(updatedVideoRecords));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedVideoRecords, 'fitness_video_records');
    }
  },
  
  updateMeasurementSettings: (settings) => {
    const { currentUserId } = get();
    const updatedSettings = { ...get().measurementSettings, ...settings };
    set({ measurementSettings: updatedSettings });
    AsyncStorage.setItem('fitness_measurement_settings', JSON.stringify(updatedSettings));
    
    if (currentUserId) {
      syncWithCloud(currentUserId, updatedSettings, 'fitness_measurement_settings');
    }
  },
  
  convertWeight: (weight, from, to) => {
    if (from === to) return weight;
    if (from === 'metric' && to === 'imperial') {
      return weight * 2.20462; // kg to lbs
    }
    if (from === 'imperial' && to === 'metric') {
      return weight / 2.20462; // lbs to kg
    }
    return weight;
  },
  
  convertDistance: (distance, from, to) => {
    if (from === to) return distance;
    if (from === 'metric' && to === 'imperial') {
      return distance * 0.621371; // km to miles
    }
    if (from === 'imperial' && to === 'metric') {
      return distance / 0.621371; // miles to km
    }
    return distance;
  },
  
  formatWeight: (weight) => {
    const { measurementSettings } = get();
    const unit = measurementSettings.weightUnit === 'metric' ? 'kg' : 'lbs';
    return `${weight.toFixed(1)} ${unit}`;
  },
  
  formatDistance: (distance) => {
    const { measurementSettings } = get();
    const unit = measurementSettings.distanceUnit === 'metric' ? 'km' : 'mi';
    return `${distance.toFixed(2)} ${unit}`;
  },
}));