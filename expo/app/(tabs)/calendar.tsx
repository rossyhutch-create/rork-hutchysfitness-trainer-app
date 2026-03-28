import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react-native';
import { colors } from '@/constants/branding';
import { useFitnessStore } from '@/store/fitness-store';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface WorkoutInfo {
  id: string;
  name: string;
  clientName: string;
  clientNames?: string[];
  isMultiClient?: boolean;
  exerciseCount: number;
}

interface SessionDay {
  date: Date;
  workouts: WorkoutInfo[];
}

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const workouts = useFitnessStore((state) => state.workouts);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentDate]);

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutInfo[]>();
    
    workouts.forEach((workout) => {
      const dateKey = new Date(workout.date).toDateString();
      
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      
      const workoutInfo = {
        id: workout.id,
        name: workout.name,
        clientName: workout.client?.name || 'Unknown',
        clientNames: workout.isMultiClient 
          ? workout.clients?.map(c => c.name) || []
          : undefined,
        isMultiClient: workout.isMultiClient || false,
        exerciseCount: workout.exercises.length,
      };
      
      map.get(dateKey)?.push(workoutInfo);
    });
    
    return map;
  }, [workouts]);

  const hasWorkoutOnDate = (date: Date | null): boolean => {
    if (!date) return false;
    return workoutsByDate.has(date.toDateString());
  };

  const getWorkoutsForDate = (date: Date | null): WorkoutInfo[] => {
    if (!date) return [];
    return workoutsByDate.get(date.toDateString()) || [];
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null): boolean => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const selectedDateWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : [];

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Session Calendar',
          headerStyle: {
            backgroundColor: colors.cardBackground,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600' as const,
          },
        }} 
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.calendarContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <ChevronLeft color={colors.text} size={24} />
            </TouchableOpacity>
            
            <Text style={styles.monthYear}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <ChevronRight color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.daysHeader}>
            {DAYS.map((day) => (
              <View key={day} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const hasWorkout = hasWorkoutOnDate(date);
              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !date && styles.emptyCell,
                    hasWorkout && styles.dayWithWorkout,
                    isTodayDate && styles.today,
                    isSelectedDate && styles.selectedDay,
                  ]}
                  onPress={() => date && setSelectedDate(date)}
                  disabled={!date}
                >
                  {date && (
                    <>
                      <Text
                        style={[
                          styles.dayText,
                          isTodayDate && styles.todayText,
                          isSelectedDate && styles.selectedDayText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {hasWorkout && !isSelectedDate && (
                        <View style={styles.workoutDot} />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedDate && (
          <View style={styles.sessionDetails}>
            <Text style={styles.selectedDateTitle}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>

            {selectedDateWorkouts.length === 0 ? (
              <View style={styles.noSessionsContainer}>
                <Text style={styles.noSessionsText}>No sessions on this day</Text>
              </View>
            ) : (
              <View style={styles.workoutsList}>
                {selectedDateWorkouts.map((workout) => (
                  <View key={workout.id} style={styles.workoutCard}>
                    <View style={styles.workoutHeader}>
                      <View style={styles.workoutIconContainer}>
                        <Dumbbell color={colors.primary} size={20} />
                      </View>
                      <View style={styles.workoutInfo}>
                        <Text style={styles.workoutName}>{workout.name}</Text>
                        {workout.isMultiClient ? (
                          <Text style={styles.clientNames}>
                            {workout.clientNames?.join(', ')}
                          </Text>
                        ) : (
                          <Text style={styles.clientName}>{workout.clientName}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.workoutMeta}>
                      <Text style={styles.exerciseCount}>
                        {workout.exerciseCount} {workout.exerciseCount === 1 ? 'exercise' : 'exercises'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {!selectedDate && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Tap on a date to view sessions
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: colors.cardBackground,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  dayWithWorkout: {
    backgroundColor: colors.background,
  },
  today: {
    backgroundColor: colors.primary,
  },
  selectedDay: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500' as const,
  },
  todayText: {
    color: colors.white,
    fontWeight: '700' as const,
  },
  selectedDayText: {
    color: colors.white,
    fontWeight: '700' as const,
  },
  workoutDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sessionDetails: {
    margin: 16,
    marginTop: 0,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  noSessionsContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noSessionsText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  workoutsList: {
    gap: 12,
  },
  workoutCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clientNames: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  instructionsContainer: {
    margin: 16,
    marginTop: 0,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionsText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
