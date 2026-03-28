import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import {
  Camera,
  X,
  Plus,
  Trash2,
  TrendingUp,
  Weight,
  Image as ImageIcon,
  VideoIcon,
  Play,
} from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFitnessStore } from '@/store/fitness-store';
import { ClientPhoto, BodyWeight, VideoRecord } from '@/types';

interface ClientProgressManagerProps {
  clientId: string;
}



export default function ClientProgressManager({ clientId }: ClientProgressManagerProps) {
  const {
    clients,
    exercises,
    addClientPhoto,
    deleteClientPhoto,
    addBodyWeight,
    updateBodyWeight,
    deleteBodyWeight,
    addVideoRecord,
    getClientVideoRecords,
    deleteVideoRecord,
    measurementSettings,
  } = useFitnessStore();

  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'weight'>('photos');
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [editingWeight, setEditingWeight] = useState<BodyWeight | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [bodyFatInput, setBodyFatInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<ClientPhoto | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [videoNotes, setVideoNotes] = useState('');
  const [videoWeight, setVideoWeight] = useState('');
  const [videoReps, setVideoReps] = useState('');
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);

  const client = clients.find(c => c.id === clientId);
  const photos = client?.photos || [];
  const bodyWeights = client?.bodyWeights || [];
  const videoRecords = getClientVideoRecords(clientId);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Alert.alert(
        'Add Photo',
        'What type of photo is this?',
        [
          {
            text: 'Before',
            onPress: () => savePhoto(result.assets[0].uri, 'before'),
          },
          {
            text: 'After',
            onPress: () => savePhoto(result.assets[0].uri, 'after'),
          },
          {
            text: 'Progress',
            onPress: () => savePhoto(result.assets[0].uri, 'progress'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Alert.alert(
        'Add Photo',
        'What type of photo is this?',
        [
          {
            text: 'Before',
            onPress: () => savePhoto(result.assets[0].uri, 'before'),
          },
          {
            text: 'After',
            onPress: () => savePhoto(result.assets[0].uri, 'after'),
          },
          {
            text: 'Progress',
            onPress: () => savePhoto(result.assets[0].uri, 'progress'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const savePhoto = (uri: string, type: 'before' | 'after' | 'progress') => {
    addClientPhoto(clientId, {
      uri,
      type,
      date: new Date().toISOString(),
    });
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant media library permissions to add videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 300, // 5 minutes max
    });

    if (!result.canceled && result.assets[0]) {
      setPendingVideoUri(result.assets[0].uri);
      setShowAddVideoModal(true);
    }
  };

  const saveVideo = () => {
    if (!pendingVideoUri || !selectedExerciseId || !videoWeight || !videoReps) {
      Alert.alert('Error', 'Please fill in all required fields (exercise, weight, reps)');
      return;
    }

    const weight = parseFloat(videoWeight);
    const reps = parseInt(videoReps);

    if (isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
      Alert.alert('Error', 'Please enter valid weight and reps values');
      return;
    }

    addVideoRecord({
      clientId,
      exerciseId: selectedExerciseId,
      workoutId: 'manual_upload', // Special ID for manually uploaded videos
      setId: 'manual_upload',
      videoUri: pendingVideoUri,
      weight,
      reps,
      notes: videoNotes,
    });

    // Reset form
    setPendingVideoUri(null);
    setSelectedExerciseId('');
    setVideoWeight('');
    setVideoReps('');
    setVideoNotes('');
    setShowAddVideoModal(false);
  };

  const handleDeleteVideo = (videoId: string) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteVideoRecord(videoId),
        },
      ]
    );
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteClientPhoto(clientId, photoId),
        },
      ]
    );
  };

  const handleAddWeight = () => {
    if (!weightInput) {
      Alert.alert('Error', 'Please enter a weight value');
      return;
    }

    const weight = parseFloat(weightInput);
    const bodyFat = bodyFatInput ? parseFloat(bodyFatInput) : undefined;

    if (editingWeight) {
      updateBodyWeight(clientId, editingWeight.id, {
        weight,
        bodyFat,
        notes: notesInput,
      });
      setEditingWeight(null);
    } else {
      addBodyWeight(clientId, {
        weight,
        bodyFat,
        notes: notesInput,
        date: new Date().toISOString(),
      });
    }

    setWeightInput('');
    setBodyFatInput('');
    setNotesInput('');
    setShowAddWeight(false);
  };

  const handleEditWeight = (weight: BodyWeight) => {
    setEditingWeight(weight);
    setWeightInput(weight.weight.toString());
    setBodyFatInput(weight.bodyFat?.toString() || '');
    setNotesInput(weight.notes || '');
    setShowAddWeight(true);
  };

  const handleDeleteWeight = (weightId: string) => {
    Alert.alert(
      'Delete Weight Entry',
      'Are you sure you want to delete this weight entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteBodyWeight(clientId, weightId),
        },
      ]
    );
  };

  const getChartData = () => {
    if (bodyWeights.length === 0) {
      return null;
    }

    const sortedWeights = [...bodyWeights].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedWeights.slice(-7).map(w => {
      const date = new Date(w.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = sortedWeights.slice(-7).map(w => w.weight);
    const bodyFatData = sortedWeights.slice(-7).map(w => w.bodyFat || 0);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 2,
        },
        ...(bodyFatData.some(bf => bf > 0) ? [{
          data: bodyFatData,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2,
        }] : []),
      ],
      legend: bodyFatData.some(bf => bf > 0) ? ['Weight', 'Body Fat %'] : ['Weight'],
    };
  };

  const chartData = getChartData();
  const weightUnit = measurementSettings.weightUnit === 'metric' ? 'kg' : 'lbs';

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => setActiveTab('photos')}
        >
          <ImageIcon size={20} color={activeTab === 'photos' ? '#6366f1' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
            Photos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
          onPress={() => setActiveTab('videos')}
        >
          <VideoIcon size={20} color={activeTab === 'videos' ? '#6366f1' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>
            Videos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weight' && styles.activeTab]}
          onPress={() => setActiveTab('weight')}
        >
          <TrendingUp size={20} color={activeTab === 'weight' ? '#6366f1' : '#6b7280'} />
          <Text style={[styles.tabText, activeTab === 'weight' && styles.activeTabText]}>
            Body Weight
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Camera size={20} color="#ffffff" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <ImageIcon size={20} color="#ffffff" />
              <Text style={styles.photoButtonText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>

          {photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoCard}
                  onPress={() => setSelectedPhoto(photo)}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <View style={styles.photoOverlay}>
                    <Text style={styles.photoType}>{photo.type.toUpperCase()}</Text>
                    <Text style={styles.photoDate}>
                      {new Date(photo.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.photoDelete}
                    onPress={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 size={16} color="#ffffff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ImageIcon size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No photos yet</Text>
              <Text style={styles.emptySubtext}>
                Add before/after photos to track progress
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.photoButton} onPress={pickVideo}>
            <VideoIcon size={20} color="#ffffff" />
            <Text style={styles.photoButtonText}>Add Video from Library</Text>
          </TouchableOpacity>

          {videoRecords.length > 0 ? (
            <View style={styles.videoList}>
              {videoRecords
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((video) => (
                  <View key={video.id} style={styles.videoCard}>
                    <TouchableOpacity
                      style={styles.videoThumbnail}
                      onPress={() => setSelectedVideo(video)}
                    >
                      <Video
                        source={{ uri: video.videoUri }}
                        style={styles.videoPreview}
                        shouldPlay={false}
                        isLooping={false}
                        resizeMode={ResizeMode.COVER}
                      />
                      <View style={styles.videoPlayOverlay}>
                        <Play color="#ffffff" size={32} />
                      </View>
                    </TouchableOpacity>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoExercise}>
                        {getExerciseName(video.exerciseId)}
                      </Text>
                      <Text style={styles.videoStats}>
                        {video.weight}kg × {video.reps} reps
                      </Text>
                      <Text style={styles.videoDate}>
                        {new Date(video.date).toLocaleDateString()}
                      </Text>
                      {video.notes && (
                        <Text style={styles.videoNotes}>{video.notes}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.videoDelete}
                      onPress={() => handleDeleteVideo(video.id)}
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <VideoIcon size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No videos yet</Text>
              <Text style={styles.emptySubtext}>
                Add exercise videos from your phone&apos;s library
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Weight Tab */}
      {activeTab === 'weight' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.addWeightButton}
            onPress={() => setShowAddWeight(true)}
          >
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addWeightText}>Add Weight Entry</Text>
          </TouchableOpacity>

          {chartData && bodyWeights.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Weight Progress</Text>
              <LineChart
                data={chartData}
                width={Dimensions.get('window').width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#6366f1',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          {bodyWeights.length > 0 ? (
            <View style={styles.weightList}>
              {bodyWeights
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((weight) => (
                  <View key={weight.id} style={styles.weightCard}>
                    <View style={styles.weightInfo}>
                      <Text style={styles.weightValue}>
                        {weight.weight} {weightUnit}
                      </Text>
                      {weight.bodyFat && (
                        <Text style={styles.bodyFatValue}>
                          {weight.bodyFat}% body fat
                        </Text>
                      )}
                      <Text style={styles.weightDate}>
                        {new Date(weight.date).toLocaleDateString()}
                      </Text>
                      {weight.notes && (
                        <Text style={styles.weightNotes}>{weight.notes}</Text>
                      )}
                    </View>
                    <View style={styles.weightActions}>
                      <TouchableOpacity
                        style={styles.weightActionButton}
                        onPress={() => handleEditWeight(weight)}
                      >
                        <Text style={styles.editText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.weightActionButton}
                        onPress={() => handleDeleteWeight(weight.id)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Weight size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No weight entries yet</Text>
              <Text style={styles.emptySubtext}>
                Track body weight to monitor progress
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Weight Modal */}
      <Modal
        visible={showAddWeight}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddWeight(false);
          setEditingWeight(null);
          setWeightInput('');
          setBodyFatInput('');
          setNotesInput('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingWeight ? 'Edit Weight Entry' : 'Add Weight Entry'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddWeight(false);
                  setEditingWeight(null);
                  setWeightInput('');
                  setBodyFatInput('');
                  setNotesInput('');
                }}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight ({weightUnit})</Text>
              <TextInput
                style={styles.input}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                placeholder={`Enter weight in ${weightUnit}`}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Body Fat % (optional)</Text>
              <TextInput
                style={styles.input}
                value={bodyFatInput}
                onChangeText={setBodyFatInput}
                keyboardType="decimal-pad"
                placeholder="Enter body fat percentage"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notesInput}
                onChangeText={setNotesInput}
                placeholder="Add any notes"
                multiline
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddWeight}>
              <Text style={styles.saveButtonText}>
                {editingWeight ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <TouchableOpacity
          style={styles.photoViewerOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPhoto(null)}
        >
          {selectedPhoto && (
            <View style={styles.photoViewerContent}>
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.fullPhoto}
                resizeMode="contain"
              />
              <View style={styles.photoViewerInfo}>
                <Text style={styles.photoViewerType}>
                  {selectedPhoto.type.toUpperCase()}
                </Text>
                <Text style={styles.photoViewerDate}>
                  {new Date(selectedPhoto.date).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closePhotoViewer}
                onPress={() => setSelectedPhoto(null)}
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      {/* Add Video Modal */}
      <Modal
        visible={showAddVideoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddVideoModal(false);
          setPendingVideoUri(null);
          setSelectedExerciseId('');
          setVideoWeight('');
          setVideoReps('');
          setVideoNotes('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise Video</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddVideoModal(false);
                  setPendingVideoUri(null);
                  setSelectedExerciseId('');
                  setVideoWeight('');
                  setVideoReps('');
                  setVideoNotes('');
                }}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {pendingVideoUri && (
              <View style={styles.videoPreviewContainer}>
                <Video
                  source={{ uri: pendingVideoUri }}
                  style={styles.modalVideoPreview}
                  shouldPlay={false}
                  isLooping={false}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Exercise *</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Select Exercise',
                      'Choose the exercise this video demonstrates:',
                      [
                        ...exercises.map(exercise => ({
                          text: exercise.name,
                          onPress: () => setSelectedExerciseId(exercise.id),
                        })),
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Text style={[styles.pickerText, !selectedExerciseId && styles.placeholderText]}>
                    {selectedExerciseId ? getExerciseName(selectedExerciseId) : 'Select an exercise'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Weight ({weightUnit}) *</Text>
                <TextInput
                  style={styles.input}
                  value={videoWeight}
                  onChangeText={setVideoWeight}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Reps *</Text>
                <TextInput
                  style={styles.input}
                  value={videoReps}
                  onChangeText={setVideoReps}
                  keyboardType="number-pad"
                  placeholder="0"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={videoNotes}
                onChangeText={setVideoNotes}
                placeholder="Add any notes about this video"
                multiline
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveVideo}>
              <Text style={styles.saveButtonText}>Save Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Video Viewer Modal */}
      <Modal
        visible={!!selectedVideo}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setSelectedVideo(null);
          setIsVideoPlaying(false);
        }}
      >
        <TouchableOpacity
          style={styles.photoViewerOverlay}
          activeOpacity={1}
          onPress={() => {
            setSelectedVideo(null);
            setIsVideoPlaying(false);
          }}
        >
          {selectedVideo && (
            <View style={styles.videoViewerContent}>
              <Video
                source={{ uri: selectedVideo.videoUri }}
                style={styles.fullVideo}
                shouldPlay={isVideoPlaying}
                isLooping={false}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
              />
              <View style={styles.videoViewerInfo}>
                <Text style={styles.videoViewerExercise}>
                  {getExerciseName(selectedVideo.exerciseId)}
                </Text>
                <Text style={styles.videoViewerStats}>
                  {selectedVideo.weight}kg × {selectedVideo.reps} reps
                </Text>
                <Text style={styles.videoViewerDate}>
                  {new Date(selectedVideo.date).toLocaleDateString()}
                </Text>
                {selectedVideo.notes && (
                  <Text style={styles.videoViewerNotes}>{selectedVideo.notes}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.closePhotoViewer}
                onPress={() => {
                  setSelectedVideo(null);
                  setIsVideoPlaying(false);
                }}
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  activeTabText: {
    color: '#6366f1',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: '47%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
  },
  photoType: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  photoDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
  photoDelete: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    padding: 6,
  },
  addWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 20,
  },
  addWeightText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  weightList: {
    gap: 12,
  },
  weightCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  weightInfo: {
    flex: 1,
  },
  weightValue: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#1f2937',
  },
  bodyFatValue: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 2,
  },
  weightDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  weightNotes: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  weightActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  weightActionButton: {
    padding: 8,
  },
  editText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#1f2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhoto: {
    width: '90%',
    height: '80%',
  },
  photoViewerInfo: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  photoViewerType: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  photoViewerDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  closePhotoViewer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  videoList: {
    gap: 16,
    marginTop: 20,
  },
  videoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
  },
  videoExercise: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 4,
  },
  videoStats: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  videoDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  videoNotes: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic' as const,
  },
  videoDelete: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 8,
  },
  videoPreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000000',
  },
  modalVideoPreview: {
    width: '100%',
    height: '100%',
  },
  pickerContainer: {
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  pickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  videoViewerContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullVideo: {
    width: '90%',
    height: '70%',
  },
  videoViewerInfo: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  videoViewerExercise: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  videoViewerStats: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  videoViewerDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  videoViewerNotes: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontStyle: 'italic' as const,
    textAlign: 'center',
  },
});