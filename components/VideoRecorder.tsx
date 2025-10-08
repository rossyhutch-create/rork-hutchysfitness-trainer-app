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
import Svg, { Line, Circle, Path } from 'react-native-svg';

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

interface BarTarget {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number } | null;
  isSelected: boolean;
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
  const [currentVelocity, setCurrentVelocity] = useState<number>(0);
  const [repCount, setRepCount] = useState<number>(0);
  const [bodyKeypoints, setBodyKeypoints] = useState<any[]>([]);
  const [formAnalysis, setFormAnalysis] = useState<FormAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Bar selection state
  const [showBarSelection, setShowBarSelection] = useState<boolean>(false);
  const [barTargets, setBarTargets] = useState<BarTarget[]>([
    { id: '1', name: 'Barbell', color: '#22c55e', position: null, isSelected: true },
    { id: '2', name: 'Dumbbell L', color: '#3b82f6', position: null, isSelected: false },
    { id: '3', name: 'Dumbbell R', color: '#f59e0b', position: null, isSelected: false },
    { id: '4', name: 'Kettlebell', color: '#ef4444', position: null, isSelected: false },
  ]);
  const [isSettingBarPosition, setIsSettingBarPosition] = useState<boolean>(false);
  const [selectedBarId, setSelectedBarId] = useState<string>('1');

  const resetState = () => {
    setIsRecording(false);
    setRecordedVideo(null);
    setIsPlaying(false);
    setBarPath([]);
    setBodyKeypoints([]);
    setFormAnalysis(null);
    setIsAnalyzing(false);
    setShowSettings(false);
    setShowBarSelection(false);
    setIsSettingBarPosition(false);
    setCurrentVelocity(0);
    setRepCount(0);
    // Reset bar positions but keep selection
    setBarTargets(prev => prev.map(bar => ({ ...bar, position: null })));
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const startRecording = async () => {
    console.log('Start recording function called');
    if (!cameraRef.current) {
      console.error('Camera reference is not available');
      Alert.alert('Error', 'Camera is not ready. Please try again.');
      return;
    }

    // Check if bar position is set when bar tracking is enabled
    const selectedBar = barTargets.find(bar => bar.isSelected);
    if (trackingSettings.barPathTracking && (!selectedBar || !selectedBar.position)) {
      Alert.alert(
        'Set Bar Position', 
        'Please set the position of the bar you want to track before recording. Tap the settings icon and select "Select Bar" to set the position.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Set Position', onPress: () => setShowBarSelection(true) }
        ]
      );
      return;
    }

    try {
      // Check permissions again before recording
      if (!cameraPermission?.granted) {
        console.log('Camera permission not granted, requesting...');
        const cameraResult = await requestCameraPermission();
        console.log('Camera permission request result:', cameraResult);
        if (!cameraResult.granted) {
          Alert.alert('Permission Error', 'Camera permission is required to record videos.');
          return;
        }
      }
      
      if (!microphonePermission?.granted) {
        console.log('Microphone permission not granted, requesting...');
        const micResult = await requestMicrophonePermission();
        console.log('Microphone permission request result:', micResult);
        if (!micResult.granted) {
          Alert.alert('Permission Error', 'Microphone permission is required to record videos.');
          return;
        }
      }
      
      // Verify permissions were granted
      if (!cameraPermission?.granted || !microphonePermission?.granted) {
        console.error('Required permissions not granted:', { 
          camera: cameraPermission?.granted, 
          microphone: microphonePermission?.granted 
        });
        Alert.alert('Permission Error', 'Camera and microphone permissions are required to record videos. Please grant these permissions in your device settings.');
        return;
      }
      
      if (Platform.OS === 'web') {
        Alert.alert('Not Supported', 'Video recording is not available on web. Please use the mobile app.');
        return;
      }

      console.log('Setting recording state to true');
      setIsRecording(true);
      setBarPath([]);
      setBodyKeypoints([]);
      console.log('Starting video recording with form tracking...');
      
      // Start form tracking if enabled
      if (trackingSettings.barPathTracking || trackingSettings.bodyAlignment) {
        startFormTracking();
      }

      console.log('Calling recordAsync on camera ref:', cameraRef.current);
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60, // 60 seconds max for form analysis
      });
      
      console.log('Recording completed, video result:', video);
      if (video && video.uri) {
        console.log('Video recorded successfully:', video.uri);
        setRecordedVideo(video.uri);
        
        // Analyze form if enabled
        if (trackingSettings.formAnalysis) {
          await analyzeForm(video.uri);
        }
      } else {
        console.error('No video returned from recordAsync or missing URI');
        Alert.alert('Recording Error', 'Failed to save the recorded video. Please try again.');
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
    console.log('Stop recording function called, isRecording:', isRecording);
    if (!cameraRef.current) {
      console.error('Camera reference is not available for stopping recording');
      setIsRecording(false);
      return;
    }
    
    if (!isRecording) {
      console.log('Not currently recording, nothing to stop');
      return;
    }

    try {
      console.log('Stopping video recording...');
      await cameraRef.current.stopRecording();
      console.log('Video recording stopped successfully');
    } catch (error) {
      console.error('Error stopping recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Stop recording error details:', errorMessage);
      Alert.alert('Error', `Failed to stop recording: ${errorMessage}`);
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
    const selectedBar = barTargets.find(bar => bar.isSelected);
    
    // Simulate real-time tracking (in a real app, this would use computer vision)
    const trackingInterval = setInterval(() => {
      if (!isRecording) {
        clearInterval(trackingInterval);
        return;
      }
      
      // Simulate realistic bar path tracking for weightlifting
      if (trackingSettings.barPathTracking && selectedBar?.position) {
        // Create more realistic bar path simulation based on selected bar position
        const time = Date.now();
        const cyclePosition = (time % 4000) / 4000; // 0 to 1 over 4 seconds
        
        // Use the selected bar's initial position as the base
        const baseX = selectedBar.position.x;
        const baseY = selectedBar.position.y;
        
        // Calculate movement relative to the selected position
        const xVariation = Math.sin(cyclePosition * Math.PI * 2) * 15; // Slight horizontal movement
        const yVariation = Math.sin(cyclePosition * Math.PI) * 80; // Vertical movement for the lift
        
        const newPoint = {
          x: baseX + xVariation,
          y: baseY + yVariation,
          timestamp: time,
        };
        
        setBarPath(prev => {
          const newPath = [...prev.slice(-30), newPoint];
          
          // Calculate velocity if we have enough points
          if (newPath.length >= 2) {
            const lastPoint = newPath[newPath.length - 2];
            const distance = Math.sqrt(
              Math.pow(newPoint.x - lastPoint.x, 2) + 
              Math.pow(newPoint.y - lastPoint.y, 2)
            );
            const timeDiff = (newPoint.timestamp - lastPoint.timestamp) / 1000; // Convert to seconds
            const velocity = distance / timeDiff / 100; // Convert to m/s (rough approximation)
            setCurrentVelocity(velocity);
          }
          
          return newPath;
        });
      }
      
      // Simulate body keypoint detection
      if (trackingSettings.bodyAlignment) {
        const keypoints = generateMockKeypoints();
        setBodyKeypoints(keypoints);
      }
    }, 50); // Update every 50ms for smoother tracking
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

  const selectBar = (barId: string) => {
    setBarTargets(prev => prev.map(bar => ({
      ...bar,
      isSelected: bar.id === barId
    })));
    setSelectedBarId(barId);
  };

  const handleCameraPress = (event: any) => {
    if (!isSettingBarPosition) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const selectedBar = barTargets.find(bar => bar.isSelected);
    
    if (selectedBar) {
      setBarTargets(prev => prev.map(bar => 
        bar.id === selectedBar.id 
          ? { ...bar, position: { x: locationX, y: locationY } }
          : bar
      ));
      setIsSettingBarPosition(false);
      setShowBarSelection(false);
    }
  };

  const startBarPositioning = () => {
    setIsSettingBarPosition(true);
  };

  const cancelBarPositioning = () => {
    setIsSettingBarPosition(false);
    setShowBarSelection(false);
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
    console.log('Permissions not initialized yet');
    // Instead of returning null, show a loading state
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Loading Camera...</Text>
          <Text style={styles.permissionText}>Please wait while we initialize the camera</Text>
        </View>
      </Modal>
    );
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
          <TouchableOpacity style={styles.permissionButton} onPress={async () => {
            console.log('Requesting camera and microphone permissions...');
            const cameraResult = await requestCameraPermission();
            const micResult = await requestMicrophonePermission();
            console.log('Permission request results:', { camera: cameraResult, microphone: micResult });
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
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => setShowBarSelection(true)}
                >
                  <Target color="#6366f1" size={20} />
                  <Text style={styles.settingLabel}>Select Bar</Text>
                  <View style={[styles.barIndicator, { backgroundColor: barTargets.find(b => b.isSelected)?.color || '#6366f1' }]} />
                </TouchableOpacity>
                
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
            <TouchableOpacity
              style={styles.cameraWrapper}
              onPress={handleCameraPress}
              activeOpacity={1}
              disabled={!isSettingBarPosition}
            >
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                mode="video"
                testID="camera-view"
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
              
              {/* Live metrics display when recording */}
              {isRecording && trackingSettings.barPathTracking && barPath.length > 0 && (
                <View style={styles.metricsOverlay}>
                  <View style={styles.weightDisplay}>
                    <Text style={styles.weightValue}>45kg</Text>
                    <Text style={styles.weightRep}>{repCount + 1}/3</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricValue}>{currentVelocity.toFixed(2)}</Text>
                    <Text style={styles.metricLabel}>M. Velocity (M/S)</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricValue}>{barTargets.find(b => b.isSelected)?.name || 'Bar'}</Text>
                    <Text style={styles.metricLabel}>Tracking</Text>
                  </View>
                </View>
              )}
              
              {/* Bar position indicators when setting up */}
              {!isRecording && (
                <View style={styles.overlayContainer}>
                  <Svg style={styles.overlay} width="100%" height="100%">
                    {barTargets.map(bar => (
                      bar.position && (
                        <Circle
                          key={`bar-${bar.id}`}
                          cx={bar.position.x}
                          cy={bar.position.y}
                          r={bar.isSelected ? "16" : "12"}
                          fill={bar.color}
                          stroke="#ffffff"
                          strokeWidth={bar.isSelected ? "3" : "2"}
                          opacity={bar.isSelected ? 1 : 0.7}
                        />
                      )
                    ))}
                  </Svg>
                </View>
              )}
              
              {/* Real-time form overlay */}
              {trackingSettings.realTimeOverlay && isRecording && (
                <View style={styles.overlayContainer}>
                  <Svg style={styles.overlay} width="100%" height="100%">
                    {/* Enhanced bar path visualization */}
                    {trackingSettings.barPathTracking && barPath.length > 1 && (
                      <>
                        {/* Shadow/glow effect for better visibility */}
                        <Path
                          d={barPath.map((point, index) => 
                            index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
                          ).join(' ')}
                          stroke="#000000"
                          strokeWidth="10"
                          fill="none"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          opacity={0.5}
                        />
                        
                        {/* Main path line - thicker and more visible */}
                        <Path
                          d={barPath.map((point, index) => 
                            index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
                          ).join(' ')}
                          stroke={barTargets.find(b => b.isSelected)?.color || '#22c55e'}
                          strokeWidth="6"
                          fill="none"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        
                        {/* Path points for better visibility */}
                        {barPath.map((point, index) => (
                          index % 3 === 0 && (
                            <Circle
                              key={`path-point-${index}`}
                              cx={point.x}
                              cy={point.y}
                              r="3"
                              fill="#ffffff"
                              opacity={0.6}
                            />
                          )
                        ))}
                        
                        {/* Start position marker */}
                        {barPath.length > 0 && (
                          <>
                            <Circle
                              cx={barPath[0].x}
                              cy={barPath[0].y}
                              r="16"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="4"
                            />
                            <Circle
                              cx={barPath[0].x}
                              cy={barPath[0].y}
                              r="8"
                              fill="#10b981"
                            />
                          </>
                        )}
                        
                        {/* Current bar position with larger indicator */}
                        {barPath.length > 0 && (
                          <>
                            {/* Outer glow */}
                            <Circle
                              cx={barPath[barPath.length - 1].x}
                              cy={barPath[barPath.length - 1].y}
                              r="24"
                              fill="none"
                              stroke={barTargets.find(b => b.isSelected)?.color || '#22c55e'}
                              strokeWidth="3"
                              opacity={0.3}
                            />
                            
                            {/* Middle ring */}
                            <Circle
                              cx={barPath[barPath.length - 1].x}
                              cy={barPath[barPath.length - 1].y}
                              r="18"
                              fill="none"
                              stroke={barTargets.find(b => b.isSelected)?.color || '#22c55e'}
                              strokeWidth="2"
                              opacity={0.6}
                            />
                            
                            {/* Main position indicator */}
                            <Circle
                              cx={barPath[barPath.length - 1].x}
                              cy={barPath[barPath.length - 1].y}
                              r="12"
                              fill={barTargets.find(b => b.isSelected)?.color || '#22c55e'}
                              stroke="#ffffff"
                              strokeWidth="4"
                            />
                          </>
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
              
              {/* Bar positioning instructions */}
              {isSettingBarPosition && (
                <View style={styles.positioningInstructions}>
                  <Text style={styles.positioningText}>Tap on the {barTargets.find(b => b.isSelected)?.name} to set tracking position</Text>
                </View>
              )}
            </CameraView>
            </TouchableOpacity>
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
                testID="record-button"
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
                  <Text style={styles.analysisMetricLabel}>Shoulder Level</Text>
                  <Text style={styles.analysisMetricValue}>
                    {Math.round(formAnalysis.bodyAlignment[0]?.shoulderLevel * 100)}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.analysisMetricLabel}>Hip Level</Text>
                  <Text style={styles.analysisMetricValue}>
                    {Math.round(formAnalysis.bodyAlignment[0]?.hipLevel * 100)}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.analysisMetricLabel}>Knee Alignment</Text>
                  <Text style={styles.analysisMetricValue}>
                    {Math.round(formAnalysis.bodyAlignment[0]?.kneeAlignment * 100)}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.analysisMetricLabel}>Back Angle</Text>
                  <Text style={styles.analysisMetricValue}>
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

        {/* Bar Selection Modal */}
        <Modal visible={showBarSelection} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.barSelectionModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Bar to Track</Text>
                <TouchableOpacity onPress={() => setShowBarSelection(false)}>
                  <X color="#6b7280" size={24} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.barOptions}>
                {barTargets.map(bar => (
                  <TouchableOpacity
                    key={bar.id}
                    style={[
                      styles.barOption,
                      bar.isSelected && styles.barOptionSelected
                    ]}
                    onPress={() => selectBar(bar.id)}
                  >
                    <View style={[styles.barColorIndicator, { backgroundColor: bar.color }]} />
                    <Text style={[
                      styles.barOptionText,
                      bar.isSelected && styles.barOptionTextSelected
                    ]}>
                      {bar.name}
                    </Text>
                    {bar.position && (
                      <Text style={styles.positionSet}>✓ Position Set</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.setPositionButton}
                  onPress={startBarPositioning}
                >
                  <Target color="#ffffff" size={20} />
                  <Text style={styles.setPositionButtonText}>Set Position</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={() => setShowBarSelection(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
                ? `Recording... Tap the square to stop (max 60 seconds)${(trackingSettings.barPathTracking || trackingSettings.bodyAlignment) ? ' • Live tracking active' : ''}`
                : isSettingBarPosition
                ? 'Tap on the equipment in the camera view to set tracking position'
                : 'Set bar position in settings, then tap record to start filming with live tracking'
              }
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  metricsOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'column',
  },
  metricBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    minWidth: 120,
  },
  metricValue: {
    color: '#22c55e',
    fontSize: 28,
    fontWeight: 'bold' as const,
  },
  metricLabel: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 2,
  },
  weightDisplay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 120,
  },
  weightValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  weightRep: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 10,
    opacity: 0.8,
  },
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
  analysisMetricLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  analysisMetricValue: {
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
  cameraWrapper: {
    flex: 1,
  },
  barIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  positioningInstructions: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
  },
  positioningText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  barSelectionModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#1f2937',
  },
  barOptions: {
    padding: 20,
  },
  barOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  barOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  barColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  barOptionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  barOptionTextSelected: {
    color: '#1f2937',
    fontWeight: '600' as const,
  },
  positionSet: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600' as const,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  setPositionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
  },
  setPositionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  doneButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  doneButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});