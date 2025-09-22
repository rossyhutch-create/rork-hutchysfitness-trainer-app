import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Switch,
  ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import { 
  Camera, 
  VideoIcon, 
  Square, 
  RotateCcw, 
  Check, 
  X, 
  Play,
  Pause,
  Settings,
  Target,
  Activity,
  Eye,
  TrendingUp
} from 'lucide-react-native';
import Svg, { Line, Circle } from 'react-native-svg';

interface VideoRecorderProps {
  visible: boolean;
  onClose: () => void;
  onVideoRecorded: (videoUri: string, formAnalysis?: FormAnalysis) => void;
  clientName?: string;
  exerciseName?: string;
}

interface FormAnalysis {
  barPath: { x: number; y: number; timestamp: number }[];
  bodyAlignment: {
    shoulderLevel: number;
    hipLevel: number;
    kneeAlignment: number;
    backAngle: number;
  }[];
  formScore: number;
  recommendations: string[];
}

interface TrackingSettings {
  barPathTracking: boolean;
  bodyAlignment: boolean;
  formAnalysis: boolean;
  realTimeOverlay: boolean;
}

export default function VideoRecorder({
  visible,
  onClose,
  onVideoRecorded,
  clientName,
  exerciseName,
}: VideoRecorderProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView>(null);
  const videoRef = useRef<Video>(null);
  
  // Form tracking state
  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings>({
    barPathTracking: true,
    bodyAlignment: true,
    formAnalysis: true,
    realTimeOverlay: true,
  });
  const [barPath, setBarPath] = useState<{ x: number; y: number; timestamp: number }[]>([]);
  const [bodyKeypoints, setBodyKeypoints] = useState<any[]>([]);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const resetState = () => {
    setIsRecording(false);
    setRecordedVideo(null);
    setIsPlaying(false);
    setBarPath([]);
    setBodyKeypoints([]);
    setFormAnalysis(null);
    setIsAnalyzing(false);
    setShowSettings(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      // Check permissions again before recording
      if (!cameraPermission?.granted) {
        console.log('Camera permission not granted, requesting...');
        await requestCameraPermission();
      }
      
      if (!microphonePermission?.granted) {
        console.log('Microphone permission not granted, requesting...');
        await requestMicrophonePermission();
      }
      
      // Verify permissions were granted
      if (!cameraPermission?.granted || !microphonePermission?.granted) {
        console.error('Required permissions not granted:', { 
          camera: cameraPermission?.granted, 
          microphone: microphonePermission?.granted 
        });
        Alert.alert('Permission Error', 'Camera and microphone permissions are required to record videos.');
        return;
      }
      
      setIsRecording(true);
      setBarPath([]);
      setBodyKeypoints([]);
      console.log('Starting video recording with form tracking...');
      
      if (Platform.OS === 'web') {
        Alert.alert('Not Supported', 'Video recording is not available on web. Please use the mobile app.');
        setIsRecording(false);
        return;
      }

      // Start form tracking if enabled
      if (trackingSettings.barPathTracking || trackingSettings.bodyAlignment) {
        startFormTracking();
      }

      console.log('Calling recordAsync...');
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60, // 60 seconds max for form analysis
      });
      
      if (video) {
        console.log('Video recorded successfully:', video.uri);
        setRecordedVideo(video.uri);
        
        // Analyze form if enabled
        if (trackingSettings.formAnalysis) {
          await analyzeForm(video.uri);
        }
      } else {
        console.error('No video returned from recordAsync');
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Error recording video:', error);
      // More detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Error details:', errorMessage);
      Alert.alert('Recording Error', `Failed to record video: ${errorMessage}. Please try again.`);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      console.log('Stopping video recording...');
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  };

  const saveVideo = () => {
    if (recordedVideo) {
      onVideoRecorded(recordedVideo, formAnalysis || undefined);
      handleClose();
    }
  };

  const startFormTracking = () => {
    console.log('Starting form tracking...');
    // Simulate real-time tracking (in a real app, this would use computer vision)
    const trackingInterval = setInterval(() => {
      if (!isRecording) {
        clearInterval(trackingInterval);
        return;
      }
      
      // Simulate bar path tracking
      if (trackingSettings.barPathTracking) {
        const newPoint = {
          x: Math.random() * 300 + 50, // Simulate bar position
          y: Math.random() * 100 + 200,
          timestamp: Date.now(),
        };
        setBarPath(prev => [...prev.slice(-20), newPoint]); // Keep last 20 points
      }
      
      // Simulate body keypoint detection
      if (trackingSettings.bodyAlignment) {
        const keypoints = generateMockKeypoints();
        setBodyKeypoints(keypoints);
      }
    }, 100); // Update every 100ms
  };

  const generateMockKeypoints = () => {
    // Mock body keypoints for demonstration
    return [
      { name: 'leftShoulder', x: 150, y: 180, confidence: 0.9 },
      { name: 'rightShoulder', x: 200, y: 185, confidence: 0.85 },
      { name: 'leftHip', x: 155, y: 280, confidence: 0.8 },
      { name: 'rightHip', x: 195, y: 285, confidence: 0.82 },
      { name: 'leftKnee', x: 160, y: 350, confidence: 0.75 },
      { name: 'rightKnee', x: 190, y: 355, confidence: 0.78 },
    ];
  };

  const analyzeForm = async (videoUri: string) => {
    setIsAnalyzing(true);
    console.log('Analyzing form for video:', videoUri);
    
    try {
      // Simulate form analysis (in a real app, this would use AI/ML)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysis: FormAnalysis = {
        barPath: barPath,
        bodyAlignment: [
          {
            shoulderLevel: 0.95, // 0-1 scale, 1 = perfect level
            hipLevel: 0.88,
            kneeAlignment: 0.92,
            backAngle: 85, // degrees from vertical
          }
        ],
        formScore: 8.5, // out of 10
        recommendations: [
          'Keep shoulders more level throughout the movement',
          'Maintain consistent bar path - avoid forward drift',
          'Engage core more to stabilize spine',
          'Good depth and knee tracking overall'
        ]
      };
      
      setFormAnalysis(analysis);
      console.log('Form analysis complete:', analysis);
    } catch (error) {
      console.error('Error analyzing form:', error);
      Alert.alert('Analysis Error', 'Failed to analyze form. Video will be saved without analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTrackingSetting = (setting: keyof TrackingSettings) => {
    setTrackingSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const retakeVideo = () => {
    setRecordedVideo(null);
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!cameraPermission || !microphonePermission) {
    return null;
  }

  const hasAllPermissions = cameraPermission?.granted && microphonePermission?.granted;
  
  if (!hasAllPermissions) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.permissionContainer}>
          <Camera color="#6b7280" size={64} />
          <Text style={styles.permissionTitle}>Camera & Microphone Permissions Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera and microphone to record exercise videos with audio
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => {
            requestCameraPermission();
            requestMicrophonePermission();
          }}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X color="#ffffff" size={24} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Record Exercise</Text>
            {clientName && exerciseName && (
              <Text style={styles.headerSubtitle}>
                {clientName} - {exerciseName}
              </Text>
            )}
            {(trackingSettings.barPathTracking || trackingSettings.bodyAlignment) && (
              <Text style={styles.trackingIndicator}>🎯 Form Tracking Active</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.settingsButton} 
            onPress={() => setShowSettings(!showSettings)}
          >
            <Settings color="#ffffff" size={24} />
          </TouchableOpacity>
        </View>

        {/* Form Tracking Settings */}
        {showSettings && (
          <View style={styles.settingsPanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.settingsRow}>
                <View style={styles.settingItem}>
                  <Target color="#6366f1" size={20} />
                  <Text style={styles.settingLabel}>Bar Path</Text>
                  <Switch
                    value={trackingSettings.barPathTracking}
                    onValueChange={() => toggleTrackingSetting('barPathTracking')}
                    trackColor={{ false: '#374151', true: '#6366f1' }}
                    thumbColor={trackingSettings.barPathTracking ? '#ffffff' : '#9ca3af'}
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <Activity color="#10b981" size={20} />
                  <Text style={styles.settingLabel}>Body Alignment</Text>
                  <Switch
                    value={trackingSettings.bodyAlignment}
                    onValueChange={() => toggleTrackingSetting('bodyAlignment')}
                    trackColor={{ false: '#374151', true: '#10b981' }}
                    thumbColor={trackingSettings.bodyAlignment ? '#ffffff' : '#9ca3af'}
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <TrendingUp color="#f59e0b" size={20} />
                  <Text style={styles.settingLabel}>Form Analysis</Text>
                  <Switch
                    value={trackingSettings.formAnalysis}
                    onValueChange={() => toggleTrackingSetting('formAnalysis')}
                    trackColor={{ false: '#374151', true: '#f59e0b' }}
                    thumbColor={trackingSettings.formAnalysis ? '#ffffff' : '#9ca3af'}
                  />
                </View>
                
                <View style={styles.settingItem}>
                  <Eye color="#ef4444" size={20} />
                  <Text style={styles.settingLabel}>Live Overlay</Text>
                  <Switch
                    value={trackingSettings.realTimeOverlay}
                    onValueChange={() => toggleTrackingSetting('realTimeOverlay')}
                    trackColor={{ false: '#374151', true: '#ef4444' }}
                    thumbColor={trackingSettings.realTimeOverlay ? '#ffffff' : '#9ca3af'}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Camera/Video View */}
        <View style={styles.cameraContainer}>
          {recordedVideo ? (
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: recordedVideo }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping={false}
                onPlaybackStatusUpdate={(status: any) => {
                  if ('didJustFinish' in status && status.didJustFinish) {
                    setIsPlaying(false);
                  }
                }}
              />
              <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
                {isPlaying ? (
                  <Pause color="#ffffff" size={32} />
                ) : (
                  <Play color="#ffffff" size={32} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              mode="video"
            >
              {/* Recording indicator */}
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording...</Text>
                  {(trackingSettings.barPathTracking || trackingSettings.bodyAlignment) && (
                    <Text style={styles.trackingText}>Tracking Form</Text>
                  )}
                </View>
              )}
              
              {/* Real-time form overlay */}
              {trackingSettings.realTimeOverlay && isRecording && (
                <View style={styles.overlayContainer}>
                  <Svg style={styles.overlay} width="100%" height="100%">
                    {/* Bar path visualization */}
                    {trackingSettings.barPathTracking && barPath.length > 1 && (
                      <>
                        {barPath.map((point, index) => {
                          if (index === 0) return null;
                          const prevPoint = barPath[index - 1];
                          return (
                            <Line
                              key={`bar-path-${point.timestamp}-${index}`}
                              x1={prevPoint.x}
                              y1={prevPoint.y}
                              x2={point.x}
                              y2={point.y}
                              stroke="#6366f1"
                              strokeWidth="3"
                              opacity={0.8}
                            />
                          );
                        })}
                        {/* Current bar position */}
                        {barPath.length > 0 && (
                          <Circle
                            cx={barPath[barPath.length - 1].x}
                            cy={barPath[barPath.length - 1].y}
                            r="8"
                            fill="#6366f1"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        )}
                      </>
                    )}
                    
                    {/* Body alignment visualization */}
                    {trackingSettings.bodyAlignment && bodyKeypoints.length > 0 && (
                      <>
                        {bodyKeypoints.map((keypoint, index) => (
                          <Circle
                            key={`keypoint-${keypoint.name}-${index}`}
                            cx={keypoint.x}
                            cy={keypoint.y}
                            r="6"
                            fill={keypoint.confidence > 0.8 ? '#10b981' : '#f59e0b'}
                            stroke="#ffffff"
                            strokeWidth="2"
                            opacity={keypoint.confidence}
                          />
                        ))}
                        
                        {/* Shoulder level line */}
                        {bodyKeypoints.length >= 2 && (
                          <Line
                            x1={bodyKeypoints[0].x}
                            y1={bodyKeypoints[0].y}
                            x2={bodyKeypoints[1].x}
                            y2={bodyKeypoints[1].y}
                            stroke={Math.abs(bodyKeypoints[0].y - bodyKeypoints[1].y) < 10 ? '#10b981' : '#ef4444'}
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        )}
                        
                        {/* Hip level line */}
                        {bodyKeypoints.length >= 4 && (
                          <Line
                            x1={bodyKeypoints[2].x}
                            y1={bodyKeypoints[2].y}
                            x2={bodyKeypoints[3].x}
                            y2={bodyKeypoints[3].y}
                            stroke={Math.abs(bodyKeypoints[2].y - bodyKeypoints[3].y) < 10 ? '#10b981' : '#ef4444'}
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        )}
                      </>
                    )}
                  </Svg>
                </View>
              )}
            </CameraView>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {recordedVideo ? (
            // Video review controls
            <View style={styles.reviewControls}>
              <TouchableOpacity style={styles.retakeButton} onPress={retakeVideo}>
                <RotateCcw color="#6b7280" size={24} />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveButton} onPress={saveVideo}>
                <Check color="#ffffff" size={24} />
                <Text style={styles.saveButtonText}>Save Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Recording controls
            <View style={styles.recordingControls}>
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <RotateCcw color="#ffffff" size={24} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive
                ]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <Square color="#ffffff" size={32} />
                ) : (
                  <VideoIcon color="#ffffff" size={32} />
                )}
              </TouchableOpacity>
              
              <View style={styles.placeholder} />
            </View>
          )}
        </View>

        {/* Form Analysis Results */}
        {formAnalysis && recordedVideo && (
          <View style={styles.analysisContainer}>
            <View style={styles.analysisHeader}>
              <TrendingUp color="#6366f1" size={20} />
              <Text style={styles.analysisTitle}>Form Analysis</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{formAnalysis.formScore}/10</Text>
              </View>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Shoulder Level</Text>
                  <Text style={styles.metricValue}>
                    {Math.round(formAnalysis.bodyAlignment[0]?.shoulderLevel * 100)}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Hip Level</Text>
                  <Text style={styles.metricValue}>
                    {Math.round(formAnalysis.bodyAlignment[0]?.hipLevel * 100)}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Knee Alignment</Text>
                  <Text style={styles.metricValue}>
                    {Math.round(formAnalysis.bodyAlignment[0]?.kneeAlignment * 100)}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Back Angle</Text>
                  <Text style={styles.metricValue}>
                    {formAnalysis.bodyAlignment[0]?.backAngle}°
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            {formAnalysis.recommendations.length > 0 && (
              <View style={styles.recommendations}>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {formAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                  <Text key={`recommendation-${index}-${rec.slice(0, 10)}`} style={styles.recommendationText}>• {rec}</Text>
                ))}
              </View>
            )}
          </View>
        )}
        
        {/* Loading Analysis */}
        {isAnalyzing && (
          <View style={styles.analysisLoading}>
            <Activity color="#6366f1" size={24} />
            <Text style={styles.analysisLoadingText}>Analyzing form...</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructions}>
          {recordedVideo ? (
            <Text style={styles.instructionText}>
              {formAnalysis 
                ? 'Form analysis complete! Review results above and save video.'
                : 'Review your video and save it to attach to this exercise set'
              }
            </Text>
          ) : (
            <Text style={styles.instructionText}>
              {isRecording 
                ? `Recording... Tap the square to stop (max 60 seconds)${(trackingSettings.barPathTracking || trackingSettings.bodyAlignment) ? ' • Form tracking active' : ''}`
                : 'Position your client and tap the record button to start filming'
              }
            </Text>
          )}
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
  placeholder: {
    width: 40,
  },
  settingsButton: {
    padding: 8,
  },
  trackingIndicator: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  settingsPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  settingItem: {
    alignItems: 'center',
    marginRight: 24,
    minWidth: 80,
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
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
  trackingText: {
    color: '#ffffff',
    fontSize: 10,
    marginTop: 2,
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
    marginBottom: 12,
  },
  analysisTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
    flex: 1,
  },
  scoreContainer: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 80,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
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
  analysisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  analysisLoadingText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 8,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  recordingText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#ef4444',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#dc2626',
  },
  reviewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retakeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f8fafc',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});