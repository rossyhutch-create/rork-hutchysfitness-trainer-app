import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { X, Plus, Minus } from 'lucide-react-native';
import { ExerciseCategory } from '@/types';
import { EXERCISE_CATEGORIES } from '@/constants/exercises';

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (exercise: {
    name: string;
    category: ExerciseCategory;
    muscleGroups: string[];
    equipment?: string;
    instructions?: string;
    isCustom: boolean;
  }) => void;
}

export default function AddExerciseModal({ visible, onClose, onAdd }: AddExerciseModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('strength' as ExerciseCategory);
  const [muscleGroups, setMuscleGroups] = useState<string[]>(['']);
  const [equipment, setEquipment] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    const validMuscleGroups = muscleGroups.filter(mg => mg.trim());
    if (validMuscleGroups.length === 0) {
      Alert.alert('Error', 'Please add at least one muscle group');
      return;
    }

    onAdd({
      name: name.trim(),
      category,
      muscleGroups: validMuscleGroups,
      equipment: equipment.trim() || undefined,
      instructions: instructions.trim() || undefined,
      isCustom: true,
    });

    // Reset form
    setName('');
    setCategory('strength' as ExerciseCategory);
    setMuscleGroups(['']);
    setEquipment('');
    setInstructions('');
    onClose();
  };

  const addMuscleGroup = () => {
    setMuscleGroups([...muscleGroups, '']);
  };

  const removeMuscleGroup = (index: number) => {
    if (muscleGroups.length > 1) {
      setMuscleGroups(muscleGroups.filter((_, i) => i !== index));
    }
  };

  const updateMuscleGroup = (index: number, value: string) => {
    const updated = [...muscleGroups];
    updated[index] = value;
    setMuscleGroups(updated);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Custom Exercise</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <X color="#6b7280" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Exercise Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Bulgarian Split Squat"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryContainer}>
                {EXERCISE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      category === cat.id && styles.categoryButtonActive
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={[
                      styles.categoryText,
                      category === cat.id && styles.categoryTextActive
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Muscle Groups *</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addMuscleGroup}
              >
                <Plus color="#6366f1" size={16} />
              </TouchableOpacity>
            </View>
            {muscleGroups.map((mg, index) => (
              <View key={`muscle-group-${index}`} style={styles.muscleGroupRow}>
                <TextInput
                  style={[styles.input, styles.muscleGroupInput]}
                  value={mg}
                  onChangeText={(value) => updateMuscleGroup(index, value)}
                  placeholder="e.g., Quadriceps"
                  placeholderTextColor="#9ca3af"
                />
                {muscleGroups.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeMuscleGroup(index)}
                  >
                    <Minus color="#991b1b" size={16} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Equipment (Optional)</Text>
            <TextInput
              style={styles.input}
              value={equipment}
              onChangeText={setEquipment}
              placeholder="e.g., Dumbbells, Barbell, None"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Instructions (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Add any specific instructions or notes..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAdd}
          >
            <Text style={styles.saveButtonText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  muscleGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  muscleGroupInput: {
    flex: 1,
    marginBottom: 0,
  },
  addButton: {
    backgroundColor: '#e0e7ff',
    padding: 6,
    borderRadius: 16,
  },
  removeButton: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
});