import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Dumbbell,
  Target,
  ArrowLeft,
  Zap,
  Copy,
  Sparkles,
  Send
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitnessStore } from '@/store/fitness-store';
import { useRouter } from 'expo-router';
import type { WorkoutTemplate, TemplateExercise, Exercise, ExerciseCategory } from '@/types';

// Pre-built workout program templates
const PRESET_PROGRAMS = [
  {
    id: 'upper-body-full',
    name: 'Full Upper Body',
    description: 'Complete upper body workout targeting chest, back, shoulders, and arms',
    exercises: [
      { id: '1', exerciseId: 'bench-press', exercise: { id: 'bench-press', name: 'Bench Press', category: 'chest' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 8, weight: 0, restTime: 90 }, { id: '2', reps: 8, weight: 0, restTime: 90 }, { id: '3', reps: 8, weight: 0, restTime: 90 }, { id: '4', reps: 8, weight: 0, restTime: 90 }] },
      { id: '2', exerciseId: 'pull-ups', exercise: { id: 'pull-ups', name: 'Pull-ups', category: 'back' as ExerciseCategory, muscleGroups: [], equipment: 'bodyweight' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 90 }, { id: '2', reps: 10, weight: 0, restTime: 90 }, { id: '3', reps: 10, weight: 0, restTime: 90 }, { id: '4', reps: 10, weight: 0, restTime: 90 }] },
      { id: '3', exerciseId: 'overhead-press', exercise: { id: 'overhead-press', name: 'Overhead Press', category: 'shoulders' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 60 }, { id: '2', reps: 10, weight: 0, restTime: 60 }, { id: '3', reps: 10, weight: 0, restTime: 60 }] },
      { id: '4', exerciseId: 'barbell-rows', exercise: { id: 'barbell-rows', name: 'Barbell Rows', category: 'back' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 60 }, { id: '2', reps: 10, weight: 0, restTime: 60 }, { id: '3', reps: 10, weight: 0, restTime: 60 }, { id: '4', reps: 10, weight: 0, restTime: 60 }] },
      { id: '5', exerciseId: 'dumbbell-curls', exercise: { id: 'dumbbell-curls', name: 'Dumbbell Curls', category: 'arms' as ExerciseCategory, muscleGroups: [], equipment: 'dumbbell' }, sets: [{ id: '1', reps: 12, weight: 0, restTime: 45 }, { id: '2', reps: 12, weight: 0, restTime: 45 }, { id: '3', reps: 12, weight: 0, restTime: 45 }] },
      { id: '6', exerciseId: 'tricep-dips', exercise: { id: 'tricep-dips', name: 'Tricep Dips', category: 'arms' as ExerciseCategory, muscleGroups: [], equipment: 'bodyweight' }, sets: [{ id: '1', reps: 12, weight: 0, restTime: 45 }, { id: '2', reps: 12, weight: 0, restTime: 45 }, { id: '3', reps: 12, weight: 0, restTime: 45 }] },
    ],
  },
  {
    id: 'lower-body-full',
    name: 'Full Lower Body',
    description: 'Comprehensive lower body workout for quads, hamstrings, glutes, and calves',
    exercises: [
      { id: '1', exerciseId: 'squats', exercise: { id: 'squats', name: 'Squats', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 8, weight: 0, restTime: 120 }, { id: '2', reps: 8, weight: 0, restTime: 120 }, { id: '3', reps: 8, weight: 0, restTime: 120 }, { id: '4', reps: 8, weight: 0, restTime: 120 }] },
      { id: '2', exerciseId: 'romanian-deadlifts', exercise: { id: 'romanian-deadlifts', name: 'Romanian Deadlifts', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 90 }, { id: '2', reps: 10, weight: 0, restTime: 90 }, { id: '3', reps: 10, weight: 0, restTime: 90 }, { id: '4', reps: 10, weight: 0, restTime: 90 }] },
      { id: '3', exerciseId: 'leg-press', exercise: { id: 'leg-press', name: 'Leg Press', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'machine' }, sets: [{ id: '1', reps: 12, weight: 0, restTime: 60 }, { id: '2', reps: 12, weight: 0, restTime: 60 }, { id: '3', reps: 12, weight: 0, restTime: 60 }] },
      { id: '4', exerciseId: 'walking-lunges', exercise: { id: 'walking-lunges', name: 'Walking Lunges', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'dumbbell' }, sets: [{ id: '1', reps: 12, weight: 0, restTime: 60 }, { id: '2', reps: 12, weight: 0, restTime: 60 }, { id: '3', reps: 12, weight: 0, restTime: 60 }] },
      { id: '5', exerciseId: 'leg-curls', exercise: { id: 'leg-curls', name: 'Leg Curls', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'machine' }, sets: [{ id: '1', reps: 15, weight: 0, restTime: 45 }, { id: '2', reps: 15, weight: 0, restTime: 45 }, { id: '3', reps: 15, weight: 0, restTime: 45 }] },
      { id: '6', exerciseId: 'calf-raises', exercise: { id: 'calf-raises', name: 'Calf Raises', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'machine' }, sets: [{ id: '1', reps: 15, weight: 0, restTime: 45 }, { id: '2', reps: 15, weight: 0, restTime: 45 }, { id: '3', reps: 15, weight: 0, restTime: 45 }, { id: '4', reps: 15, weight: 0, restTime: 45 }] },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body Day',
    description: 'Balanced full body workout hitting all major muscle groups',
    exercises: [
      { id: '1', exerciseId: 'deadlifts', exercise: { id: 'deadlifts', name: 'Deadlifts', category: 'back' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 6, weight: 0, restTime: 120 }, { id: '2', reps: 6, weight: 0, restTime: 120 }, { id: '3', reps: 6, weight: 0, restTime: 120 }, { id: '4', reps: 6, weight: 0, restTime: 120 }] },
      { id: '2', exerciseId: 'bench-press', exercise: { id: 'bench-press', name: 'Bench Press', category: 'chest' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 90 }, { id: '2', reps: 10, weight: 0, restTime: 90 }, { id: '3', reps: 10, weight: 0, restTime: 90 }] },
      { id: '3', exerciseId: 'squats', exercise: { id: 'squats', name: 'Squats', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 90 }, { id: '2', reps: 10, weight: 0, restTime: 90 }, { id: '3', reps: 10, weight: 0, restTime: 90 }] },
      { id: '4', exerciseId: 'pull-ups', exercise: { id: 'pull-ups', name: 'Pull-ups', category: 'back' as ExerciseCategory, muscleGroups: [], equipment: 'bodyweight' }, sets: [{ id: '1', reps: 8, weight: 0, restTime: 60 }, { id: '2', reps: 8, weight: 0, restTime: 60 }, { id: '3', reps: 8, weight: 0, restTime: 60 }] },
      { id: '5', exerciseId: 'overhead-press', exercise: { id: 'overhead-press', name: 'Overhead Press', category: 'shoulders' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 60 }, { id: '2', reps: 10, weight: 0, restTime: 60 }, { id: '3', reps: 10, weight: 0, restTime: 60 }] },
      { id: '6', exerciseId: 'plank', exercise: { id: 'plank', name: 'Plank', category: 'core' as ExerciseCategory, muscleGroups: [], equipment: 'bodyweight' }, sets: [{ id: '1', reps: 60, weight: 0, restTime: 30 }, { id: '2', reps: 60, weight: 0, restTime: 30 }, { id: '3', reps: 60, weight: 0, restTime: 30 }] },
    ],
  },
  {
    id: 'push-day',
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps focused workout',
    exercises: [
      { id: '1', exerciseId: 'bench-press', exercise: { id: 'bench-press', name: 'Bench Press', category: 'chest' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 8, weight: 0, restTime: 90 }, { id: '2', reps: 8, weight: 0, restTime: 90 }, { id: '3', reps: 8, weight: 0, restTime: 90 }, { id: '4', reps: 8, weight: 0, restTime: 90 }] },
      { id: '2', exerciseId: 'overhead-press', exercise: { id: 'overhead-press', name: 'Overhead Press', category: 'shoulders' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 8, weight: 0, restTime: 90 }, { id: '2', reps: 8, weight: 0, restTime: 90 }, { id: '3', reps: 8, weight: 0, restTime: 90 }, { id: '4', reps: 8, weight: 0, restTime: 90 }] },
      { id: '3', exerciseId: 'incline-dumbbell-press', exercise: { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', category: 'chest' as ExerciseCategory, muscleGroups: [], equipment: 'dumbbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 60 }, { id: '2', reps: 10, weight: 0, restTime: 60 }, { id: '3', reps: 10, weight: 0, restTime: 60 }] },
      { id: '4', exerciseId: 'lateral-raises', exercise: { id: 'lateral-raises', name: 'Lateral Raises', category: 'shoulders' as ExerciseCategory, muscleGroups: [], equipment: 'dumbbell' }, sets: [{ id: '1', reps: 12, weight: 0, restTime: 45 }, { id: '2', reps: 12, weight: 0, restTime: 45 }, { id: '3', reps: 12, weight: 0, restTime: 45 }, { id: '4', reps: 12, weight: 0, restTime: 45 }] },
      { id: '5', exerciseId: 'cable-flyes', exercise: { id: 'cable-flyes', name: 'Cable Flyes', category: 'chest' as ExerciseCategory, muscleGroups: [], equipment: 'cable' }, sets: [{ id: '1', reps: 12, weight: 0, restTime: 45 }, { id: '2', reps: 12, weight: 0, restTime: 45 }, { id: '3', reps: 12, weight: 0, restTime: 45 }] },
      { id: '6', exerciseId: 'tricep-pushdowns', exercise: { id: 'tricep-pushdowns', name: 'Tricep Pushdowns', category: 'arms' as ExerciseCategory, muscleGroups: [], equipment: 'cable' }, sets: [{ id: '1', reps: 15, weight: 0, restTime: 45 }, { id: '2', reps: 15, weight: 0, restTime: 45 }, { id: '3', reps: 15, weight: 0, restTime: 45 }] },
    ],
  },
  {
    id: 'pull-day',
    name: 'Pull Day',
    description: 'Back and biceps focused workout',
    exercises: [
      { id: '1', exerciseId: 'deadlifts', exercise: { id: 'deadlifts', name: 'Deadlifts', category: 'back' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 6, weight: 0, restTime: 120 }, { id: '2', reps: 6, weight: 0, restTime: 120 }, { id: '3', reps: 6, weight: 0, restTime: 120 }, { id: '4', reps: 6, weight: 0, restTime: 120 }] },
      { id: '2', exerciseId: 'pull-ups', exercise: { id: 'pull-ups', name: 'Pull-ups', category: 'back' as ExerciseCategory, muscleGroups: [], equipment: 'bodyweight' }, sets: [{ id: '1', reps: 8, weight: 0, restTime: 90 }, { id: '2', reps: 8, weight: 0, restTime: 90 }, { id: '3', reps: 8, weight: 0, restTime: 90 }, { id: '4', reps: 8, weight: 0, restTime: 90 }] },
      { id: '3', exerciseId: 'barbell-rows', exercise: { id: 'barbell-rows', name: 'Barbell Rows', category: 'back' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 60 }, { id: '2', reps: 10, weight: 0, restTime: 60 }, { id: '3', reps: 10, weight: 0, restTime: 60 }, { id: '4', reps: 10, weight: 0, restTime: 60 }] },
      { id: '4', exerciseId: 'cable-rows', exercise: { id: 'cable-rows', name: 'Cable Rows', category: 'back' as ExerciseCategory, muscleGroups: [], equipment: 'cable' }, sets: [{ id: '1', reps: 12, weight: 0, restTime: 60 }, { id: '2', reps: 12, weight: 0, restTime: 60 }, { id: '3', reps: 12, weight: 0, restTime: 60 }] },
      { id: '5', exerciseId: 'barbell-curls', exercise: { id: 'barbell-curls', name: 'Barbell Curls', category: 'arms' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 45 }, { id: '2', reps: 10, weight: 0, restTime: 45 }, { id: '3', reps: 10, weight: 0, restTime: 45 }] },
      { id: '6', exerciseId: 'hammer-curls', exercise: { id: 'hammer-curls', name: 'Hammer Curls', category: 'arms' as ExerciseCategory, muscleGroups: [], equipment: 'dumbbell' }, sets: [{ id: '1', reps: 12, weight: 0, restTime: 45 }, { id: '2', reps: 12, weight: 0, restTime: 45 }, { id: '3', reps: 12, weight: 0, restTime: 45 }] },
    ],
  },
  {
    id: 'legs-day',
    name: 'Leg Day',
    description: 'Intense leg workout for strength and size',
    exercises: [
      { id: '1', exerciseId: 'back-squats', exercise: { id: 'back-squats', name: 'Back Squats', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 8, weight: 0, restTime: 120 }, { id: '2', reps: 8, weight: 0, restTime: 120 }, { id: '3', reps: 8, weight: 0, restTime: 120 }, { id: '4', reps: 8, weight: 0, restTime: 120 }] },
      { id: '2', exerciseId: 'front-squats', exercise: { id: 'front-squats', name: 'Front Squats', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 90 }, { id: '2', reps: 10, weight: 0, restTime: 90 }, { id: '3', reps: 10, weight: 0, restTime: 90 }] },
      { id: '3', exerciseId: 'romanian-deadlifts', exercise: { id: 'romanian-deadlifts', name: 'Romanian Deadlifts', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'barbell' }, sets: [{ id: '1', reps: 10, weight: 0, restTime: 90 }, { id: '2', reps: 10, weight: 0, restTime: 90 }, { id: '3', reps: 10, weight: 0, restTime: 90 }, { id: '4', reps: 10, weight: 0, restTime: 90 }] },
      { id: '4', exerciseId: 'leg-press', exercise: { id: 'leg-press', name: 'Leg Press', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'machine' }, sets: [{ id: '1', reps: 15, weight: 0, restTime: 60 }, { id: '2', reps: 15, weight: 0, restTime: 60 }, { id: '3', reps: 15, weight: 0, restTime: 60 }] },
      { id: '5', exerciseId: 'bulgarian-split-squats', exercise: { id: 'bulgarian-split-squats', name: 'Bulgarian Split Squats', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'dumbbell' }, sets: [{ id: '1', reps: 12, weight: 0, restTime: 60 }, { id: '2', reps: 12, weight: 0, restTime: 60 }, { id: '3', reps: 12, weight: 0, restTime: 60 }] },
      { id: '6', exerciseId: 'calf-raises', exercise: { id: 'calf-raises', name: 'Calf Raises', category: 'legs' as ExerciseCategory, muscleGroups: [], equipment: 'machine' }, sets: [{ id: '1', reps: 20, weight: 0, restTime: 30 }, { id: '2', reps: 20, weight: 0, restTime: 30 }, { id: '3', reps: 20, weight: 0, restTime: 30 }, { id: '4', reps: 20, weight: 0, restTime: 30 }] },
    ],
  },
];

export default function TemplatesScreen() {
  const { 
    workoutTemplates, 
    exercises, 
    loadData, 
    isLoading,
    addWorkoutTemplate,
    updateWorkoutTemplate,
    deleteWorkoutTemplate,
    addExercise
  } = useFitnessStore();
  const router = useRouter();
  
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showExerciseModal, setShowExerciseModal] = useState<boolean>(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateDescription, setTemplateDescription] = useState<string>('');
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  const [newExerciseCategory, setNewExerciseCategory] = useState<string>('chest');
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState<string>('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateExercises([]);
    setEditingTemplate(null);
  };

  const handleCreateTemplate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setTemplateExercises(template.exercises);
    setShowCreateModal(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    if (templateExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    const templateData = {
      name: templateName.trim(),
      description: templateDescription.trim(),
      exercises: templateExercises,
    };

    if (editingTemplate) {
      updateWorkoutTemplate(editingTemplate.id, templateData);
    } else {
      addWorkoutTemplate(templateData);
    }

    setShowCreateModal(false);
    resetForm();
  };

  const handleDeleteTemplate = (template: WorkoutTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteWorkoutTemplate(template.id)
        },
      ]
    );
  };

  const handleCreateCustomExercise = () => {
    if (!newExerciseName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    const customExercise = {
      name: newExerciseName.trim(),
      category: newExerciseCategory as ExerciseCategory,
      muscleGroups: [],
      equipment: 'none',
      isCustom: true,
    };

    addExercise(customExercise);
    setNewExerciseName('');
    setNewExerciseCategory('chest');
    setShowAddExerciseModal(false);
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newTemplateExercise: TemplateExercise = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      exercise,
      sets: [
        {
          id: Date.now().toString(),
          reps: 10,
          weight: 0,
          restTime: 60,
        }
      ],
    };

    setTemplateExercises([...templateExercises, newTemplateExercise]);
    setShowExerciseModal(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setTemplateExercises(templateExercises.filter(ex => ex.id !== exerciseId));
  };

  const handleUsePreset = (preset: typeof PRESET_PROGRAMS[0]) => {
    const newTemplate: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: preset.name,
      description: preset.description,
      exercises: preset.exercises,
    };
    addWorkoutTemplate(newTemplate);
    setShowPresetsModal(false);
    Alert.alert('Success', `${preset.name} template has been added to your templates`);
  };

  const handleGenerateAITemplate = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Error', 'Please describe the workout you want to create');
      return;
    }

    setIsGenerating(true);
    
    try {
      const systemPrompt = `You are a professional fitness trainer creating workout templates. Based on the user's request, create a detailed workout template with the following structure:

{
  "name": "Template Name",
  "description": "Brief description of the workout",
  "exercises": [
    {
      "id": "unique_id",
      "exerciseId": "exercise_id_from_database",
      "exercise": {
        "id": "exercise_id",
        "name": "Exercise Name",
        "category": "chest|back|shoulders|arms|legs|core|cardio|full-body",
        "muscleGroups": ["muscle1", "muscle2"],
        "equipment": "equipment_type"
      },
      "sets": [
        {
          "id": "set_id",
          "reps": number,
          "weight": 0,
          "restTime": seconds
        }
      ]
    }
  ]
}

Available exercises to choose from: ${exercises.map(ex => `${ex.name} (${ex.category})`).join(', ')}

Guidelines:
- Choose appropriate exercises from the available list
- Set realistic rep ranges and rest times
- Balance muscle groups appropriately
- Consider workout intensity and duration
- Use proper exercise progression

Respond ONLY with valid JSON, no additional text.`;

      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: aiPrompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate workout template');
      }

      const data = await response.json();
      console.log('AI Response:', data.completion);
      
      // Clean the response to extract JSON
      let jsonString = data.completion.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Find JSON object boundaries
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON found in AI response');
      }
      
      jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      
      let templateData;
      try {
        templateData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Attempted to parse:', jsonString);
        throw new Error('Invalid JSON format in AI response');
      }
      
      // Validate and process the generated template
      const processedExercises = templateData.exercises.map((ex: any, index: number) => {
        // Find matching exercise from our database
        const matchingExercise = exercises.find(e => 
          e.name.toLowerCase().includes(ex.exercise.name.toLowerCase()) ||
          ex.exercise.name.toLowerCase().includes(e.name.toLowerCase())
        );
        
        const exercise = matchingExercise || {
          id: `ai_${Date.now()}_${index}`,
          name: ex.exercise.name,
          category: ex.exercise.category,
          muscleGroups: ex.exercise.muscleGroups || [],
          equipment: ex.exercise.equipment || 'Unknown'
        };

        return {
          id: `${Date.now()}_${index}`,
          exerciseId: exercise.id,
          exercise,
          sets: ex.sets.map((set: any, setIndex: number) => ({
            id: `${Date.now()}_${index}_${setIndex}`,
            reps: set.reps || 10,
            weight: 0,
            restTime: set.restTime || 60
          }))
        };
      });

      const newTemplate: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: templateData.name || 'AI Generated Workout',
        description: templateData.description || 'Custom workout generated by AI',
        exercises: processedExercises,
      };

      addWorkoutTemplate(newTemplate);
      setShowAIModal(false);
      setAiPrompt('');
      Alert.alert('Success', 'AI workout template has been created!');
      
    } catch (error) {
      console.error('Error generating AI template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to generate workout template: ${errorMessage}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateSets = (exerciseId: string, sets: number) => {
    setTemplateExercises(templateExercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSets = Array.from({ length: sets }, (_, index) => ({
          id: `${Date.now()}_${index}`,
          reps: 10,
          weight: 0,
          restTime: 60,
        }));
        return { ...ex, sets: newSets };
      }
      return ex;
    }));
  };

  const renderTemplate = ({ item }: { item: WorkoutTemplate }) => (
    <View style={styles.templateCard}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.templateGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.templateHeader}>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.templateDescription}>{item.description}</Text>
            )}
            <Text style={styles.templateStats}>
              {item.exercises.length} exercises
            </Text>
          </View>
          <View style={styles.templateActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditTemplate(item)}
            >
              <Edit3 color="#ffffff" size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteTemplate(item)}
            >
              <Trash2 color="#ffffff" size={18} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderExerciseItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => handleAddExercise(item)}
    >
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseCategory}>{item.category}</Text>
      </View>
      <Plus color="#6366f1" size={20} />
    </TouchableOpacity>
  );

  const renderTemplateExercise = ({ item }: { item: TemplateExercise }) => (
    <View style={styles.templateExerciseCard}>
      <View style={styles.templateExerciseHeader}>
        <View style={styles.templateExerciseInfo}>
          <Text style={styles.templateExerciseName}>{item.exercise.name}</Text>
          <Text style={styles.templateExerciseDetails}>
            {item.sets.length} sets
          </Text>
        </View>
        <View style={styles.templateExerciseActions}>
          <TouchableOpacity
            style={styles.setsButton}
            onPress={() => {
              Alert.prompt(
                'Number of Sets',
                'Enter the number of sets:',
                (text) => {
                  const sets = parseInt(text);
                  if (sets > 0 && sets <= 10) {
                    handleUpdateSets(item.id, sets);
                  }
                },
                'plain-text',
                item.sets.length.toString()
              );
            }}
          >
            <Target color="#6366f1" size={16} />
            <Text style={styles.setsButtonText}>{item.sets.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveExercise(item.id)}
          >
            <X color="#ef4444" size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {editingTemplate ? 'Edit Template' : 'Create Template'}
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveTemplate}
            >
              <Save color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Template Name</Text>
            <TextInput
              style={styles.textInput}
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="Enter template name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={templateDescription}
              onChangeText={setTemplateDescription}
              placeholder="Enter description"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.exercisesSection}>
            <View style={styles.exercisesHeader}>
              <Text style={styles.sectionTitle}>Exercises ({templateExercises.length})</Text>
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => setShowExerciseModal(true)}
              >
                <Plus color="#ffffff" size={16} />
                <Text style={styles.addExerciseText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={templateExercises}
              renderItem={renderTemplateExercise}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  // Filter exercises based on search query
  const filteredExercises = exercises.filter(exercise => 
    exercise.name.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(exerciseSearchQuery.toLowerCase()) ||
    exercise.muscleGroups?.some(muscle => 
      muscle.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
    )
  );

  const renderExerciseModal = () => (
    <Modal
      visible={showExerciseModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={() => setExerciseSearchQuery('')}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Exercise</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.addCustomButton]}
              onPress={() => {
                setShowExerciseModal(false);
                setShowAddExerciseModal(true);
                setExerciseSearchQuery('');
              }}
            >
              <Plus color="#ffffff" size={16} />
              <Text style={styles.addCustomText}>Custom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowExerciseModal(false);
                setExerciseSearchQuery('');
              }}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              value={exerciseSearchQuery}
              onChangeText={setExerciseSearchQuery}
              placeholder="🔍 Search exercises by name, category, or muscle group..."
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            {exerciseSearchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setExerciseSearchQuery('')}
              >
                <X color="#9ca3af" size={16} />
              </TouchableOpacity>
            )}
          </View>
          {exerciseSearchQuery.length > 0 && (
            <Text style={styles.searchResultsText}>
              {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
            </Text>
          )}
        </View>

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
            contentContainerStyle={styles.exerciseList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );

  const renderAIModal = () => (
    <Modal
      visible={showAIModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>AI Workout Generator</Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              setShowAIModal(false);
              setAiPrompt('');
            }}
          >
            <X color="#6b7280" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Describe Your Workout</Text>
            <Text style={styles.inputHint}>
              Tell the AI what kind of workout you want. Be specific about goals, muscle groups, equipment, duration, etc.
            </Text>
            <TextInput
              style={[styles.textInput, styles.aiTextArea]}
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="e.g., Create a 45-minute upper body strength workout for intermediate level using dumbbells and barbells, focusing on chest and back with 4-6 exercises"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.aiExamples}>
            <Text style={styles.examplesTitle}>Example Prompts:</Text>
            <TouchableOpacity 
              style={styles.exampleItem}
              onPress={() => setAiPrompt('Create a beginner-friendly full body workout using only bodyweight exercises, 30 minutes duration')}
            >
              <Text style={styles.exampleText}>• Beginner full body bodyweight workout</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exampleItem}
              onPress={() => setAiPrompt('Design an advanced leg day workout with heavy compound movements, focusing on strength and hypertrophy')}
            >
              <Text style={styles.exampleText}>• Advanced leg day for strength</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exampleItem}
              onPress={() => setAiPrompt('Create a quick 20-minute HIIT cardio workout for fat loss with minimal equipment')}
            >
              <Text style={styles.exampleText}>• 20-minute HIIT cardio workout</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={handleGenerateAITemplate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Text style={styles.generateButtonText}>Generating...</Text>
            ) : (
              <>
                <Send color="#ffffff" size={20} />
                <Text style={styles.generateButtonText}>Generate Workout</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading templates...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/exercises')}
          >
            <ArrowLeft color="#9ca3af" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Workout Templates</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => setShowAIModal(true)}
          >
            <Sparkles color="#ffffff" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetsButton}
            onPress={() => setShowPresetsModal(true)}
          >
            <Zap color="#ffffff" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateTemplate}
          >
            <Plus color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {workoutTemplates.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Dumbbell color="#6b7280" size={64} />
          <Text style={styles.emptyTitle}>No Templates Yet</Text>
          <Text style={styles.emptyText}>
            Create workout templates or use pre-built programs
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.aiEmptyButton}
              onPress={() => setShowAIModal(true)}
            >
              <Sparkles color="#ffffff" size={18} />
              <Text style={styles.aiEmptyText}>AI Generate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetsEmptyButton}
              onPress={() => setShowPresetsModal(true)}
            >
              <Zap color="#ffffff" size={18} />
              <Text style={styles.presetsEmptyText}>Browse Programs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createTemplateButton}
              onPress={handleCreateTemplate}
            >
              <Text style={styles.createTemplateText}>Create Template</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={workoutTemplates}
          renderItem={renderTemplate}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderCreateModal()}
      {renderExerciseModal()}
      {renderAIModal()}

      {/* Presets Modal */}
      <Modal
        visible={showPresetsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Program Templates</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowPresetsModal(false)}
            >
              <X color="#9ca3af" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.presetsContent}>
            {PRESET_PROGRAMS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetCard}
                onPress={() => handleUsePreset(preset)}
              >
                <LinearGradient
                  colors={['#4c1d95', '#7c3aed']}
                  style={styles.presetGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.presetHeader}>
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetName}>{preset.name}</Text>
                      <Text style={styles.presetDescription}>{preset.description}</Text>
                      <Text style={styles.presetStats}>
                        {preset.exercises.length} exercises • {preset.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} total sets
                      </Text>
                    </View>
                    <Copy color="#ffffff" size={20} />
                  </View>
                  <View style={styles.presetExercises}>
                    {preset.exercises.slice(0, 3).map((ex, idx) => (
                      <Text key={idx} style={styles.presetExerciseItem}>
                        • {ex.exercise.name} ({ex.sets.length} sets)
                      </Text>
                    ))}
                    {preset.exercises.length > 3 && (
                      <Text style={styles.presetExerciseMore}>
                        +{preset.exercises.length - 3} more exercises
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Add Custom Exercise Modal */}
      <Modal
        visible={showAddExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Custom Exercise</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowAddExerciseModal(false);
                setNewExerciseName('');
                setNewExerciseCategory('chest');
              }}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Exercise Name</Text>
              <TextInput
                style={styles.textInput}
                value={newExerciseName}
                onChangeText={setNewExerciseName}
                placeholder="Enter exercise name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryButtons}>
                {(['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'full-body'] as ExerciseCategory[]).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      newExerciseCategory === category && styles.categoryButtonActive
                    ]}
                    onPress={() => setNewExerciseCategory(category)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      newExerciseCategory === category && styles.categoryButtonTextActive
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.createExerciseButton}
              onPress={handleCreateCustomExercise}
            >
              <Text style={styles.createExerciseButtonText}>Create Exercise</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  aiButton: {
    backgroundColor: '#f59e0b',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetsButton: {
    backgroundColor: '#7c3aed',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#6366f1',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  templateCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  templateGradient: {
    padding: 20,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  templateStats: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  templateActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyActions: {
    gap: 12,
  },
  aiEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  aiEmptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  presetsEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 12,
  },
  presetsEmptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  createTemplateButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createTemplateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalButton: {
    padding: 4,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1f1f1f',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  exercisesSection: {
    flex: 1,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addExerciseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  templateExerciseCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  templateExerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateExerciseInfo: {
    flex: 1,
  },
  templateExerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  templateExerciseDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  templateExerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  setsButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
    marginLeft: 4,
  },
  removeButton: {
    padding: 4,
  },
  exerciseList: {
    padding: 20,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  addCustomText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#1f1f1f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#9ca3af',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  createExerciseButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  createExerciseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  presetsContent: {
    flex: 1,
    padding: 20,
  },
  presetCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  presetGradient: {
    padding: 20,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    lineHeight: 20,
  },
  presetStats: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  presetExercises: {
    marginTop: 8,
  },
  presetExerciseItem: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  presetExerciseMore: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    marginTop: 4,
  },
  inputHint: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 20,
  },
  aiTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  aiExamples: {
    marginBottom: 24,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginBottom: 12,
  },
  exampleItem: {
    paddingVertical: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#6366f1',
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 'auto',
  },
  generateButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f1f',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 45,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#374151',
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  searchResultsText: {
    fontSize: 14,
    color: '#6366f1',
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
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});