import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  useColorScheme,
  Linking,
} from 'react-native';
import { COLORS, DARK_COLORS } from '../colors/color';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEmployee, Employee } from '../contexts/EmployeeContext';

type Status = 'In Office' | 'On Leave' | 'WFH' | 'Out of Office' | 'In Meeting' | 'On Break';

export default function EmployeeDetailsScreen({ route, navigation }: any) {
  const { employeeId } = route.params;
  const { employee, loading, error, fetchEmployee } = useEmployee();

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DARK_COLORS : COLORS;

  useEffect(() => {
    if (employeeId) {
      fetchEmployee(employeeId);
    }
  }, [employeeId, fetchEmployee]);

  const statusColor = (status: Status): string => {
    const map: Record<Status, string> = {
      'In Office': theme.online,
      'Out of Office': theme.offline,
      'In Meeting': '#F59E0B',
      'On Break': '#F59E0B',
      'On Leave': '#EF4444',
      'WFH': '#3B82F6',
    };
    return map[status] || theme.subText;
  };
  const timeAgo = (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', color: theme.text }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (error || !employee) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', color: 'red' }}>
          {error || 'Employee not found'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              source={require('../assets/icons/back.png')}
              style={[styles.backIcon, { tintColor: theme.text }]}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Employee Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <Image source={{ uri: employee.photoURL }} style={styles.avatar} />
          <Text style={[styles.name, { color: theme.text }]}>{employee.name}</Text>
          <Text style={[styles.department, { color: theme.subText }]}>{employee.department}</Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor(employee.status as Status) + '20' },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor(employee.status as Status) }]}
            />
            <Text style={[styles.statusText, { color: statusColor(employee.status as Status) }]}>
              {employee.status}
            </Text>
          </View>

          <Text style={[styles.updated, { color: theme.subText }]}>
            Updated {timeAgo(employee.statusUpdatedAt)}
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>

          <View style={[styles.infoRow, { borderBottomColor: theme.accent }]}>
            <Image source={require('../assets/icons/email.png')} style={[styles.infoIcon, { tintColor: theme.subText }]} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.subText }]}>Email</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{employee.email}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomColor: theme.accent }]}>
            <Image source={require('../assets/icons/call.png')} style={[styles.infoIcon, { tintColor: theme.subText }]} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.subText }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{employee.phone}</Text>
            </View>
          </View>
{/* 
          <View style={styles.infoRow}>
            <Image source={require('../assets/icons/calendar.png')} style={[styles.infoIcon, { tintColor: theme.subText }]} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.subText }]}>Joined</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {employee.createdAt ? format(new Date(employee.createdAt), 'MMM yyyy') : 'N/A'}
              </Text>
            </View>
          </View> */}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.accent }]}
            onPress={() => Linking.openURL(`mailto:${employee.email}`)}
          >
            <Image source={require('../assets/icons/message.png')} style={styles.actionIcon} />
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.accent, borderWidth: 1 }]}
            onPress={() => Linking.openURL(`tel:${employee.phone}`)}
          >
            <Image source={require('../assets/icons/call.png')} style={[styles.actionIcon, { tintColor: theme.text }]} />
            <Text style={[styles.actionText, { color: theme.text }]}>Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 12,
  },
  backIcon: { width: 24, height: 24 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },

  profileCard: {
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 24,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 24,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  department: { fontSize: 16, marginBottom: 8 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '600' },
  updated: { fontSize: 13 },

  infoSection: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoIcon: { width: 20, height: 20, marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 13, marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600' },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 32,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionIcon: { width: 20, height: 20, tintColor: '#fff' },
  actionText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});