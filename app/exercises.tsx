import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Plus, Search, Trash2, Filter } from 'lucide-react-native';
import MuscleGroupIcon from '@/components/MuscleGroupIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitnessStore } from '@/store/fitness-store';
import { Exercise } from '@/types';
import { EXERCISE_CATEGORIES } from '@/constants/exercises';
import AddExerciseModal from '@/components/AddExerciseModal';
import MuscleGroupSelector from '@/components/MuscleGroupSelector';
import { colors } from '@/constants/branding';
import NavigationDropdown from '@/components/NavigationDropdown';

export default function ExercisesScreen() {
  const { exercises, loadData, isLoading, addExercise, deleteExercise } = useFitnessStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMuscleGroupSelector, setShowMuscleGroupSelector] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let filtered = exercises;
    
    if (searchQuery) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscleGroups.some(muscle => 
          muscle.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    if (selectedMuscleGroups.length > 0) {
      filtered = filtered.filter(exercise => 
        exercise.muscleGroups.some(muscle => 
          selectedMuscleGroups.includes(muscle.toLowerCase())
        )
      );
    }
    
    setFilteredExercises(filtered);
  }, [exercises, searchQuery, selectedMuscleGroups]);



  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={styles.exerciseCard}
      onPress={() => console.log('View exercise:', item.id)}
    >
      <View style={styles.exerciseHeader}>
        <View style={styles.muscleIconContainer}>
          <MuscleGroupIcon muscleGroups={item.muscleGroups} size={50} />
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>
            {item.name}
            {(item as any).isCustom && <Text style={styles.customBadge}> (Custom)</Text>}
          </Text>
          <Text style={styles.exerciseCategory}>
            {EXERCISE_CATEGORIES.find(cat => cat.id === item.category)?.name}
          </Text>
        </View>
        {(item as any).isCustom && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteExercise(item.id)}
          >
            <Trash2 color={colors.error} size={18} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.muscleGroups}>
        {item.muscleGroups.slice(0, 3).map((muscle) => (
          <View key={muscle} style={styles.muscleTag}>
            <Text style={styles.muscleText}>{muscle}</Text>
          </View>
        ))}
        {item.muscleGroups.length > 3 && (
          <View style={styles.muscleTag}>
            <Text style={styles.muscleText}>+{item.muscleGroups.length - 3}</Text>
          </View>
        )}
      </View>
      
      {item.equipment && (
        <Text style={styles.equipment}>Equipment: {item.equipment}</Text>
      )}
    </TouchableOpacity>
  );

  const renderMuscleGroupFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedMuscleGroups.length > 0 && styles.filterButtonActive
        ]}
        onPress={() => setShowMuscleGroupSelector(true)}
      >
        <Filter 
          color={selectedMuscleGroups.length > 0 ? colors.white : colors.textSecondary} 
          size={20} 
        />
        <Text style={[
          styles.filterButtonText,
          selectedMuscleGroups.length > 0 && styles.filterButtonTextActive
        ]}>
          {selectedMuscleGroups.length > 0 
            ? `${selectedMuscleGroups.length} muscle groups` 
            : 'Filter by muscle groups'
          }
        </Text>
      </TouchableOpacity>
      {selectedMuscleGroups.length > 0 && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={() => setSelectedMuscleGroups([])}
        >
          <Text style={styles.clearFilterText}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading exercises...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <NavigationDropdown />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus color={colors.white} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search color={colors.textSecondary} size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises or muscle groups..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {renderMuscleGroupFilter()}

      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercises found</Text>
          </View>
        }
      />

      <AddExerciseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(exercise) => {
          addExercise(exercise);
          setShowAddModal(false);
        }}
      />

      <Modal
        visible={showMuscleGroupSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <MuscleGroupSelector
          selectedGroups={selectedMuscleGroups}
          onSelectionChange={setSelectedMuscleGroups}
          onClose={() => setShowMuscleGroupSelector(false)}
        />
      </Modal>
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
    gap: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
    fontWeight: '600' as const,
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.error + '20',
  },
  clearFilterText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 20,
  },
  exerciseCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  muscleIconContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  customBadge: {
    fontSize: 12,
    color: colors.primary,
  },
  exerciseCategory: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  muscleGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  muscleTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  muscleText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  equipment: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
