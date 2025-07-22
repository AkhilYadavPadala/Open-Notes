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
} from 'react-native';
import { supabase } from '../utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useRoute } from '@react-navigation/native';
import BackgroundWrapper from '../utils/BackgroundWrapper';

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

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setCurrentUserId(sessionData.session?.user?.id || null);
      if (userIdParam) {
        // Fetch another user's profile by id
        const { data, error } = await supabase
          .from('users')
          .select('name, interests, avatar_url')
          .eq('id', userIdParam)
          .maybeSingle();
        if (data) {
          setUserInfo({
            name: data.name,
            interests: data.interests ? data.interests.split(',').map((t: string) => t.trim()) : [],
          });
          setProfileImage(data.avatar_url || 'https://via.placeholder.com/150');
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
        .select('name, interests')
        .ilike('email', email)
        .maybeSingle();
      if (data) {
        setUserInfo({
          name: data.name,
          interests: data.interests ? data.interests.split(',').map((t: string) => t.trim()) : [],
        });
        setSelectedTags(data.interests ? data.interests.split(',').map((t: string) => t.trim()) : []);
      }
    };
    fetchProfile();
  }, [userIdParam]);

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
  
  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <View style={styles.header} />
        <View style={styles.profileContainer}>
          {(!userIdParam || userIdParam === currentUserId) ? (
            <Pressable onPress={pickImage} style={{ alignItems: 'center' }}>
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
              <Text style={styles.uploadText}>Upload Profile</Text>
            </Pressable>
          ) : (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          )}
          <Text style={styles.username}>{userInfo?.name || user?.email || 'User'}</Text>
          <View style={styles.interestsContainer}>
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
          {/* Only show edit/logout for current user */}
          {(!userIdParam || userIdParam === currentUserId) && (
            <>
              <Pressable style={styles.button} onPress={() => setEditModalVisible(true)}>
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
            </>
          )}
        </View>
        {/* Edit Interests Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Interests</Text>
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
                onPress={handleSaveInterests}
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
});
