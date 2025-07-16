import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ActivityIndicator, TextInput } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { handleShare } from '../utils/shareHandler';
import DocumentPicker from 'expo-document-picker';
import { getBackendUrl } from '../utils/config';
import BackgroundWrapper from '../utils/BackgroundWrapper';

const BACKEND_URL = getBackendUrl();

type BookmarkedPost = {
  id: number;
  title: string;
  description: string;
  url?: string;
  showDescription: boolean;
  isBookmarked: boolean;
  isLiked: boolean;
  viewCounted: boolean;
  likeCount: number;
  viewCount: number;
  isInteractionPending?: boolean;
  commentCount?: number;
  bookmarkCount?: number;
  type?: string; // Added type for text posts
};

async function getCurrentUserId() {
  const { data: sessionData } = await supabase.auth.getSession();
  const email = sessionData.session?.user?.email;
  if (!email) return null;
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  if (error || !data) return null;
  return data.id;
}

const DownloadScreen = () => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPost[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [uploadsModal, setUploadsModal] = useState<{ visible: boolean; postId?: number }>({ visible: false });
  const [uploadsList, setUploadsList] = useState<any[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [uploadFormModal, setUploadFormModal] = useState<{ visible: boolean; postId?: number }>({ visible: false });
  const [uploadForm, setUploadForm] = useState<{ title: string; description: string; tags: string; file: any }>({ title: '', description: '', tags: '', file: null });
  const [uploadFormLoading, setUploadFormLoading] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getCurrentUserId();
      setUserId(id);
    };
    fetchUserId();
  }, []);

const fetchBookmarks = async () => {
  if (!userId) return;
  try {
    const res = await axios.get(`${BACKEND_URL}/bookmark/bookmark/${userId}`);
    const enriched = res.data.bookmarks.map((post: any): BookmarkedPost => ({
      ...post,
      showDescription: false,
      isBookmarked: post.isBookmarked ?? post.isbookmarked ?? true,
      isLiked: post.isLiked ?? false,
      viewCounted: false,
      likeCount: post.likecount ?? 0,
      viewCount: post.viewcount ?? 0,
      isInteractionPending: false,
      commentCount: post.commentcount ?? 0,
      bookmarkCount: post.bookmarkcount ?? 0,
    }));
    setBookmarkedPosts(enriched || []);
  } catch (err: unknown) {
    console.error("Failed to load bookmarks:", (err as Error).message);
    Alert.alert("Error", "Failed to fetch bookmarks");
  }
};

  useFocusEffect(
    useCallback(() => {
      fetchBookmarks();
    }, [userId])
  );

const toggleDescription = (postId: number) => {
  setBookmarkedPosts(prev =>
    prev.map(post => {
      if (post.id === postId) {
        if (!post.showDescription && !post.viewCounted) {
          handleInteraction(post.id, 'view');
          return {
            ...post,
            showDescription: true,
            viewCounted: true, // optimistic update
          };
        }
        return { ...post, showDescription: !post.showDescription };
      }
      return post;
    })
  );
};

  const toggleBookmark = async (post_id: number) => {
    if (!userId) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/bookmark/bookmark`, {
        user_id: userId,
        opennote_id: post_id,
      });
      if (res.data.status === 'removed') {
        setBookmarkedPosts((prev: BookmarkedPost[]) => prev.filter((post: BookmarkedPost) => post.id !== post_id));
      }
    } catch (err: unknown) {
      console.error('❌ Bookmark toggle error:', (err as Error).message);
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  const handleInteraction = async (post_id: number, type: 'like' | 'view' | 'share') => {
    if (!userId) return;
    try {
      if (type === 'share') {
        Alert.alert('Info', 'Share feature not implemented yet.');
        return;
      }
      // For like interactions, perform optimistic update first
      if (type === 'like') {
        setBookmarkedPosts(prev =>
          prev.map(post => {
            if (post.id === post_id) {
              const wasLiked = post.isLiked;
              return {
                ...post,
                isLiked: !wasLiked,
                likeCount: post.likeCount + (wasLiked ? -1 : 1),
                isInteractionPending: true,
              };
            }
            return post;
          })
        );
      }
      const res = await axios.post(`${BACKEND_URL}/interact/interact`, {
        user_id: userId,
        post_id,
        interaction_type: type,
      });
      if (type === 'like') {
        const { isLiked, likecount } = res.data;
        setBookmarkedPosts(prev =>
          prev.map(post =>
            post.id === post_id
              ? {
                  ...post,
                  isLiked: isLiked ?? post.isLiked,
                  likeCount: (typeof likecount === 'number' && likecount >= 0) ? likecount : post.likeCount,
                  isInteractionPending: false,
                }
              : post
          )
        );
      } else if (type === 'view') {
        const { viewcount } = res.data;
        setBookmarkedPosts(prev =>
          prev.map(post =>
            post.id === post_id
              ? {
                  ...post,
                  viewCount: viewcount ?? post.viewCount,
                  viewCounted: true,
                }
              : post
          )
        );
      }
    } catch (err: unknown) {
      console.error(`❌ Failed to record ${type}:`, (err as Error).message);
      Alert.alert('Error', `Failed to ${type} post`);
      if (type === 'like') {
        setBookmarkedPosts(prev =>
          prev.map(post =>
            post.id === post_id
              ? {
                  ...post,
                  isLiked: post.isLiked,
                  likeCount: post.likeCount,
                  isInteractionPending: false,
                }
              : post
          )
        );
      }
    }
  };

  const openUploadsModal = (postId: number) => {
    setUploadsModal({ visible: true, postId });
    fetchUploads(postId);
  };
  const closeUploadsModal = () => {
    setUploadsModal({ visible: false });
    setUploadsList([]);
  };
  const fetchUploads = async (postId: number) => {
    setUploadsLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/upload/uploads-for-post/${postId}`);
      setUploadsList(res.data.uploads || []);
    } catch (err) {
      setUploadsList([]);
    } finally {
      setUploadsLoading(false);
    }
  };
  const openUploadFormModal = (postId: number) => {
    setUploadFormModal({ visible: true, postId });
    setUploadForm({ title: '', description: '', tags: '', file: null });
  };
  const closeUploadFormModal = () => {
    setUploadFormModal({ visible: false });
    setUploadForm({ title: '', description: '', tags: '', file: null });
  };
  const handlePickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploadForm(form => ({ ...form, file: result.assets[0] }));
        Alert.alert('File Selected', result.assets[0].name);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF file');
    }
  };
  const handleUploadPDFToPost = async () => {
    if (!uploadFormModal.postId || !uploadForm.file || !uploadForm.title.trim() || !uploadForm.description.trim()) {
      Alert.alert('Error', 'Please fill all fields and select a PDF file');
      return;
    }
    setUploadFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uploadForm.file.uri,
        name: uploadForm.file.name || 'document.pdf',
        type: uploadForm.file.mimeType || 'application/pdf',
      } as any);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('tags', uploadForm.tags);
      const response = await axios.post(`${BACKEND_URL}/upload/upload-to-post/${uploadFormModal.postId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', 'PDF uploaded to post!');
      closeUploadFormModal();
      if (uploadsModal.visible && uploadsModal.postId === uploadFormModal.postId) {
        fetchUploads(uploadFormModal.postId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload PDF');
    } finally {
      setUploadFormLoading(false);
    }
  };

  const renderItem = ({ item }: { item: BookmarkedPost }) => (
  <View style={styles.postCard}>
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.metaText}>{item.viewCount} views • {item.likeCount} likes</Text>
    {/* Upload PDF and View Uploads buttons for text posts */}
    {item.type === 'text' && (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <TouchableOpacity style={styles.pdfButton} onPress={() => openUploadFormModal(item.id)}>
          <Ionicons name="cloud-upload-outline" size={20} color="#007AFF" />
          <Text style={styles.pdfButtonText}>Upload PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pdfButton, { marginLeft: 8 }]} onPress={() => openUploadsModal(item.id)}>
          <Ionicons name="list-outline" size={20} color="#007AFF" />
          <Text style={styles.pdfButtonText}>View Uploads</Text>
        </TouchableOpacity>
      </View>
    )}
    {item.url && (
      <TouchableOpacity
        style={styles.pdfButton}
        onPress={() => navigation.navigate('PdfWebViewer', { fileUrl: item.url })}
      >
        <Ionicons name="document-text-outline" size={20} color="#007AFF" />
        <Text style={styles.pdfButtonText}>View PDF</Text>
      </TouchableOpacity>
    )}

    <TouchableOpacity onPress={() => toggleDescription(item.id)}>
      <Text style={styles.toggleDescriptionText}>
        {item.showDescription ? 'Hide Description' : 'Show Description'}
      </Text>
    </TouchableOpacity>

    {item.showDescription && (
      <Text style={styles.description}>{item.description}</Text>
    )}

    {/* 💬 Action Buttons */}
    <View style={styles.actions}>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => !item.isInteractionPending && handleInteraction(item.id, 'like')}
        disabled={item.isInteractionPending}
      >
        <Ionicons
          name={item.isLiked ? "thumbs-up" : "thumbs-up-outline"}
          size={20}
          color={item.isLiked ? "#3B82F6" : "#007AFF"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate('Comment', { postId: item.id, userId: userId! })}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
        <Text style={styles.countText}>{item.commentCount ?? 0}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => handleShare(item, userId)}
      >
        <Ionicons name="share-social-outline" size={20} color="#007AFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => toggleBookmark(item.id)}
      >
        <Ionicons name="bookmark" size={20} color="#f59e0b" />
        <Text style={styles.countText}>{item.bookmarkCount ?? 0}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <FlatList
          data={bookmarkedPosts.filter(post => post && post.id)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No bookmarks found.</Text>}
        />
        {/* Upload PDF Modal */}
        <Modal
          visible={uploadFormModal.visible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeUploadFormModal}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Upload PDF to Post</Text>
              <TextInput
                placeholder="Title"
                value={uploadForm.title}
                onChangeText={text => setUploadForm(form => ({ ...form, title: text }))}
                style={[styles.inputBox, { marginBottom: 10 }]}
                placeholderTextColor="#aaa"
              />
              <TextInput
                placeholder="Description"
                value={uploadForm.description}
                onChangeText={text => setUploadForm(form => ({ ...form, description: text }))}
                style={[styles.inputBox, { marginBottom: 10, height: 80 }]}
                multiline
                placeholderTextColor="#aaa"
              />
              <TextInput
                placeholder="Tags (comma separated)"
                value={uploadForm.tags}
                onChangeText={text => setUploadForm(form => ({ ...form, tags: text }))}
                style={[styles.inputBox, { marginBottom: 10 }]}
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity style={styles.pdfButton} onPress={handlePickPDF}>
                <Ionicons name="document-text-outline" size={20} color="#007AFF" />
                <Text style={styles.pdfButtonText}>{uploadForm.file ? uploadForm.file.name : 'Select PDF'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pdfButton, { backgroundColor: '#3B82F6', marginTop: 16 }]}
                onPress={handleUploadPDFToPost}
                disabled={uploadFormLoading}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{uploadFormLoading ? 'Uploading...' : 'Upload PDF'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeUploadFormModal} style={{ marginTop: 16, alignSelf: 'center' }}>
                <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Uploads Modal */}
        <Modal
          visible={uploadsModal.visible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeUploadsModal}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxHeight: '70%' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Uploads</Text>
              {uploadsLoading ? (
                <ActivityIndicator size="large" color="#3B82F6" />
              ) : uploadsList.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center' }}>No uploads yet.</Text>
              ) : (
                <FlatList
                  data={uploadsList}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => {
                      closeUploadsModal();
                      navigation.navigate('PdfWebViewer', { fileUrl: item.url });
                    }}>
                      <Text style={{ color: '#2563EB', fontWeight: '600' }}>{item.title || 'PDF'}</Text>
                      <Text style={{ color: '#888', fontSize: 12 }}>{new Date(item.created_at).toLocaleString()}</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
              <TouchableOpacity onPress={closeUploadsModal} style={{ marginTop: 16, alignSelf: 'center' }}>
                <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </BackgroundWrapper>
  );
};

export default DownloadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 10,
    borderRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
  },
  pdfButtonText: {
    marginLeft: 6,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  metaText: {
  fontSize: 12,
  color: '#666',
  marginBottom: 10,
},
  toggleDescriptionText: {
    color: '#007AFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#333',
    marginBottom: 5,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF7E0',
    marginHorizontal: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#aaa',
  },
  countText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 2,
    fontWeight: '600',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 16,
  },
});
