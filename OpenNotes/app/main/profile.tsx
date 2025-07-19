import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  Modal,
  ScrollView,
  FlatList,
  TextInput,
} from 'react-native';
import { supabase } from '../utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useRoute } from '@react-navigation/native';
import BackgroundWrapper from '../utils/BackgroundWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TAGS = [
  'Machine Learning', 'Python', 'AI', 'DBMS', 'Web Development', 'Data Science',
  'JavaScript', 'C++', 'Cloud', 'Cybersecurity', 'Blockchain', 'React', 'Node.js',
  'Android', 'iOS', 'DevOps', 'UI/UX', 'Networking', 'Algorithms', 'Linux',
];

export default function ProfileScreen() {
  const route = useRoute<any>();
  const userIdParam = route.params?.userId;
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const [user, setUser] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<{ name: string; interests: string[] } | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Add state for bookmarks (collection)
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [bio, setBio] = useState('');
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setCurrentUserId(sessionData.session?.user?.id || null);
      if (userIdParam) {
        // Fetch another user's profile by id
        const { data, error } = await supabase
          .from('users')
          .select('name, interests, avatar_url, bio')
          .eq('id', userIdParam)
          .maybeSingle();
        if (data) {
          setUserInfo({
            name: data.name,
            interests: data.interests ? data.interests.split(',').map((t: string) => t.trim()) : [],
          });
          setProfileImage(data.avatar_url || 'https://via.placeholder.com/150');
          setBio(data.bio || '');
        }
        return;
      }
      const email = sessionData.session?.user?.email;
      setUser(sessionData.session?.user);
      const avatar = sessionData.session?.user?.user_metadata?.avatar_url;
      if (avatar) setProfileImage(avatar);
      if (!email) return;
      const { data, error } = await supabase
        .from('users')
        .select('name, interests, bio')
        .ilike('email', email)
        .maybeSingle();
      if (data) {
        setUserInfo({
          name: data.name,
          interests: data.interests ? data.interests.split(',').map((t: string) => t.trim()) : [],
        });
        setSelectedTags(data.interests ? data.interests.split(',').map((t: string) => t.trim()) : []);
        setBio(data.bio || '');
      }
    };
    fetchProfile();
  }, [userIdParam]);

  // Fetch bookmarks for collection
  const fetchBookmarks = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/bookmark/bookmark/${currentUserId}`);
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      setBookmarks([]);
    }
  };
  useEffect(() => {
    if (currentUserId) fetchBookmarks();
  }, [userIdParam, currentUserId]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveInterests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ interests: selectedTags.join(', ') })
        .ilike('email', user.email);
      if (error) throw error;
      setUserInfo((prev) => prev ? { ...prev, interests: selectedTags } : prev);
      setEditModalVisible(false);
      Alert.alert('Success', 'Interests updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update interests');
    } finally {
      setLoading(false);
    }
  };

  // When opening edit modal, set edit fields
  const openEditModal = () => {
    setEditName(userInfo?.name || user?.email || '');
    setEditBio(bio || '');
    setEditModalVisible(true);
  };

  // Save name and bio
  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: editName, bio: editBio, interests: selectedTags.join(', '), avatar_url: profileImage })
        .ilike('email', user.email);
      if (error) throw error;
      setUserInfo((prev) => prev ? { ...prev, name: editName, interests: selectedTags } : prev);
      setBio(editBio);
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <BackgroundWrapper>
      <View style={{ flex: 1 }}>
        {/* Gradient Header */}
        <LinearGradient colors={["#60a5fa", "#818cf8"]} style={styles.gradientHeader} />
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={{ alignItems: 'center', marginTop: -60 }}>
            <Pressable onPress={pickImage} style={{ alignItems: 'center' }}>
              <Image source={{ uri: profileImage }} style={styles.profileImageLarge} />
              <Text style={styles.uploadText}>Change Image</Text>
            </Pressable>
            <Text style={styles.username}>{userInfo?.name || editName || 'User'}</Text>
            <Text style={styles.bioText}>{bio || 'No bio set'}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{bookmarks.length}</Text>
                <Text style={styles.statLabel}>Bookmarks</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Uploads</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
            </View>
          </View>
        </View>
        {/* Collection Section */}
        <View style={{ marginTop: 20, marginLeft: 20 }}>
          <Text style={styles.sectionTitle}>Collection</Text>
          <FlatList
            data={bookmarks}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              <View style={styles.collectionCard}>
                <View style={styles.collectionImagePlaceholder}>
                  <Ionicons name="bookmark" size={32} color="#fff" />
                </View>
                <Text style={styles.collectionLabel} numberOfLines={1}>{item.title || 'Saved'}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color: '#aaa', marginTop: 10 }}>No bookmarks yet.</Text>}
            contentContainerStyle={{ paddingRight: 20 }}
          />
        </View>
        {/* Interests Section */}
        <View style={{ marginTop: 20, marginLeft: 20 }}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.tagsWrap}>
            {userInfo?.interests && userInfo.interests.length > 0 ? (
              userInfo.interests.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noInterests}>No interests set</Text>
            )}
          </View>
        </View>
        {/* Edit/Logout Buttons */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Pressable style={styles.button} onPress={openEditModal}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </Pressable>
          <Pressable
            style={[styles.button, { backgroundColor: '#EF4444' }]}
            onPress={async () => {
              await supabase.auth.signOut();
              setUser(null);
              Alert.alert('Logged Out');
            }}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </Pressable>
        </View>
        {/* Edit Profile Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editProfileCard}>
              <Text style={styles.editProfileTitle}>Edit Profile</Text>
              <Pressable onPress={pickImage} style={{ alignItems: 'center', marginBottom: 20 }}>
                <Image source={{ uri: profileImage }} style={styles.editProfileImage} />
                <Text style={styles.uploadText}>Change Image</Text>
              </Pressable>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.inputBox}
                  placeholder="Enter your name"
                  value={editName}
                  onChangeText={setEditName}
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.inputBox, { height: 80 }]}
                  placeholder="Tell us about yourself..."
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline
                  placeholderTextColor="#aaa"
                />
              </View>
              <View style={styles.divider} />
              <Text style={[styles.inputLabel, { marginBottom: 6 }]}>Interests</Text>
              <ScrollView contentContainerStyle={styles.tagsWrap}>
                {TAGS.map((tag) => (
                  <Pressable
                    key={tag}
                    style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.button, { marginTop: 20, backgroundColor: '#3B82F6' }]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, { marginTop: 10, backgroundColor: '#aaa' }]}
                onPress={() => setEditModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </BackgroundWrapper>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f9fafb', // Remove this line
  },
  header: {
    height: 100,
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: -60,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadText: {
    color: '#3B82F6',
    marginTop: 5,
    fontSize: 12,
  },
  username: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#111',
    marginBottom: 8,
  },
  interestsContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 6,
    marginLeft: 2,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  tag: {
    backgroundColor: '#E0E7FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagSelected: {
    backgroundColor: '#3B82F6',
  },
  tagText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tagTextSelected: {
    color: '#fff',
  },
  noInterests: {
    color: '#888',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 16,
  },
  gradientHeader: {
    height: 180,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 100,
    paddingTop: 70,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    zIndex: 2,
  },
  profileImageLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    marginTop: -60,
    marginBottom: 8,
    zIndex: 3,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#60a5fa',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    width: '80%',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  collectionCard: {
    width: 110,
    height: 120,
    backgroundColor: '#818cf8',
    borderRadius: 18,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  collectionImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#60a5fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  collectionLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    width: '100%',
  },
  bioText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inputBox: {
    height: 50,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f9fafe',
  },
  editProfileCard: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  editProfileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 18,
    textAlign: 'center',
  },
  editProfileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#3B82F6',
    marginBottom: 6,
  },
  inputSection: {
    width: '100%',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 15,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
    borderRadius: 1,
  },
});
