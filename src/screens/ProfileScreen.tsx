import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  TextInput,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, DARK_COLORS } from '../colors/color';
import { useAuth } from '../contexts/AuthContext'; 

type Status =
  | 'In Office'
  | 'Out of Office'
  | 'In Meeting'
  | 'On Break'
  | 'On Leave';

export default function ProfileScreen({ navigation }: any) {
  const { user, loading, error, updateProfile, logout, fetchProfile } = useAuth();
  console.log(user);
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DARK_COLORS : COLORS;

  const [editForm, setEditForm] = useState({
    department: user?.department ?? '',
    phone: user?.phone ?? '',
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync form when user changes
  useEffect(() => {
    if (user) {
      setEditForm({
        department: user.department ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  // Status color
  const statusColor = {
    'In Office': theme.online,
    'Out of Office': theme.offline,
    'In Meeting': '#F59E0B',
    'On Break': '#F59E0B',
    'On Leave': '#EF4444',
  }[user?.status as Status] || theme.subText;

  // Image Picker
  const pickImage = async () => {
    const options: any = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Image pick failed');
        return;
      }

      const asset = response.assets?.[0];
      if (!asset?.uri) return;

      setUploading(true);
      try {
        await updateProfile({ photoUri: asset.uri });
        await fetchProfile(); // Refresh user with new photoURL
      } catch (e: any) {
        Alert.alert('Upload Failed', e.message);
      } finally {
        setUploading(false);
      }
    });
  };

  // Save profile edits
  const handleSaveEdit = async () => {
    try {
      await updateProfile({
        department: editForm.department,
        phone: editForm.phone.trim(),
        // Add phone if your backend supports it
      });
      await fetchProfile();
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('auth'); // or 'Login'
        },
      },
    ]);
  };

  // Loading state
  if (loading && !user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error && !user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text, textAlign: 'center', padding: 20 }}>
          {error}
        </Text>
      </View>
    );
  }

  if (!user) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
  <Image 
    source={require('../assets/icons/back.png')}
    style={[ { tintColor: theme.text }]}
  />
</TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: user.photoURL }}
          style={styles.avatar}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={[styles.editIconBtn, { backgroundColor: theme.accent }]}
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            // <Text style={styles.editAvatarText}>Edit</Text>
            <Image source={require('../assets/icons/pencil-icon.png')}
                          style={[styles.icon, { tintColor: theme.text }]}
                        />
          )}
        </TouchableOpacity>
      </View>

      {/* Basic Info */}
      <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Basic Info</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Name</Text>
          <Text style={[styles.value, { color: theme.text }]}>{user.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Email</Text>
          <Text style={[styles.value, { color: theme.text }]}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Phone</Text>
          <Text style={[styles.value, { color: theme.text }]}>{user.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Department</Text>
          <Text style={[styles.value, { color: theme.text }]}>{user.department}</Text>
        </View>
      </View>

      {/* Work Details */}
      <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Work Details</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Role</Text>
          <Text style={[styles.value, { color: theme.text }]}>{user.role}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Status</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusValue, { color: theme.text }]}>{user.status}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: theme.subText }]}>Status Updated</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {new Date(user.statusUpdatedAt).toLocaleString()}
          </Text>
        </View>
        
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={[styles.editBtn, { backgroundColor: theme.accent }]}
        onPress={() => setEditModalVisible(true)}
      >
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: '#EF4444' }]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        transparent
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.text }]}
              placeholder="Phone"
              placeholderTextColor={theme.subText}
              value={editForm.phone}
              onChangeText={(t) => setEditForm((p) => ({ ...p, phone: t }))}
              keyboardType="phone-pad"
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.bg, color: theme.text }]}
              placeholder="Department"
              placeholderTextColor={theme.subText}
              value={editForm.department}
              onChangeText={(t) => setEditForm((p) => ({ ...p, department: t }))}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.accent }]}
              onPress={handleSaveEdit}
            >
             {loading?<ActivityIndicator size="small" color="#fff"/>:<Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={[styles.cancelBtnText, { color: theme.subText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={{height:40}}></View>
    </ScrollView>
  );
}

/* -------------------------------------------------------------
   STYLES
------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
  },
  backBtn: { padding: 6 },
  backText: { fontSize: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerRight: { width: 60 },
  icon:{
    height:16,
    width:16
  },

  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  editIconBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  editAvatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  infoCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 14 },
  value: { fontSize: 16, fontWeight: '500' },

  statusCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusValue: { fontSize: 16, fontWeight: '600' },

  editBtn: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutBtn: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  saveBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { padding: 16, alignItems: 'center' },
  cancelBtnText: { fontSize: 16 },
});