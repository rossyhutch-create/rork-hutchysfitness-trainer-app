import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { User, Plus, Calendar, Users } from 'lucide-react-native';
import { useFitnessStore } from '@/store/fitness-store';
import { Client } from '@/types';

export default function AddWorkoutScreen() {
  const [selectedClients, setSelectedClients] = useState<Client[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMultiClient, setIsMultiClient] = useState(false);
  
  const { clients, loadData } = useFitnessStore();

  useEffect(() => {
    loadData();
  }, []);

  const handleClientSelect = (client: Client) => {
    if (isMultiClient) {
      if (selectedClients.find(c => c.id === client.id)) {
        setSelectedClients(selectedClients.filter(c => c.id !== client.id));
      } else {
        setSelectedClients([...selectedClients, client]);
      }
    } else {
      setSelectedClients([client]);
      setShowClientModal(false);
    }
  };

  const toggleMultiClient = () => {
    setIsMultiClient(!isMultiClient);
    setSelectedClients([]);
  };

  const confirmClientSelection = () => {
    setShowClientModal(false);
  };

  const handleContinue = () => {
    if (selectedClients.length === 0) {
      Alert.alert('Error', 'Please select at least one client');
      return;
    }

    const clientIds = selectedClients.map(c => c.id).join(',');
    const clientNames = selectedClients.map(c => c.name).join(', ');

    router.push({
      pathname: '/workout-builder',
      params: {
        clientIds,
        clientNames,
        date: workoutDate,
        isMultiClient: isMultiClient.toString(),
      },
    });
  };

  const renderClient = ({ item }: { item: Client }) => {
    const isSelected = selectedClients.find(c => c.id === item.id);
    
    return (
      <TouchableOpacity
        style={[styles.clientItem, isSelected && styles.clientItemSelected]}
        onPress={() => handleClientSelect(item)}
      >
        <View style={[styles.clientAvatar, isSelected && styles.clientAvatarSelected]}>
          <User color={isSelected ? "#ffffff" : "#6366f1"} size={24} />
        </View>
        <View style={styles.clientInfo}>
          <Text style={[styles.clientName, isSelected && styles.clientNameSelected]}>{item.name}</Text>
          {item.email && (
            <Text style={[styles.clientEmail, isSelected && styles.clientEmailSelected]}>{item.email}</Text>
          )}
        </View>
        {isMultiClient && isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'New Workout',
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Client(s)</Text>
            <TouchableOpacity
              style={[styles.multiClientToggle, isMultiClient && styles.multiClientToggleActive]}
              onPress={toggleMultiClient}
            >
              <Text style={[styles.multiClientToggleText, isMultiClient && styles.multiClientToggleTextActive]}>
                {isMultiClient ? 'Multi' : 'Single'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.clientSelector}
            onPress={() => setShowClientModal(true)}
          >
            <View style={styles.clientSelectorContent}>
              {selectedClients.length > 0 ? (
                <>
                  <View style={styles.selectedClientAvatar}>
                    <User color="#6366f1" size={20} />
                  </View>
                  <Text style={styles.selectedClientName}>
                    {selectedClients.length === 1 
                      ? selectedClients[0].name 
                      : `${selectedClients.length} clients selected`
                    }
                  </Text>
                </>
              ) : (
                <>
                  <Plus color="#9ca3af" size={20} />
                  <Text style={styles.placeholderText}>
                    {isMultiClient ? 'Choose clients' : 'Choose a client'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Date</Text>
          <View style={styles.dateContainer}>
            <Calendar color="#6366f1" size={20} />
            <Text style={styles.dateText}>
              {new Date(workoutDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, selectedClients.length === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={selectedClients.length === 0}
        >
          <Text style={[styles.continueButtonText, selectedClients.length === 0 && styles.continueButtonTextDisabled]}>
            Continue to Workout Builder
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showClientModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isMultiClient ? 'Select Clients' : 'Select Client'}
            </Text>
            <View style={styles.modalHeaderActions}>
              {isMultiClient && selectedClients.length > 0 && (
                <TouchableOpacity
                  onPress={confirmClientSelection}
                  style={styles.modalConfirmButton}
                >
                  <Text style={styles.modalConfirmText}>Done ({selectedClients.length})</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setShowClientModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {clients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <User color="#9ca3af" size={64} />
              <Text style={styles.emptyTitle}>No clients yet</Text>
              <Text style={styles.emptyText}>
                Add a client first to create workouts
              </Text>
              <TouchableOpacity
                style={styles.addClientButton}
                onPress={() => {
                  setShowClientModal(false);
                  router.push('/add-client');
                }}
              >
                <Text style={styles.addClientButtonText}>Add Client</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={clients}
              renderItem={renderClient}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.clientList}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  clientSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  clientSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  selectedClientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  continueButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueButtonTextDisabled: {
    color: '#9ca3af',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  multiClientToggle: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  multiClientToggleActive: {
    backgroundColor: '#6366f1',
  },
  multiClientToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  multiClientToggleTextActive: {
    color: '#ffffff',
  },
  clientItemSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  clientAvatarSelected: {
    backgroundColor: '#6366f1',
  },
  clientNameSelected: {
    color: '#6366f1',
  },
  clientEmailSelected: {
    color: '#6366f1',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalConfirmButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  modalCloseButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  clientList: {
    padding: 20,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addClientButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addClientButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});