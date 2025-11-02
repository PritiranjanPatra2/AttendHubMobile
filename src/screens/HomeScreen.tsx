import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ToastAndroid,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  useColorScheme,
  ImageSourcePropType,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, DARK_COLORS } from '../colors/color';
import { useAttendance } from '../contexts/AttendanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }: any) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DARK_COLORS : COLORS;

  const { fetchProfile, user } = useAuth();
  const { updateStatus, markAttendance, loading } = useAttendance();

  const currentStatus = user?.status;
  const [markedAttendance, setMarkedAttendance] = useState(false);
  const [locationFetchedLoader, setLocationFetchedLoader] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check attendance every minute
  useEffect(() => {
    const interval = setInterval(() => {
      checkMarkedAttendance();
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkMarkedAttendance();
    }, []),
  );

  // Check if attendance marked today
  const checkMarkedAttendance = async () => {
    try {
      console.log("hii");
      
      const data = await AsyncStorage.getItem('MarkedAttendanceStatus');
      const today = new Date().toDateString();

      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.date === today && parsed.markedToday === true) {
          setMarkedAttendance(true);
          
          
        } else {
          console.log('hello')
          setMarkedAttendance(false);
          await updateStatus('Out of Office');
          await fetchProfile();
        }
      } else {
        
          await updateStatus('Out of Office');
          await fetchProfile();
        setMarkedAttendance(false);
      }
    } catch (error) {
      setMarkedAttendance(false);
    }
  };

  const calculateDistance = (
    currentLongitude?: number,
    currentLatitude?: number,
  ): { meters: number; formatted: string } | null => {
    // const lat2 = 28.6139; // Office lat
    const lat2=28.396897154550135

    // const lon2 = 77.209; // Office lon
    const lon2=77.04149192330433

    if (
      currentLatitude == null ||
      currentLongitude == null ||
      isNaN(currentLatitude) ||
      isNaN(currentLongitude)
    ) {
      ToastAndroid.show('Error: Location data is missing.', ToastAndroid.SHORT);
      return null;
    }

    const lat1 = Number(currentLatitude);
    const lon1 = Number(currentLongitude);

    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const formatted =
      distance >= 1000
        ? `${(distance / 1000).toFixed(2)} km`
        : `${Math.round(distance)} m`;

    return { meters: distance, formatted };
  };

  const handleMarkAttendance = async () => {
    try {
      const location = await fetchLocation();
      if (!location) {
        Alert.alert('Error', 'Could not fetch location.');
        return;
      }

      const { latitude, longitude } = location;
      const result = calculateDistance(longitude, latitude);
      if (!result) return;
      const { meters, formatted } = result;

      if (meters > 100) {
        return ToastAndroid.show(
          `You are ${formatted} away. Go to office to mark attendance.`,
          ToastAndroid.LONG,
        );
      }

      const success = await markAttendance();
      if (success) {
        await AsyncStorage.setItem(
          'MarkedAttendanceStatus',
          JSON.stringify({
            date: new Date().toDateString(),
            markedToday: true,
          }),
        );
        setMarkedAttendance(true);
        await fetchProfile();
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to mark attendance');
    }
  };

  const checkconnectivity = async () => {
    const enabled = await DeviceInfo.isLocationEnabled();
    if (!enabled) {
      Alert.alert('Location Disabled', 'Please enable location to mark attendance');
      return false;
    }
    return true;
  };

  const fetchLocation = async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location required for proximity detection');
        return null;
      }
      await checkconnectivity();
      setLocationFetchedLoader(true);

      return new Promise(resolve => {
        Geolocation.getCurrentPosition(
          position => {
            const { latitude, longitude } = position.coords;
            setLocationFetchedLoader(false);
            resolve({ latitude, longitude });
          },
          error => {
            ToastAndroid.show('Unable to get location', ToastAndroid.SHORT);
            setLocationFetchedLoader(false);
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
        );
      });
    } catch (error) {
      setLocationFetchedLoader(false);
      return null;
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Location required for outlet proximity detection',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleStatusChange = async (status: string) => {
    if (loading) return;
    const result = await updateStatus(status);
    if (result) {
      ToastAndroid.show(`Status updated to ${status}`, ToastAndroid.SHORT);
      await fetchProfile();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  // Status list with icons
  const quickStatuses = [
    'In Office',
    'Out of Office',
    'In Meeting',
    'On Break',
    'On Leave',
  ];

  // Icon map – replace with your actual image paths
  const STATUS_ICONS: Record<string, ImageSourcePropType> = {
    'In Office': require('../assets/icons/inoffice.png'),
    'Out of Office': require('../assets/icons/log-out.png'),
    'In Meeting': require('../assets/icons/meeting.png'),
    'On Break': require('../assets/icons/cups-icon.png'),
    'On Leave': require('../assets/icons/leave.png'),
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>
            Hello, {user?.name || 'User'}
          </Text>
          <Text style={[styles.date, { color: theme.subText }]}>
            {formatDate(currentTime)}
          </Text>
        </View>
        <Image
          source={{ uri: user?.photoURL || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
      </View>

      {/* Time Card */}
      <View style={[styles.timeCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.currentTime, { color: theme.text }]}>
          {formatTime(currentTime)}
        </Text>
        <Text style={[styles.currentStatus, { color: theme.accent }]}>
          {currentStatus || 'Not Set'}
        </Text>
      </View>

      {/* Attendance Section */}
      <View style={styles.statusSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Attendance
        </Text>
        {markedAttendance ? (
          <View style={styles.attendanceMarkedBox}>
            <Text style={{ color: 'green', fontWeight: 'bold' }}>
              Attendance Marked for Today
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.markButton, { backgroundColor: theme.accent }]}
            onPress={handleMarkAttendance}
            disabled={loading || locationFetchedLoader}
          >
            {locationFetchedLoader ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.markButtonText}>Mark Attendance</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Attendance Report Button */}
      <TouchableOpacity
        style={[styles.reportButton, { backgroundColor: theme.accent }]}
        onPress={() => navigation.navigate('AttendanceReport')}
      >
        <Text style={styles.reportButtonText}>View Attendance Report</Text>
      </TouchableOpacity>

      {/* Quick Status – Icon Boxes */}
      <View style={styles.statusSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Quick Status
        </Text>

        <View style={styles.statusBoxGrid}>
          {quickStatuses.map(status => {
            const isActive = currentStatus === status;
            const icon = STATUS_ICONS[status];

            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusBox,
                  { backgroundColor: theme.card },
                  isActive && { backgroundColor: theme.accent },
                  isActive && styles.statusBoxActiveShadow,
                ]}
                onPress={() => handleStatusChange(status)}
                disabled={loading}
              >
                {icon && (
                  <Image source={icon} style={styles.statusBoxIcon} />
                )}
               <Text
  style={[
    styles.statusBoxText,
    { color: isActive ? '#fff' : theme.text },
  ]}
>
  {status}
</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

// === Styles ===
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
  },
  greeting: { fontSize: 24, fontWeight: 'bold' },
  date: { fontSize: 14, marginTop: 4 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  timeCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
  },
  currentTime: { fontSize: 48, fontWeight: 'bold' },
  currentStatus: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  statusSection: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },

  // Quick Status Boxes
  statusBoxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  statusBox: {
    width: 100,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  statusBoxActiveShadow: {
    elevation: 6,
    shadowOpacity: 0.25,
  },
  statusBoxIcon: {
    width: 32,
    height: 32,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  statusBoxText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },

  markButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  markButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  attendanceMarkedBox: {
    paddingVertical: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    alignItems: 'center',
  },
  reportButton: {
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});