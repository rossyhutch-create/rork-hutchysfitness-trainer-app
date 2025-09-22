import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { colors } from '@/constants/branding';
import { MUSCLE_GROUPS } from '@/constants/exercises';

interface MuscleGroupSelectorProps {
  selectedGroups: string[];
  onSelectionChange: (groups: string[]) => void;
  onClose: () => void;
}

export default function MuscleGroupSelector({
  selectedGroups,
  onSelectionChange,
  onClose,
}: MuscleGroupSelectorProps) {
  const { width } = useWindowDimensions();
  const [localSelection, setLocalSelection] = useState<string[]>(selectedGroups);
  
  const CIRCLE_SIZE = (width - 80) / 3;

  const toggleMuscleGroup = (groupId: string) => {
    setLocalSelection(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const handleSave = () => {
    onSelectionChange(localSelection);
    onClose();
  };

  const renderMuscleGroup = (group: { id: string; name: string; percentage: number }) => {
    const isSelected = localSelection.includes(group.id);
    
    return (
      <TouchableOpacity
        key={group.id}
        style={[styles.muscleGroupContainer, { width: CIRCLE_SIZE }]}
        onPress={() => toggleMuscleGroup(group.id)}
      >
        <View style={[
          styles.muscleCircle,
          {
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
          },
          isSelected && styles.muscleCircleSelected
        ]}>
          <View style={styles.muscleIcon}>
            <Text style={styles.muscleIconText}>{getMuscleIcon(group.id)}</Text>
          </View>
        </View>
        <Text style={[
          styles.muscleName,
          isSelected && styles.muscleNameSelected
        ]}>
          {group.name}
        </Text>
        <Text style={[
          styles.musclePercentage,
          isSelected && styles.musclePercentageSelected
        ]}>
          {group.percentage}%
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelButton}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Pick the muscle groups you want to work out:</Text>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.muscleGroupsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.muscleGroupsGrid}>
          {MUSCLE_GROUPS.map(renderMuscleGroup)}
        </View>
      </ScrollView>
    </View>
  );
}

function getMuscleIcon(muscleId: string): string {
  const icons: Record<string, string> = {
    abs: '🔥',
    back: '💪',
    biceps: '💪',
    chest: '💪',
    glutes: '🍑',
    hamstrings: '🦵',
    quadriceps: '🦵',
    shoulders: '🤸',
    triceps: '💪',
  };
  return icons[muscleId] || '💪';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600' as const,
  },
  saveButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  muscleGroupsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  muscleGroupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  muscleGroupContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  muscleCircle: {
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  muscleCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  muscleIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  muscleIconText: {
    fontSize: 32,
  },
  muscleName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  muscleNameSelected: {
    color: colors.primary,
  },
  musclePercentage: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  musclePercentageSelected: {
    color: colors.primary,
  },
});