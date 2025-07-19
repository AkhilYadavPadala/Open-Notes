import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { handleShare } from '../utils/shareHandler';
import * as DocumentPicker from 'expo-document-picker';
import { getBackendUrl } from '../utils/config';
import BackgroundWrapper from '../utils/BackgroundWrapper';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import PdfThumbnail from 'react-native-pdf-thumbnail';

const BACKEND_URL = getBackendUrl();

type Post = {
  id: number;
  title: string;
  description: string;
  url?: string;
  showDescription: boolean;
  isLiked: boolean;
  viewCounted: boolean;
  likeCount: number;
  viewCount: number;
  isBookmarked: boolean;
  isInteractionPending?: boolean;
  isBookmarkPending?: boolean;
  commentCount?: number;
  bookmarkCount?: number;
  type?: string;
  avatar_url?: string;
  location?: string;
};

type InteractionResponse = {
  isLiked?: boolean;
  likecount?: number;
  viewcount?: number;
  status?: string;
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

// PostCard component for each post
function PostCard({ item, navigation, userId, handleInteraction, handleShare }: any) {
  const [pdfThumb, setPdfThumb] = React.useState<string | null>(null);
  const [thumbLoading, setThumbLoading] = React.useState(false);
  React.useEffect(() => {
    let isMounted = true;
    if (item.url) {
      setThumbLoading(true);
      PdfThumbnail.generate(item.url, 0)
        .then(({ uri }) => { if (isMounted) setPdfThumb(uri); })
        .catch(() => { if (isMounted) setPdfThumb(null); })
        .finally(() => { if (isMounted) setThumbLoading(false); });
    } else {
      setPdfThumb(null);
      setThumbLoading(false);
    }
    return () => { isMounted = false; };
  }, [item.url]);
  return (
    <View style={styles.officialCardDark}>
      {/* Top Row: Profile image, name, location/info, menu */}
      <View style={styles.cardTopRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Image
            source={{ uri: item.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.cardProfileImage}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.cardNameDark}>{item.title}</Text>
            <Text style={styles.cardLocationDark}>{item.location || (item.url ? 'PDF File' : 'No location')}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.cardMenuBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#b0b0b0" />
        </TouchableOpacity>
      </View>
      {/* PDF Preview */}
      <View style={styles.cardPdfPreviewWrap}>
        {item.url ? (
          <TouchableOpacity onPress={() => navigation.navigate('PdfWebViewer', { fileUrl: item.url })}>
            <View style={styles.cardPdfPreviewDark}>
              {thumbLoading ? (
                <ActivityIndicator size="small" color="#60a5fa" style={{ marginBottom: 8 }} />
              ) : pdfThumb ? (
                <Image source={{ uri: pdfThumb }} style={styles.cardPdfImage} />
              ) : (
                <Ionicons name="document-text-outline" size={40} color="#60a5fa" />
              )}
              <Text style={styles.cardPdfLabelDark}>Preview PDF</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
      {/* Description (optional) */}
      {item.description ? (
        <Text style={styles.cardDescriptionDark} numberOfLines={3}>{item.description}</Text>
      ) : null}
      {/* Actions Row */}
      <View style={styles.cardActionsRow}>
        <View style={styles.cardActionsLeft}>
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => !item.isInteractionPending && handleInteraction(item.id, 'like')} disabled={item.isInteractionPending}>
            <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={20} color={item.isLiked ? '#f87171' : '#fff'} />
            <Text style={styles.cardActionCountDark}>{item.likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => navigation.navigate('Comment', { postId: item.id, userId: userId! })}>
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.cardActionCountDark}>{item.commentCount ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardActionBtn} onPress={() => handleShare(item, userId)}>
            <Ionicons name="paper-plane-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardTimestampDark}>35 min ago</Text>
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadingMap, setUploadingMap] = useState<{ [postId: number]: boolean }>({});
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

  // Fetch personalized feed from backend
  const fetchFeed = useCallback(async () => {
    if (!userId) return;
    try {
      console.log('🌐 Making API request to:', `${BACKEND_URL}/feed/personalizedfeed/${userId}`);
      const res = await axios.get(`${BACKEND_URL}/feed/personalizedfeed/${userId}`);
      const enrichedPosts: Post[] = res.data.feed.map((post: any) => ({
        ...post,
        showDescription: false,
        isLiked: post.isLiked ?? false,
        viewCounted: false,
        likeCount: post.likecount ?? 0,
        viewCount: post.viewcount ?? 0,
        isBookmarked: post.isBookmarked ?? post.isbookmarked ?? false,
        isInteractionPending: false,
        isBookmarkPending: false,
        commentCount: post.commentcount ?? 0,
        bookmarkCount: post.bookmarkcount ?? 0,
      }));
      setPosts(enrichedPosts);
    } catch (err: any) {
      console.error('❌ Failed to fetch feed:', err.message);
      console.error('🔍 Error details:', err);
      Alert.alert('Error', 'Failed to load feed');
    }
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed().finally(() => setRefreshing(false));
  }, [fetchFeed]);

  useEffect(() => {
    if (userId) fetchFeed();
  }, [fetchFeed, userId]);

const handleInteraction = async (post_id: number, type: 'like' | 'view' | 'share') => {
  if (!userId) return;
  try {
    if (type === 'share') {
      Alert.alert('Info', 'Share feature not implemented yet.');
      return;
    }
    // For like interactions, perform optimistic update first
    if (type === 'like') {
      setPosts(prev =>
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
    const res = await axios.post<InteractionResponse>(`${BACKEND_URL}/interact/interact`, {
      user_id: userId,
      post_id,
      interaction_type: type,
    });
    if (type === 'like') {
      const { isLiked, likecount } = res.data;
      setPosts(prev =>
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
    }
    else if (type === 'view') {
      const { viewcount } = res.data;
      setPosts(prev =>
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
  } catch (err: any) {
    console.error(`Failed to record ${type}:`, err.message);
    Alert.alert('Error', `Failed to ${type} post`);
    if (type === 'like') {
      setPosts(prev =>
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

  // Toggle showing the description and record a view on first expand
  const toggleDescription = (postId: number) => {
    setPosts(prev =>
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
          return {
            ...post,
            showDescription: !post.showDescription,
          };
        }
        return post;
      })
    );
  };

  // Toggle bookmark status by calling backend
  const toggleBookmark = async (post_id: number) => {
    if (!userId) return;
    // Optimistic update
    setPosts(prev =>
      prev.map(post => {
        if (post.id === post_id) {
          const wasBookmarked = post.isBookmarked;
          return {
            ...post,
            isBookmarked: !wasBookmarked,
            bookmarkCount: (post.bookmarkCount ?? 0) + (wasBookmarked ? -1 : 1),
            isBookmarkPending: true,
          };
        }
        return post;
      })
    );
    try {
      const res = await axios.post(`${BACKEND_URL}/bookmark/bookmark`, {
        user_id: userId,
        opennote_id: post_id,
      });
      setPosts(prev =>
        prev.map(post => {
          if (post.id === post_id) {
            const status = res.data.status;
            let isBookmarked = post.isBookmarked;
            let newBookmarkCount = post.bookmarkCount ?? 0;
            if (status === 'added') {
              isBookmarked = true;
              newBookmarkCount = typeof res.data.bookmarkcount === 'number' ? res.data.bookmarkcount : post.bookmarkCount ?? 0;
            } else if (status === 'removed') {
              isBookmarked = false;
              newBookmarkCount = typeof res.data.bookmarkcount === 'number' ? res.data.bookmarkcount : post.bookmarkCount ?? 0;
            }
            return {
              ...post,
              isBookmarked,
              bookmarkCount: newBookmarkCount,
              isBookmarkPending: false,
            };
          }
          return post;
        })
      );
    } catch (err: any) {
      // Revert optimistic update
      setPosts(prev =>
        prev.map(post => {
          if (post.id === post_id) {
            return {
              ...post,
              isBookmarked: post.isBookmarked,
              bookmarkCount: post.bookmarkCount,
              isBookmarkPending: false,
            };
          }
          return post;
        })
      );
      console.error('❌ Bookmark toggle error:', err.message);
      Alert.alert('Error', 'Failed to toggle bookmark');
    }
  };

  // Handler for attaching PDF to a text post
  const handleAttachPDF = async (postId: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      setUploadingMap(map => ({ ...map, [postId]: true }));
      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'document.pdf',
        type: file.mimeType || 'application/pdf',
      } as any);
      formData.append('user_id', userId!);
      const response = await axios.post(`${BACKEND_URL}/post/${postId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', 'PDF uploaded for post!');
      // Optionally refresh uploads list if modal is open
      if (uploadsModal.visible && uploadsModal.postId === postId) {
        fetchUploads(postId);
      }
    } catch (error) {
      console.error('Attach PDF error:', error);
      Alert.alert('Error', 'Failed to attach PDF');
    } finally {
      setUploadingMap(map => ({ ...map, [postId]: false }));
    }
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

  const openUploadsModal = (postId: number) => {
    setUploadsModal({ visible: true, postId });
    fetchUploads(postId);
  };

  const closeUploadsModal = () => {
    setUploadsModal({ visible: false });
    setUploadsList([]);
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

  // Render a single post card
  const renderItem = ({ item }: { item: Post }) => (
    <PostCard
      item={item}
      navigation={navigation}
      userId={userId}
      handleInteraction={handleInteraction}
      handleShare={handleShare}
    />
  );

  return (
    <BackgroundWrapper>
      <FlatList
        data={posts.filter(post => post && post.id)}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
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
      {/* Uploads Modal (unchanged, but now shows PDFs from opennotes) */}
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
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 0,
    marginVertical: 16,
    paddingHorizontal: 12,
  },
  postCard: {
    backgroundColor: 'rgba(30,41,59,0.7)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.15)',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    opacity: 0.7,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  metaText: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 10,
    fontWeight: '500',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(96,165,250,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.18)',
  },
  pdfButtonText: {
    marginLeft: 8,
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 15,
  },
  toggleDescriptionText: {
    color: '#818cf8',
    marginBottom: 10,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'right',
  },
  description: {
    fontSize: 16,
    color: '#e0e7ef',
    marginBottom: 8,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(96,165,250,0.12)',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 2,
  },
  actionText: {
    color: '#4B5563',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  countText: {
    fontSize: 13,
    color: '#fbbf24',
    marginLeft: 4,
    fontWeight: '700',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: 'rgba(30,41,59,0.7)',
    color: '#fff',
    marginBottom: 10,
  },
  officialCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  cardName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  cardLocation: {
    fontSize: 13,
    color: '#7c7c7c',
    marginTop: 2,
  },
  cardMenuBtn: {
    padding: 6,
    marginLeft: 8,
  },
  cardPdfPreviewWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  cardPdfPreview: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    width: 90,
    height: 90,
    marginBottom: 4,
  },
  cardPdfLabel: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 4,
  },
  cardDescription: {
    color: '#444',
    fontSize: 15,
    marginBottom: 10,
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  cardActionCount: {
    marginLeft: 4,
    color: '#222',
    fontWeight: '600',
    fontSize: 14,
  },
  cardTimestamp: {
    color: '#b0b0b0',
    fontSize: 13,
    fontWeight: '500',
  },
  cardPdfImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 4,
  },
  officialCardDark: {
    backgroundColor: '#181f2a',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#232b3b',
  },
  cardNameDark: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  cardLocationDark: {
    fontSize: 13,
    color: '#a0aec0',
    marginTop: 2,
  },
  cardPdfPreviewDark: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#232b3b',
    borderRadius: 12,
    padding: 12,
    width: 90,
    height: 90,
    marginBottom: 4,
  },
  cardPdfLabelDark: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 4,
  },
  cardDescriptionDark: {
    color: '#e0e7ef',
    fontSize: 15,
    marginBottom: 10,
    marginTop: 2,
  },
  cardActionCountDark: {
    marginLeft: 4,
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  cardTimestampDark: {
    color: '#a0aec0',
    fontSize: 13,
    fontWeight: '500',
  },
});
