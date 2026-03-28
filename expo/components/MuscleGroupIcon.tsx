import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface MuscleGroupIconProps {
  muscleGroups: string[];
  size?: number;
}

const MuscleGroupIcon: React.FC<MuscleGroupIconProps> = ({ muscleGroups, size = 60 }) => {
  const normalizedMuscles = muscleGroups.map(m => m.toLowerCase());
  
  const isActive = (muscle: string) => {
    return normalizedMuscles.some(m => 
      m.includes(muscle) || 
      muscle.includes(m) ||
      (muscle === 'pecs' && m.includes('chest')) ||
      (muscle === 'lats' && m.includes('back')) ||
      (muscle === 'delts' && m.includes('shoulder')) ||
      (muscle === 'quads' && m.includes('quadricep')) ||
      (muscle === 'hams' && m.includes('hamstring')) ||
      (muscle === 'glutes' && m.includes('glute')) ||
      (muscle === 'abs' && (m.includes('core') || m.includes('ab'))) ||
      (muscle === 'traps' && m.includes('trap')) ||
      (muscle === 'calves' && m.includes('calve'))
    );
  };

  const activeColor = '#FF3B30';
  const inactiveColor = '#3A3A3C';
  
  const hasUpperBody = isActive('chest') || isActive('pecs') || isActive('shoulders') || 
                       isActive('delts') || isActive('back') || isActive('lats') || 
                       isActive('biceps') || isActive('triceps') || isActive('traps') ||
                       isActive('abs') || isActive('core');
  
  const hasLowerBody = isActive('quadriceps') || isActive('quads') || isActive('hamstrings') || 
                       isActive('hams') || isActive('glutes') || isActive('calves');

  if (hasUpperBody && !hasLowerBody) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <G>
            <Path
              d="M 50 15 L 45 20 L 40 25 L 35 30 L 30 35 L 30 50 L 35 55 L 40 55 L 45 50 L 50 45 L 55 50 L 60 55 L 65 55 L 70 50 L 70 35 L 65 30 L 60 25 L 55 20 Z"
              fill={isActive('chest') || isActive('pecs') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            
            <Path
              d="M 35 30 L 30 28 L 25 30 L 22 35 L 25 40 L 30 42 L 35 40 Z"
              fill={isActive('shoulders') || isActive('delts') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            <Path
              d="M 65 30 L 70 28 L 75 30 L 78 35 L 75 40 L 70 42 L 65 40 Z"
              fill={isActive('shoulders') || isActive('delts') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            
            <Path
              d="M 30 42 L 25 45 L 22 50 L 22 60 L 25 62 L 28 60 L 30 55 Z"
              fill={isActive('biceps') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            <Path
              d="M 70 42 L 75 45 L 78 50 L 78 60 L 75 62 L 72 60 L 70 55 Z"
              fill={isActive('biceps') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            
            <Path
              d="M 28 42 L 23 45 L 20 50 L 20 60 L 23 62 L 26 60 L 28 55 Z"
              fill={isActive('triceps') ? activeColor : inactiveColor}
              opacity={0.8}
            />
            <Path
              d="M 72 42 L 77 45 L 80 50 L 80 60 L 77 62 L 74 60 L 72 55 Z"
              fill={isActive('triceps') ? activeColor : inactiveColor}
              opacity={0.8}
            />
            
            <Path
              d="M 42 55 L 40 60 L 40 70 L 42 75 L 45 75 L 47 70 L 47 60 Z"
              fill={isActive('abs') || isActive('core') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            <Path
              d="M 58 55 L 60 60 L 60 70 L 58 75 L 55 75 L 53 70 L 53 60 Z"
              fill={isActive('abs') || isActive('core') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            
            <Path
              d="M 45 20 L 42 22 L 40 25 L 40 30 L 42 32 L 45 30 Z"
              fill={isActive('traps') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            <Path
              d="M 55 20 L 58 22 L 60 25 L 60 30 L 58 32 L 55 30 Z"
              fill={isActive('traps') ? activeColor : inactiveColor}
              opacity={0.9}
            />
          </G>
        </Svg>
      </View>
    );
  }

  if (hasLowerBody && !hasUpperBody) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <G>
            <Path
              d="M 40 20 L 35 25 L 32 35 L 32 45 L 35 50 L 40 52 L 45 50 L 47 45 L 47 35 L 45 25 Z"
              fill={isActive('glutes') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            <Path
              d="M 60 20 L 65 25 L 68 35 L 68 45 L 65 50 L 60 52 L 55 50 L 53 45 L 53 35 L 55 25 Z"
              fill={isActive('glutes') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            
            <Path
              d="M 35 50 L 32 55 L 30 65 L 32 75 L 35 78 L 38 75 L 40 65 L 38 55 Z"
              fill={isActive('quadriceps') || isActive('quads') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            <Path
              d="M 65 50 L 68 55 L 70 65 L 68 75 L 65 78 L 62 75 L 60 65 L 62 55 Z"
              fill={isActive('quadriceps') || isActive('quads') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            
            <Path
              d="M 38 50 L 35 55 L 33 65 L 35 75 L 38 78 L 41 75 L 43 65 L 41 55 Z"
              fill={isActive('hamstrings') || isActive('hams') ? activeColor : inactiveColor}
              opacity={0.8}
            />
            <Path
              d="M 62 50 L 65 55 L 67 65 L 65 75 L 62 78 L 59 75 L 57 65 L 59 55 Z"
              fill={isActive('hamstrings') || isActive('hams') ? activeColor : inactiveColor}
              opacity={0.8}
            />
            
            <Path
              d="M 35 78 L 33 82 L 33 90 L 35 92 L 37 90 L 37 82 Z"
              fill={isActive('calves') ? activeColor : inactiveColor}
              opacity={0.9}
            />
            <Path
              d="M 65 78 L 67 82 L 67 90 L 65 92 L 63 90 L 63 82 Z"
              fill={isActive('calves') ? activeColor : inactiveColor}
              opacity={0.9}
            />
          </G>
        </Svg>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 120">
        <G>
          <Path
            d="M 50 10 L 47 12 L 45 15 L 45 18 L 47 20 L 50 20 L 53 20 L 55 18 L 55 15 L 53 12 Z"
            fill={inactiveColor}
            opacity={0.6}
          />
          
          <Path
            d="M 45 20 L 42 22 L 40 25 L 40 28 L 42 30 L 45 28 Z"
            fill={isActive('traps') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          <Path
            d="M 55 20 L 58 22 L 60 25 L 60 28 L 58 30 L 55 28 Z"
            fill={isActive('traps') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          
          <Path
            d="M 40 25 L 35 28 L 32 32 L 30 36 L 32 40 L 35 42 L 40 40 Z"
            fill={isActive('shoulders') || isActive('delts') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          <Path
            d="M 60 25 L 65 28 L 68 32 L 70 36 L 68 40 L 65 42 L 60 40 Z"
            fill={isActive('shoulders') || isActive('delts') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          
          <Path
            d="M 50 22 L 45 25 L 40 30 L 38 35 L 38 45 L 42 50 L 47 52 L 50 50 L 53 52 L 58 50 L 62 45 L 62 35 L 60 30 L 55 25 Z"
            fill={isActive('chest') || isActive('pecs') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          
          <Path
            d="M 35 42 L 30 45 L 28 50 L 28 58 L 30 60 L 33 58 L 35 52 Z"
            fill={isActive('biceps') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          <Path
            d="M 65 42 L 70 45 L 72 50 L 72 58 L 70 60 L 67 58 L 65 52 Z"
            fill={isActive('biceps') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          
          <Path
            d="M 33 42 L 28 45 L 26 50 L 26 58 L 28 60 L 31 58 L 33 52 Z"
            fill={isActive('triceps') ? activeColor : inactiveColor}
            opacity={0.8}
          />
          <Path
            d="M 67 42 L 72 45 L 74 50 L 74 58 L 72 60 L 69 58 L 67 52 Z"
            fill={isActive('triceps') ? activeColor : inactiveColor}
            opacity={0.8}
          />
          
          <Path
            d="M 43 50 L 42 55 L 42 62 L 43 67 L 45 68 L 47 65 L 47 55 Z"
            fill={isActive('abs') || isActive('core') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          <Path
            d="M 57 50 L 58 55 L 58 62 L 57 67 L 55 68 L 53 65 L 53 55 Z"
            fill={isActive('abs') || isActive('core') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          
          <Path
            d="M 42 67 L 40 70 L 38 75 L 38 80 L 40 82 L 43 80 L 45 75 L 45 70 Z"
            fill={isActive('glutes') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          <Path
            d="M 58 67 L 60 70 L 62 75 L 62 80 L 60 82 L 57 80 L 55 75 L 55 70 Z"
            fill={isActive('glutes') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          
          <Path
            d="M 40 82 L 38 85 L 36 92 L 36 100 L 38 103 L 40 101 L 42 95 L 42 87 Z"
            fill={isActive('quadriceps') || isActive('quads') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          <Path
            d="M 60 82 L 62 85 L 64 92 L 64 100 L 62 103 L 60 101 L 58 95 L 58 87 Z"
            fill={isActive('quadriceps') || isActive('quads') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          
          <Path
            d="M 42 82 L 40 85 L 38 92 L 38 100 L 40 103 L 42 101 L 44 95 L 44 87 Z"
            fill={isActive('hamstrings') || isActive('hams') ? activeColor : inactiveColor}
            opacity={0.8}
          />
          <Path
            d="M 58 82 L 60 85 L 62 92 L 62 100 L 60 103 L 58 101 L 56 95 L 56 87 Z"
            fill={isActive('hamstrings') || isActive('hams') ? activeColor : inactiveColor}
            opacity={0.8}
          />
          
          <Path
            d="M 38 103 L 37 106 L 37 112 L 38 115 L 40 113 L 40 107 Z"
            fill={isActive('calves') ? activeColor : inactiveColor}
            opacity={0.9}
          />
          <Path
            d="M 62 103 L 63 106 L 63 112 L 62 115 L 60 113 L 60 107 Z"
            fill={isActive('calves') ? activeColor : inactiveColor}
            opacity={0.9}
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MuscleGroupIcon;
