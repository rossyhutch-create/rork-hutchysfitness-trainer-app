import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Users, Dumbbell, Activity, TrendingUp, Settings, ChevronDown } from 'lucide-react-native';
import { colors } from '@/constants/branding';

type NavItem = {
  id: string;
  title: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  path: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'clients', title: 'Clients', icon: Users, path: '/clients' },
  { id: 'workouts', title: 'Workouts', icon: Dumbbell, path: '/workouts' },
  { id: 'exercises', title: 'Exercises', icon: Activity, path: '/exercises' },
  { id: 'progress', title: 'Progress', icon: TrendingUp, path: '/progress' },
  { id: 'settings', title: 'Settings', icon: Settings, path: '/settings' },
];

export default function NavigationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const currentItem = NAV_ITEMS.find(item => pathname.startsWith(item.path)) || NAV_ITEMS[0];

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path as any);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dropdownContent}>
          <currentItem.icon color={colors.primary} size={24} />
          <Text style={styles.dropdownTitle}>{currentItem.title}</Text>
          <ChevronDown color={colors.text} size={20} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          <View style={styles.dropdownMenu}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigate(item.path)}
                  activeOpacity={0.7}
                >
                  <item.icon
                    color={isActive ? colors.primary : colors.textSecondary}
                    size={22}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      isActive && styles.menuItemTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 200,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
    minWidth: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  dropdownMenu: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemActive: {
    backgroundColor: colors.primary + '15',
  },
  menuItemText: {
    fontSize: 17,
    color: colors.textSecondary,
    fontWeight: '500' as const,
    flex: 1,
  },
  menuItemTextActive: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
});
