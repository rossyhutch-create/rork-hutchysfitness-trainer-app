export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  avatar?: string;
  photos?: ClientPhoto[];
  bodyWeights?: BodyWeight[];
}

export interface ClientPhoto {
  id: string;
  uri: string;
  type: 'before' | 'after' | 'progress';
  date: string;
  notes?: string;
}

export interface BodyWeight {
  id: string;
  weight: number;
  date: string;
  bodyFat?: number;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: string[];
  equipment?: string;
  instructions?: string;
}

export type ExerciseCategory = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'arms' 
  | 'legs' 
  | 'core' 
  | 'cardio' 
  | 'full-body';

export interface ClientSetData {
  clientId: string;
  weight: number;
  videoUri?: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  restTime?: number;
  notes?: string;
  isPersonalRecord?: boolean;
  clientId?: string; // For single-client workouts
  videoUri?: string; // Video recording of the set
  clientWeights?: ClientSetData[]; // For multi-client workouts - weight per client
}

export interface ClientWorkoutSet {
  clientId: string;
  clientName: string;
  sets: WorkoutSet[];
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
  comments?: string;
  clientSets?: ClientWorkoutSet[]; // For multi-client workouts
}

export interface Workout {
  id: string;
  clientId: string;
  client: Client;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
  duration?: number;
  notes?: string;
  totalVolume: number;
  isMultiClient?: boolean;
  clients?: Client[]; // For multi-client workouts
}

export interface PersonalRecord {
  id: string;
  clientId: string;
  exerciseId: string;
  type: 'max_weight' | 'max_volume';
  value: number;
  date: string;
  workoutId: string;
  videoUri?: string; // Video of the PR set
}

export interface VideoRecord {
  id: string;
  clientId: string;
  exerciseId: string;
  workoutId: string;
  setId: string;
  videoUri: string;
  date: string;
  weight: number;
  reps: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  createdAt: string;
  isDefault?: boolean;
}

export interface TemplateExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: TemplateSet[];
  notes?: string;
}

export interface TemplateSet {
  id: string;
  reps: number;
  weight?: number;
  restTime?: number;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}