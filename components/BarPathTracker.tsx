import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Target,
  TrendingUp,
  Activity,
  Save
} from 'lucide-react-native';
import Svg, { Line, Circle, Path } from 'react-native-svg';

interface BarPathTrackerProps {
  visible: boolean;
  onClose: () => void;
  videoUri: string;
  exerciseName?: string;
  clientName?: string;
  onSaveAnalysis?: (analysis: BarPathAnalysis) => void;
}

interface BarPathPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface BarPathAnalysis {
  barPath: BarPathPoint[];
  metrics: {
    totalDistance: number;
    averageVelocity: number;
    maxVelocity: number;
    pathDeviation: number;
    efficiency: number;
  };
  recommendations: string[];
}

interface BarTarget {
  id: string;
  name: string;
  color: string;
  isSelected: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function BarPathTracker({
  visible,
  onClose,
  videoUri,
  exerciseName,
  clientName,
  onSaveAnalysis,
}: BarPathTrackerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [barPath, setBarPath] = useState<BarPathPoint[]>([]);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<BarPathAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [videoLayout, setVideoLayout] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
  
  const videoRef = useRef<Video>(null);
  const [barTargets] = useState<BarTarget[]>([
    { id: '1', name: 'Barbell', color: '#22c55e', isSelected: true },
    { id: '2', name: 'Dumbbell L', color: '#3b82f6', isSelected: false },
    { id: '3', name: 'Dumbbell R', color: '#f59e0b', isSelected: false },
    { id: '4', name: 'Kettlebell', color: '#ef4444', isSelected: false },
  ]);

  const selectedBar = barTargets.find(bar => bar.isSelected) || barTargets[0];

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBarPath([]);
    setIsTracking(false);
    setAnalysis(null);
    setShowAnalysis(false);
    setVideoLayout(null);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isTracking,
    onMoveShouldSetPanResponder: () => isTracking,
    onPanResponderGrant: (evt) => {
      if (isTracking && videoLayout) {
        const { locationX, locationY } = evt.nativeEvent;
        addBarPathPoint(locationX, locationY);
      }
    },
    onPanResponderMove: (evt) => {
      if (isTracking && videoLayout) {
        const { locationX, locationY } = evt.nativeEvent;
        addBarPathPoint(locationX, locationY);
      }
    },
  });

  const addBarPathPoint = (x: number, y: number) => {
    if (!videoLayout) return;
    
    // Ensure coordinates are within video bounds
    const clampedX = Math.max(0, Math.min(x, videoLayout.width));
    const clampedY = Math.max(0, Math.min(y, videoLayout.height));
    
    const newPoint: BarPathPoint = {
      x: clampedX,
      y: clampedY,
      timestamp: currentTime,
    };

    setBarPath(prev => [...prev, newPoint]);
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying || false);
    }
  };

  const seekToPosition = async (position: number) => {
    if (!videoRef.current) return;
    
    try {
      await videoRef.current.setPositionAsync(position);
      setCurrentTime(position);
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  const startTracking = () => {
    setIsTracking(true);
    setBarPath([]);
    Alert.alert(
      'Bar Path Tracking',
      'Tap and drag on the bar in the video to track its path. The video will play automatically.',
      [{ text: 'Got it', onPress: () => togglePlayback() }]
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (isPlaying) {
      togglePlayback();
    }
    if (barPath.length > 0) {
      analyzeBarPath();
    }
  };

  const analyzeBarPath = () => {
    if (barPath.length < 2) {
      Alert.alert('Insufficient Data', 'Please track more points to analyze the bar path.');
      return;
    }

    // Calculate metrics
    let totalDistance = 0;
    let velocities: number[] = [];
    
    for (let i = 1; i < barPath.length; i++) {
      const prev = barPath[i - 1];
      const curr = barPath[i];
      
      const distance = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
      );
      totalDistance += distance;
      
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // Convert to seconds
      if (timeDiff > 0) {
        const velocity = distance / timeDiff;
        velocities.push(velocity);
      }
    }

    const averageVelocity = velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0;
    const maxVelocity = velocities.length > 0 ? Math.max(...velocities) : 0;

    // Calculate path deviation (how much the bar deviates from a straight vertical line)
    const startPoint = barPath[0];
    const endPoint = barPath[barPath.length - 1];
    const idealPath = Math.abs(endPoint.y - startPoint.y);
    const pathDeviation = totalDistance > 0 ? ((totalDistance - idealPath) / idealPath) * 100 : 0;

    // Calculate efficiency (lower deviation = higher efficiency)
    const efficiency = Math.max(0, 100 - pathDeviation);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (pathDeviation > 20) {
      recommendations.push('Try to keep the bar path more vertical - reduce horizontal drift');
    }
    if (pathDeviation > 40) {
      recommendations.push('Significant bar path deviation detected - focus on control and stability');
    }
    if (averageVelocity < 50) {
      recommendations.push('Consider increasing the speed of the movement for better power development');
    }
    if (averageVelocity > 200) {
      recommendations.push('Movement may be too fast - focus on controlled execution');
    }
    if (efficiency > 80) {
      recommendations.push('Excellent bar path control! Keep up the consistent technique');
    }
    if (efficiency < 60) {
      recommendations.push('Work on maintaining a straighter bar path for improved efficiency');
    }

    if (recommendations.length === 0) {
      recommendations.push('Good technique overall - continue practicing for consistency');
    }

    const analysisResult: BarPathAnalysis = {
      barPath,
      metrics: {
        totalDistance: Math.round(totalDistance),
        averageVelocity: Math.round(averageVelocity),
        maxVelocity: Math.round(maxVelocity),
        pathDeviation: Math.round(pathDeviation * 10) / 10,
        efficiency: Math.round(efficiency * 10) / 10,
      },
      recommendations,
    };

    setAnalysis(analysisResult);
    setShowAnalysis(true);
  };

  const clearPath = () => {
    setBarPath([]);
    setAnalysis(null);
    setShowAnalysis(false);
  };

  const saveAnalysis = () => {
    if (analysis && onSaveAnalysis) {
      onSaveAnalysis(analysis);
      Alert.alert('Analysis Saved', 'Bar path analysis has been saved successfully.');
      onClose();
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X color="#ffffff" size={24} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Bar Path Analysis</Text>
            {clientName && exerciseName && (
              <Text style={styles.headerSubtitle}>
                {clientName} - {exerciseName}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={clearPath}>
            <RotateCcw color="#ffffff" size={24} />
          </TouchableOpacity>
        </View>

        {/* Video Container */}
        <View style={styles.videoContainer}>
          <View
            style={styles.videoWrapper}
            onLayout={(event) => {
              const { width, height, x, y } = event.nativeEvent.layout;
              setVideoLayout({ width, height, x, y });
            }}
            {...panResponder.panHandlers}
          >
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={isPlaying}
              isLooping={false}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            />

            {/* Bar Path Overlay */}
            {videoLayout && (
              <View style={styles.overlayContainer}>
                <Svg style={styles.overlay} width={videoLayout.width} height={videoLayout.height}>
                  {/* Bar path visualization */}
                  {barPath.length > 1 && (
                    <>
                      {/* Path line */}
                      <Path
                        d={barPath.map((point, index) => 
                          index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
                        ).join(' ')}
                        stroke={selectedBar.color}
                        strokeWidth="4"
                        fill="none"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      
                      {/* Path points */}
                      {barPath.map((point, index) => (
                        <Circle
                          key={`point-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r={index === 0 || index === barPath.length - 1 ? "8" : "4"}
                          fill={selectedBar.color}
                          stroke="#ffffff"
                          strokeWidth="2"
                          opacity={0.8}
                        />
                      ))}

                      {/* Start and end markers */}
                      {barPath.length > 0 && (
                        <>
                          <Circle
                            cx={barPath[0].x}
                            cy={barPath[0].y}
                            r="12"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                          />
                          <Circle
                            cx={barPath[barPath.length - 1].x}
                            cy={barPath[barPath.length - 1].y}
                            r="12"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="3"
                          />
                        </>
                      )}
                    </>
                  )}
                </Svg>
              </View>
            )}

            {/* Tracking indicator */}
            {isTracking && (
              <View style={styles.trackingIndicator}>
                <Target color="#ffffff" size={16} />
                <Text style={styles.trackingText}>Tracking {selectedBar.name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.playbackControls}>
            <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
              {isPlaying ? (
                <Pause color="#ffffff" size={24} />
              ) : (
                <Play color="#ffffff" size={24} />
              )}
            </TouchableOpacity>
            
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </View>
          </View>

          <View style={styles.trackingControls}>
            {!isTracking ? (
              <TouchableOpacity style={styles.startTrackingButton} onPress={startTracking}>
                <Target color="#ffffff" size={20} />
                <Text style={styles.startTrackingText}>Start Tracking</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.stopTrackingButton} onPress={stopTracking}>
                <Activity color="#ffffff" size={20} />
                <Text style={styles.stopTrackingText}>Stop & Analyze</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Analysis Results */}
        {showAnalysis && analysis && (
          <View style={styles.analysisContainer}>
            <View style={styles.analysisHeader}>
              <TrendingUp color="#6366f1" size={20} />
              <Text style={styles.analysisTitle}>Bar Path Analysis</Text>
              <TouchableOpacity style={styles.saveButton} onPress={saveAnalysis}>
                <Save color="#10b981" size={20} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{analysis.metrics.totalDistance}px</Text>
                <Text style={styles.metricLabel}>Total Distance</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{analysis.metrics.pathDeviation}%</Text>
                <Text style={styles.metricLabel}>Path Deviation</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{analysis.metrics.efficiency}%</Text>
                <Text style={styles.metricLabel}>Efficiency</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{analysis.metrics.averageVelocity}</Text>
                <Text style={styles.metricLabel}>Avg Velocity</Text>
              </View>
            </View>
            
            {analysis.recommendations.length > 0 && (
              <View style={styles.recommendations}>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {analysis.recommendations.slice(0, 2).map((rec, index) => (
                  <Text key={`rec-${index}`} style={styles.recommendationText}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {isTracking 
              ? 'Tap and drag on the bar to track its path through the movement'
              : barPath.length > 0
              ? 'Bar path tracked! Review the analysis above or start tracking again'
              : 'Play the video and tap "Start Tracking" to begin analyzing the bar path'
            }
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    padding: 8,
  },
  clearButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  videoContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  trackingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  controls: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  trackingControls: {
    alignItems: 'center',
  },
  startTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startTrackingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  stopTrackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  stopTrackingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  analysisContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
    flex: 1,
  },
  saveButton: {
    padding: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  recommendations: {
    marginTop: 8,
  },
  recommendationsTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  recommendationText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});