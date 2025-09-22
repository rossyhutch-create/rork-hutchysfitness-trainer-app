import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,

  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, TrendingUp, User, X, Filter, Trash2, Info, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFitnessStore } from '@/store/fitness-store';
import { colors } from '@/constants/branding';
import type { PersonalRecord, Client } from '@/types';

interface PRCardProps {
  item: PersonalRecord;
  isSelected: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
  formatWeight: (weight: number) => string;
  getExerciseName: (exerciseId: string) => string;
  viewPRDetails: (pr: PersonalRecord) => void;
}

const PRCard: React.FC<PRCardProps> = ({
  item,
  isSelected,
  selectionMode,
  onPress,
  onLongPress,
  onDelete,
  formatWeight,
  getExerciseName,
  viewPRDetails,
}) => {
  const isWeightPR = item.type === 'max_weight';
  const gradientColors: [string, string] = isWeightPR ? ['#f093fb', '#f5576c'] : ['#4facfe', '#00f2fe'];
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleLongPress = () => {
    if (!selectionMode) {
      if (Platform.OS === 'web') {
        onDelete();
        return;
      }
      
      setShowDeleteConfirm(true);
    } else {
      onLongPress();
    }
  };
  
  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };
  
  return (
    <View style={styles.prCardContainer}>
      {showDeleteConfirm && (
        <View style={styles.deleteConfirmOverlay}>
          <View style={styles.deleteConfirmDialog}>
            <Text style={styles.deleteConfirmTitle}>Delete Record</Text>
            <Text style={styles.deleteConfirmText}>
              Are you sure you want to delete this {isWeightPR ? 'weight' : 'volume'} PR for {getExerciseName(item.exerciseId)}?
            </Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity 
                style={[styles.deleteConfirmButton, styles.cancelButton]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteConfirmButton, styles.confirmButton]}
                onPress={handleDeleteConfirm}
              >
                <Trash2 color="#ffffff" size={16} />
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.prCard}>
        <TouchableOpacity 
          onPress={onPress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          activeOpacity={0.8}
          testID={`pr-card-${item.id}`}
        >
          <LinearGradient
            colors={gradientColors}
            style={[styles.prGradient, isSelected && styles.selectedPR]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.prHeader}>
              <View style={styles.prIcon}>
                {isWeightPR ? (
                  <Trophy color="#ffffff" size={20} />
                ) : (
                  <TrendingUp color="#ffffff" size={20} />
                )}
              </View>
              <View style={styles.prInfo}>
                <Text style={styles.prType}>
                  {isWeightPR ? 'Max Weight PR' : 'Volume PR'}
                </Text>
                <Text style={styles.prValue}>
                  {isWeightPR ? formatWeight(item.value) : `${item.value.toFixed(0)} kg`}
                </Text>
              </View>
              {selectionMode ? (
                <View style={[styles.checkboxContainer, isSelected && styles.checkboxSelected]}>
                  {isSelected && <View style={styles.checkboxInner} />}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={onDelete}
                >
                  <Trash2 color="rgba(255, 255, 255, 0.8)" size={20} />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.prExercise}>{getExerciseName(item.exerciseId)}</Text>
            <Text style={styles.prDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            
            {!selectionMode && (
              <TouchableOpacity 
                style={styles.detailsButton}
                onPress={() => viewPRDetails(item)}
              >
                <Info color="rgba(255, 255, 255, 0.8)" size={16} />
                <Text style={styles.detailsButtonText}>Details</Text>
                <ChevronRight color="rgba(255, 255, 255, 0.8)" size={16} />
              </TouchableOpacity>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function PersonalBestsScreen() {
  const { 
    personalRecords, 
    clients, 
    exercises, 
    loadData, 
    isLoading,
    formatWeight,
    deletePersonalRecord 
  } = useFitnessStore();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState<boolean>(false);
  const [filteredPRs, setFilteredPRs] = useState<PersonalRecord[]>([]);
  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);
  const [showPRDetailModal, setShowPRDetailModal] = useState<boolean>(false);
  const [selectedPR, setSelectedPR] = useState<PersonalRecord | null>(null);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedClient) {
      const clientPRs = personalRecords.filter(pr => pr.clientId === selectedClient.id);
      const sortedPRs = clientPRs.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setFilteredPRs(sortedPRs);
    } else {
      setFilteredPRs([]);
    }
  }, [personalRecords, selectedClient]);

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

  const getClientPRStats = (clientId: string) => {
    const clientPRs = personalRecords.filter(pr => pr.clientId === clientId);
    const weightPRs = clientPRs.filter(pr => pr.type === 'max_weight').length;
    const volumePRs = clientPRs.filter(pr => pr.type === 'max_volume').length;
    return { total: clientPRs.length, weight: weightPRs, volume: volumePRs };
  };

  const renderClientCard = ({ item }: { item: Client }) => {
    const stats = getClientPRStats(item.id);
    
    return (
      <TouchableOpacity
        style={styles.clientCard}
        onPress={() => {
          setSelectedClient(item);
          setShowClientModal(false);
        }}
      >
        <View style={styles.clientInfo}>
          <View style={styles.clientAvatar}>
            <User color="#6366f1" size={24} />
          </View>
          <View style={styles.clientDetails}>
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientStats}>
              {stats.total} PRs • {stats.weight} Weight • {stats.volume} Volume
            </Text>
          </View>
        </View>
        <View style={styles.clientBadge}>
          <Text style={styles.clientBadgeText}>{stats.total}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleDeletePR = (pr: PersonalRecord) => {
    if (!pr || !pr.id) return;
    console.log('Attempting to delete PR with ID:', pr.id);
    if (Platform.OS === 'web') {
      deletePersonalRecord(pr.id);
      setFilteredPRs(prev => prev.filter(p => p.id !== pr.id));
      setSelectedPRs(prev => prev.filter(id => id !== pr.id));
      return;
    }
    
    Alert.alert(
      'Delete Personal Record',
      `Are you sure you want to delete this ${pr.type === 'max_weight' ? 'weight' : 'volume'} PR for ${getExerciseName(pr.exerciseId)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Confirmed deletion of PR with ID:', pr.id);
            deletePersonalRecord(pr.id);
            // Update filtered PRs
            setFilteredPRs(prev => prev.filter(p => p.id !== pr.id));
            // Remove from selected PRs if in selection mode
            setSelectedPRs(prev => prev.filter(id => id !== pr.id));
          },
        },
      ]
    );
  };

  const handleDeleteSelectedPRs = () => {
    if (selectedPRs.length === 0) return;
    console.log('Attempting to delete selected PRs:', selectedPRs);
    
    if (Platform.OS === 'web') {
      selectedPRs.forEach(id => {
        console.log('Deleting selected PR with ID:', id);
        deletePersonalRecord(id);
      });
      setFilteredPRs(prev => prev.filter(p => !selectedPRs.includes(p.id)));
      setSelectedPRs([]);
      setSelectionMode(false);
      return;
    }
    
    Alert.alert(
      'Delete Selected Records',
      `Are you sure you want to delete ${selectedPRs.length} selected personal record${selectedPRs.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Confirmed deletion of selected PRs:', selectedPRs);
            selectedPRs.forEach(id => {
              deletePersonalRecord(id);
            });
            setFilteredPRs(prev => prev.filter(p => !selectedPRs.includes(p.id)));
            setSelectedPRs([]);
            setSelectionMode(false);
          },
        },
      ]
    );
  };

  const togglePRSelection = (prId: string) => {
    setSelectedPRs(prev => 
      prev.includes(prId) 
        ? prev.filter(id => id !== prId) 
        : [...prev, prId]
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      setSelectedPRs([]);
    }
  };

  const viewPRDetails = (pr: PersonalRecord) => {
    if (!pr || !pr.id) return;
    setSelectedPR(pr);
    setShowPRDetailModal(true);
  };

  const renderPR = ({ item }: { item: PersonalRecord }) => {
    const isSelected = selectedPRs.includes(item.id);
    
    return (
      <PRCard
        item={item}
        isSelected={isSelected}
        selectionMode={selectionMode}
        onPress={() => {
          if (selectionMode) {
            togglePRSelection(item.id);
          } else {
            viewPRDetails(item);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            togglePRSelection(item.id);
          }
        }}
        onDelete={() => handleDeletePR(item)}
        formatWeight={formatWeight}
        getExerciseName={getExerciseName}
        viewPRDetails={viewPRDetails}
      />
    );
  };

  const renderClientModal = () => (
    <Modal
      visible={showClientModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Client</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowClientModal(false)}
          >
            <X color="#6b7280" size={24} />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={clients}
          renderItem={renderClientCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.clientList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );

  const renderPRDetailModal = () => {
    if (!selectedPR) return null;
    
    const isWeightPR = selectedPR.type === 'max_weight';
    const exercise = exercises.find(e => e.id === selectedPR.exerciseId);
    const client = clients.find(c => c.id === selectedPR.clientId);
    const gradientColors: [string, string] = isWeightPR ? ['#f093fb', '#f5576c'] : ['#4facfe', '#00f2fe'];
    
    return (
      <Modal
        visible={showPRDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={false}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Personal Record Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowPRDetailModal(false);
                setSelectedPR(null);
              }}
            >
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.detailScrollView}>
            <LinearGradient
              colors={gradientColors}
              style={styles.prDetailCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.prDetailHeader}>
                <View style={styles.prDetailIconContainer}>
                  {isWeightPR ? (
                    <Trophy color="#ffffff" size={32} />
                  ) : (
                    <TrendingUp color="#ffffff" size={32} />
                  )}
                </View>
                <View style={styles.prDetailTitleContainer}>
                  <Text style={styles.prDetailType}>
                    {isWeightPR ? 'Maximum Weight' : 'Maximum Volume'}
                  </Text>
                  <Text style={styles.prDetailValue}>
                    {isWeightPR 
                      ? formatWeight(selectedPR.value) 
                      : `${selectedPR.value.toFixed(0)} kg total volume`}
                  </Text>
                </View>
              </View>
              
              <View style={styles.prDetailInfo}>
                <Text style={styles.prDetailLabel}>Exercise</Text>
                <Text style={styles.prDetailText}>{exercise?.name || 'Unknown Exercise'}</Text>
                
                <Text style={styles.prDetailLabel}>Client</Text>
                <Text style={styles.prDetailText}>{client?.name || 'Unknown Client'}</Text>
                
                <Text style={styles.prDetailLabel}>Date Achieved</Text>
                <Text style={styles.prDetailText}>
                  {new Date(selectedPR.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
                
                {exercise && (
                  <>
                    <Text style={styles.prDetailLabel}>Category</Text>
                    <Text style={styles.prDetailText}>
                      {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)}
                    </Text>
                    
                    <Text style={styles.prDetailLabel}>Muscle Groups</Text>
                    <Text style={styles.prDetailText}>
                      {exercise.muscleGroups.join(', ')}
                    </Text>
                    
                    {exercise.equipment && (
                      <>
                        <Text style={styles.prDetailLabel}>Equipment</Text>
                        <Text style={styles.prDetailText}>{exercise.equipment}</Text>
                      </>
                    )}
                  </>
                )}
              </View>
              
              <View style={styles.prDetailActions}>
                <TouchableOpacity 
                  style={styles.prDetailDeleteButton}
                  onPress={() => {
                    setShowPRDetailModal(false);
                    setTimeout(() => handleDeletePR(selectedPR), 300);
                  }}
                >
                  <Trash2 color="#ffffff" size={20} />
                  <Text style={styles.prDetailActionText}>Delete Record</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading personal bests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal Bests</Text>
        <View style={styles.headerActions}>
          {selectedClient && filteredPRs.length > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.selectModeButton]}
              onPress={toggleSelectionMode}
              testID="toggle-selection-mode"
            >
              {selectionMode ? (
                <X color="#6366f1" size={20} />
              ) : (
                <Trash2 color="#6366f1" size={20} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowClientModal(true)}
            testID="select-client-button"
          >
            <Filter color="#6366f1" size={20} />
            <Text style={styles.filterText}>
              {selectedClient ? selectedClient.name : 'Select Client'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectionMode && selectedPRs.length > 0 && (
        <View style={styles.selectionToolbar}>
          <Text style={styles.selectionText}>
            {selectedPRs.length} record{selectedPRs.length > 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            style={styles.deleteSelectedButton}
            onPress={handleDeleteSelectedPRs}
            testID="delete-selected-button"
          >
            <Trash2 color="#ffffff" size={20} />
            <Text style={styles.deleteSelectedText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectedClient ? (
        <View style={styles.emptyContainer}>
          <Trophy color="#9ca3af" size={64} />
          <Text style={styles.emptyTitle}>Select a Client</Text>
          <Text style={styles.emptyText}>
            Choose a client to view their personal records and achievements
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowClientModal(true)}
          >
            <Text style={styles.selectButtonText}>Select Client</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPRs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Trophy color="#9ca3af" size={64} />
          <Text style={styles.emptyTitle}>No Personal Records</Text>
          <Text style={styles.emptyText}>
            {selectedClient.name} hasn&apos;t set any personal records yet. Start logging workouts to track achievements!
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>
              {selectedClient.name}&apos;s Records ({filteredPRs.length})
            </Text>
            {selectionMode && (
              <Text style={styles.selectionHint}>
                Tap to select records
              </Text>
            )}
          </View>
          
          <FlatList
            data={filteredPRs}
            renderItem={renderPR}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {renderClientModal()}
      {renderPRDetailModal()}
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
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  statsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  selectionHint: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  prCardContainer: {
    marginBottom: 16,
    position: 'relative' as const,
  },
  prCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    backgroundColor: '#ffffff',
  },
  deleteConfirmOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  deleteConfirmDialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 320,
  },
  deleteConfirmTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#1f2937',
    marginBottom: 12,
  },
  deleteConfirmText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteConfirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '600' as const,
    fontSize: 14,
    marginLeft: 8,
  },
  prGradient: {
    padding: 20,
  },
  selectedPR: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prInfo: {
    flex: 1,
  },
  prType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500' as const,
  },
  prValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  prExercise: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 8,
  },
  prDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  selectButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  clientList: {
    padding: 20,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f2937',
    marginBottom: 4,
  },
  clientStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  clientBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  clientBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectModeButton: {
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkboxSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  selectionToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  deleteSelectedText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  detailsButtonText: {
    color: '#ffffff',
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  detailScrollView: {
    flex: 1,
    padding: 20,
  },
  prDetailCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  prDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  prDetailIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  prDetailTitleContainer: {
    flex: 1,
  },
  prDetailType: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  prDetailValue: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#ffffff',
  },
  prDetailInfo: {
    padding: 20,
  },
  prDetailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
    marginTop: 16,
  },
  prDetailText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '500' as const,
  },
  prDetailActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  prDetailDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 24,
  },
  prDetailActionText: {
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});