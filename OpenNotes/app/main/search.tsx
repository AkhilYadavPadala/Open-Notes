import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
// @ts-ignore
import debounce from 'lodash.debounce';
import { supabase } from '../utils/supabase';
import { handleShare } from '../utils/shareHandler';

const BACKEND_URL = 'http://192.168.19.251:5000';
const defaultTags = ['AI', 'Machine Learning', 'python', 'Dbms'];

type SearchPost = {
  id: number;
  title: string;
  description: string;
  url?: string;
  showDescription: boolean;
  isLiked: boolean;
  viewCounted: boolean;
  likeCount: number;
  viewCount: number;
  isInteractionPending?: boolean;
  commentCount?: number;
  bookmarkCount?: number;
  commentcount?: number;
  bookmarkcount?: number;
  isBookmarked: boolean;
  isBookmarkPending?: boolean;
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

export default function SearchScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getCurrentUserId();
      setUserId(id);
    };
    fetchUserId();
  }, []);

  const fetchResults = useCallback(async (query = '') => {
    if (!query.trim() || !userId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/retrieve/files?query=${encodeURIComponent(query)}&user_id=${userId}`);
      const enrichedResults = res.data.map((post: any): SearchPost => ({
        ...post,
        showDescription: false,
        isLiked: post.isLiked ?? false,
        viewCounted: false,
        likeCount: post.likecount ?? 0,
        viewCount: post.viewcount ?? 0,
        isInteractionPending: false,
        commentCount: post.commentCount ?? 0,
        bookmarkCount: post.bookmarkcount ?? 0,
        bookmarkcount: post.bookmarkcount ?? 0,
        isBookmarked: post.isBookmarked ?? post.isbookmarked ?? false,
        isBookmarkPending: false,
      }));
      setResults(enrichedResults);
    } catch (err: any) {
      console.error('Error fetching results:', err.message);
      Alert.alert('Error', 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const debouncedFetch = useCallback(debounce(fetchResults, 400), [fetchResults]);

  useEffect(() => {
    if (search.trim() !== '' && userId) {
      debouncedFetch(search);
    } else {
      setResults([]); // clear the list when search is empty
    }
  }, [search, debouncedFetch, userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (search.trim() !== '' && userId) {
      fetchResults(search).finally(() => setRefreshing(false));
    } else {
      setResults([]);  // clear results
      setRefreshing(false);
    }
  }, [fetchResults, search, userId]);

  const handleInteraction = async (post_id: number, type: 'like' | 'view' | 'share') => {
    if (!userId) return;
    try {
      if (type === 'share') {
        Alert.alert('Info', 'Share feature not implemented yet.');
        return;
      }
      // For like interactions, perform optimistic update first
      if (type === 'like') {
        setResults(prev =>
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
        setResults(prev =>
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
        setResults(prev =>
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
        setResults(prev =>
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

  const toggleDescription = (postId: number) => {
    setResults(prev =>
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
    // Optimistic update
    setResults(prev =>
      prev.map(post => {
        if (post.id === post_id) {
          const wasBookmarked = post.isBookmarked;
          return {
            ...post,
            isBookmarked: !wasBookmarked,
            bookmarkCount: (post.bookmarkCount ?? 0) + (wasBookmarked ? -1 : 1),
            bookmarkcount: (post.bookmarkCount ?? 0) + (wasBookmarked ? -1 : 1),
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
      console.log('Bookmark API response:', res.data);
      setResults(prev =>
        prev.map(post => {
          if (post.id === post_id) {
            const status = res.data.status;
            const backendCount = typeof res.data.bookmarkcount === 'number' ? res.data.bookmarkcount : post.bookmarkCount ?? 0;
            let isBookmarked = post.isBookmarked;
            if (status === 'added') {
              isBookmarked = true;
            } else if (status === 'removed') {
              isBookmarked = false;
            }
            return {
              ...post,
              isBookmarked,
              bookmarkCount: backendCount,
              bookmarkcount: backendCount,
              isBookmarkPending: false,
            };
          }
          return post;
        })
      );
    } catch (err: any) {
      // Revert optimistic update
      setResults(prev =>
        prev.map(post => {
          if (post.id === post_id) {
            return {
              ...post,
              isBookmarked: post.isBookmarked,
              bookmarkCount: post.bookmarkCount,
              bookmarkcount: post.bookmarkCount,
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

  const renderItem = ({ item }: { item: SearchPost }) => (
    <View style={styles.postCard}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.metaText}>{item.viewCount} views • {item.likeCount} likes</Text>

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

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => !item.isInteractionPending && handleInteraction(item.id, 'like')}
          disabled={item.isInteractionPending}
        >
          <Ionicons
            name={item.isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
            size={20}
            color={item.isLiked ? '#3B82F6' : '#007AFF'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Comment', { postId: item.id, userId: userId! })}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
          <Text style={styles.countText}>{item.commentcount ?? 0}</Text>
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
          disabled={item.isBookmarkPending}
        >
          <Ionicons
            name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={item.isBookmarked ? '#f59e0b' : '#007AFF'}
          />
          <Text style={styles.countText}>{item.bookmarkCount ?? 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#aaa" />
        <TextInput
          placeholder="Search notes..."
          style={styles.input}
          value={search}
          onChangeText={setSearch}
        />
        <Feather name="filter" size={20} color="#007AFF" />
      </View>

      {search === '' && (
        <View style={styles.tagsContainer}>
          {defaultTags.map((tag, index) => (
            <TouchableOpacity key={index} style={styles.tagBtn} onPress={() => setSearch(tag)}>
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={
            <View style={styles.noResult}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <Text style={{ fontSize: 16, color: '#999', marginTop: 10 }}>
                No Results Found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  input: { flex: 1, padding: 10, fontSize: 16 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  tagBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: { fontSize: 14, color: '#555' },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  metaText: { fontSize: 12, color: '#666', marginBottom: 10 },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
  },
  pdfButtonText: { marginLeft: 6, color: '#007AFF', fontWeight: 'bold' },
  toggleDescriptionText: { color: '#007AFF', marginBottom: 8, fontWeight: '500' },
  description: { fontSize: 15, color: '#333', marginBottom: 5, lineHeight: 22 },
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
    backgroundColor: '#F0F7FF',
    marginHorizontal: 2,
  },
  noResult: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  countText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 2,
    fontWeight: '600',
  },
});