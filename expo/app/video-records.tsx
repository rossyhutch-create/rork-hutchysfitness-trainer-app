import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { 
  VideoIcon, 
  X, 
  Play, 
  Pause, 
  Calendar, 
  Weight, 
  Target,
  User,
  Dumbbell,
  Trash2,
  TrendingUp,
  Activity
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitnessStore } from '@/store/fitness-store';
import { colors } from '@/constants/branding';
import BarPathTracker from '@/components/BarPathTracker';
import SkeletalTracker from '@/components/SkeletalTracker';
import type { VideoRecord, Client, Exercise } from '@/types';

export default function VideoRecordsScreen() {
  const { videoRecords, clients, exercises, loadData, deleteVideoRecord } = useFitnessStore();
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<Video>(null);
  const lastStatusRef = useRef<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('all');
  const [showBarPathTracker, setShowBarPathTracker] = useState<boolean>(false);
  const [showSkeletalTracker, setShowSkeletalTracker] = useState<boolean>(false);
  const [trackingVideo, setTrackingVideo] = useState<VideoRecord | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRecords = videoRecords.filter(record => {
    const clientMatch = selectedClientId === 'all' || record.clientId === selectedClientId;
    const exerciseMatch = selectedExerciseId === 'all' || record.exerciseId === selectedExerciseId;
    return clientMatch && exerciseMatch;
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Unknown Client';
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  const handleVideoPress = (record: VideoRecord) => {
    setSelectedVideo(record);
    setIsPlaying(false);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
  };

  const togglePlayback = async () => {
    try {
      if (!videoRef.current) {
        setIsPlaying(prev => !prev);
        return;
      }
      const status = lastStatusRef.current;
      if (status?.isLoaded) {
        const pos = status.positionMillis ?? 0;
        const dur = status.durationMillis ?? 0;
        const atEnd = status.didJustFinish || (dur > 0 && pos >= Math.max(0, dur - 250));
        if (isPlaying) {
          await videoRef.current.pauseAsync();
          return;
        }
        if (atEnd) {
          await videoRef.current.setPositionAsync(0);
        }
        await videoRef.current.playAsync();
        setIsPlaying(true);
      } else {
        setIsPlaying(prev => !prev);
      }
    } catch (e) {
      console.log('togglePlayback error', e);
      setIsPlaying(false);
    }
  };

  const handleDeleteVideo = (record: VideoRecord) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteVideoRecord(record.id);
            if (selectedVideo?.id === record.id) {
              closeVideoModal();
            }
          },
        },
      ]
    );
  };

  const handleBarPathTracking = (record: VideoRecord) => {
    setTrackingVideo(record);
    setShowBarPathTracker(true);
    if (selectedVideo?.id === record.id) {
      closeVideoModal();
    }
  };

  const closeBarPathTracker = () => {
    setShowBarPathTracker(false);
    setTrackingVideo(null);
  };

  const handleSkeletalTracking = (record: VideoRecord) => {
    setTrackingVideo(record);
    setShowSkeletalTracker(true);
    if (selectedVideo?.id === record.id) {
      closeVideoModal();
    }
  };

  const closeSkeletalTracker = () => {
    setShowSkeletalTracker(false);
    setTrackingVideo(null);
  };

  const handleSaveAnalysis = (analysis: any) => {
    console.log('Bar path analysis saved:', analysis);
    // Here you could save the analysis to your store or backend
  };

  const renderVideoRecord = ({ item }: { item: VideoRecord }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => handleVideoPress(item)}
    >
      <View style={styles.videoThumbnail}>
        <VideoIcon color="#6366f1" size={32} />
      </View>
      
      <View style={styles.videoInfo}>
        <Text style={styles.exerciseName}>{getExerciseName(item.exerciseId)}</Text>
        <View style={styles.clientInfo}>
          <User color="#6b7280" size={14} />
          <Text style={styles.clientName}>{getClientName(item.clientId)}</Text>
        </View>
        
        <View style={styles.videoStats}>
          <View style={styles.statItem}>
            <Weight color="#6b7280" size={14} />
            <Text style={styles.statText}>{item.weight}kg</Text>
          </View>
          <View style={styles.statItem}>
            <Target color="#6b7280" size={14} />
            <Text style={styles.statText}>{item.reps} reps</Text>
          </View>
          <View style={styles.statItem}>
            <Calendar color="#6b7280" size={14} />
            <Text style={styles.statText}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={(e) => {
            e.stopPropagation();
            handleBarPathTracking(item);
          }}
        >
          <TrendingUp color="#6366f1" size={16} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={(e) => {
            e.stopPropagation();
            handleSkeletalTracking(item);
          }}
        >
          <Activity color="#10b981" size={16} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteVideo(item);
          }}
        >
          <Trash2 color="#ef4444" size={18} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (
    label: string,
    value: string,
    selectedValue: string,
    onPress: (value: string) => void
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedValue === value && styles.filterButtonActive
      ]}
      onPress={() => onPress(value)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedValue === value && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          title: 'Video Records',
          headerShown: false,
        }} 
      />

      <View style={styles.header}>
        <Text style={styles.title}>Video Records</Text>
        <Text style={styles.subtitle}>
          {filteredRecords.length} video{filteredRecords.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Client:</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All Clients' }, ...clients]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => 
            renderFilterButton(
              item.name,
              item.id,
              selectedClientId,
              setSelectedClientId
            )
          }
          contentContainerStyle={styles.filterList}
        />
        
        <Text style={styles.filterLabel}>Exercise:</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All Exercises' }, ...exercises]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => 
            renderFilterButton(
              item.name,
              item.id,
              selectedExerciseId,
              setSelectedExerciseId
            )
          }
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Video List */}
      {filteredRecords.length === 0 ? (
        <View style={styles.emptyContainer}>
          <VideoIcon color="#9ca3af" size={64} />
          <Text style={styles.emptyTitle}>No video records</Text>
          <Text style={styles.emptyText}>
            Start recording exercise videos during workouts to build your video library
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          renderItem={renderVideoRecord}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.videoList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Video Player Modal */}
      <Modal
        visible={!!selectedVideo}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedVideo && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={closeVideoModal}>
                <X color="#ffffff" size={24} />
              </TouchableOpacity>
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalTitle}>
                  {getExerciseName(selectedVideo.exerciseId)}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {getClientName(selectedVideo.clientId)} - {selectedVideo.weight}kg × {selectedVideo.reps}
                </Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => handleBarPathTracking(selectedVideo)}
                >
                  <TrendingUp color="#6366f1" size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => handleSkeletalTracking(selectedVideo)}
                >
                  <Activity color="#10b981" size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalDeleteButton}
                  onPress={() => handleDeleteVideo(selectedVideo)}
                >
                  <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.videoContainer}>
              {Platform.OS !== 'web' ? (
                <Video
                  ref={videoRef}
                  source={{ uri: selectedVideo.videoUri }}
                  style={styles.video}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={isPlaying}
                  isLooping={false}
                  useNativeControls={false}
                  onPlaybackStatusUpdate={(status: any) => {
                    lastStatusRef.current = status;
                    if (status.isLoaded) {
                      if ('didJustFinish' in status && status.didJustFinish) {
                        setIsPlaying(false);
                      } else if ('isPlaying' in status) {
                        setIsPlaying(status.isPlaying ?? false);
                      }
                    }
                  }}
                />
              ) : (
                <View style={styles.webVideoPlaceholder}>
                  <VideoIcon color="#6b7280" size={64} />
                  <Text style={styles.webVideoText}>
                    Video playback not available on web
                  </Text>
                </View>
              )}
              
              {Platform.OS !== 'web' && !isPlaying && (
                <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
                  <Play color="#ffffff" size={32} />
                </TouchableOpacity>
              )}
              {Platform.OS !== 'web' && isPlaying && (
                <TouchableOpacity style={styles.pauseButton} onPress={togglePlayback}>
                  <Pause color="#ffffff" size={32} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.videoDetails}>
              <Text style={styles.detailsTitle}>Exercise Details</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedVideo.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>{selectedVideo.weight}kg</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Reps</Text>
                  <Text style={styles.detailValue}>{selectedVideo.reps}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Volume</Text>
                  <Text style={styles.detailValue}>
                    {selectedVideo.weight * selectedVideo.reps}kg
                  </Text>
                </View>
              </View>
              {selectedVideo.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{selectedVideo.notes}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>

      {/* Bar Path Tracker Modal */}
      {trackingVideo && (
        <BarPathTracker
          visible={showBarPathTracker}
          onClose={closeBarPathTracker}
          videoUri={trackingVideo.videoUri}
          exerciseName={getExerciseName(trackingVideo.exerciseId)}
          clientName={getClientName(trackingVideo.clientId)}
          onSaveAnalysis={handleSaveAnalysis}
        />
      )}

      {/* Skeletal Tracker Modal */}
      {trackingVideo && (
        <SkeletalTracker
          visible={showSkeletalTracker}
          onClose={closeSkeletalTracker}
          videoUri={trackingVideo.videoUri}
          exerciseName={getExerciseName(trackingVideo.exerciseId)}
          clientName={getClientName(trackingVideo.clientId)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  filterList: {
    paddingBottom: 8,
  },
  filterButton: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  videoList: {
    padding: 20,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  videoThumbnail: {
    width: 60,
    height: 60,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  videoInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginBottom: 4,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  videoStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
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
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
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
  modalHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalActionButton: {
    padding: 8,
  },
  modalDeleteButton: {
    padding: 8,
  },
  cardActions: {
    flexDirection: 'column',
    gap: 8,
  },
  trackButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  webVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webVideoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 16,
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
  pauseButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDetails: {
    backgroundColor: colors.cardBackground,
    padding: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.text,
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  notesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});