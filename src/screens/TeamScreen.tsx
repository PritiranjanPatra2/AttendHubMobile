import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  useColorScheme,
  Platform,
} from 'react-native';
import { COLORS, DARK_COLORS } from '../colors/color';
import { useEmployee, TeamMember } from '../contexts/EmployeeContext';
import { useAuth } from '../contexts/AuthContext';

type Status = 'In Office' | 'On Leave' | 'WFH' | 'Out of Office' | 'In Meeting' | 'On Break';

export default function TeamScreen({ navigation }: any) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DARK_COLORS : COLORS;

  const { team, loading, error, fetchTeam } = useEmployee();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTeam(1, 20); // Fetch first 20
  }, [fetchTeam]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeam(1, 20, search || undefined);
    setRefreshing(false);
  };


  const filteredTeam = useMemo(() => {
    let filtered = team;

    if (search) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.status.toLowerCase().includes(search.toLowerCase()) ||
          m.department.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedFilter !== 'All') {
      filtered = filtered.filter((m) => m.status === selectedFilter);
    }

    return filtered;
  }, [team, search, selectedFilter]);

  const statusColor = (status: Status) => {
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

  const filters = ['All', 'In Office', 'On Leave', 'WFH', 'Out of Office'];

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center' }]}>
        <Text style={{ color: theme.text, textAlign: 'center' }}>Loading team...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center' }]}>
        <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Image source={require('../assets/icons/search.png')} style={styles.searchIcon} />
        <TextInput
          placeholder="Search by name, status, or dept"
          placeholderTextColor={theme.subText}
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0 }} 
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              selectedFilter === f && { backgroundColor: theme.accent },
            ]}
            onPress={() => setSelectedFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                { color: selectedFilter === f ? '#fff' : theme.text },
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Team List */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >
        {filteredTeam.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={require('../assets/icons/search.png')} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No team members found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
              Try adjusting your search or filters
            </Text>
          </View>
        ) : (
          filteredTeam.map((member) => (
            <TouchableOpacity
              key={member._id}
              style={[styles.memberCard, { backgroundColor: theme.card }]}
              onPress={() =>
                navigation.navigate('employeeDetails', { employeeId: member._id })
              }
            >
              <Image source={{ uri: member.photoURL }} style={styles.memberAvatar} />
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                <Text style={[styles.memberDept, { color: theme.subText }]}>
                  {member.department}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor(member.status as Status) + '20' },
                ]}
              >
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor(member.status as Status) }]}
                />
                <Text style={[styles.statusText, { color: statusColor(member.status as Status) }]}>
                  {member.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 15 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: { width: 20, height: 20, marginRight: 8, tintColor: '#888' },
  searchInput: { flex: 1, fontSize: 16 },

  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8, 
    height: 36, 
  },
  filterText: { fontSize: 14, fontWeight: '600' },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  memberAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600' },
  memberDept: { fontSize: 14 },
  memberUpdated: { fontSize: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { width: 80, height: 80, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
});