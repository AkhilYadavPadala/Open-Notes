import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const BACKEND_URL = 'http://192.168.29.15:5000';

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
};

type InteractionResponse = {
  isLiked?: boolean;
  likecount?: number;
  viewcount?: number;
  status?: string;
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);

  const userId = 'f3b9e103-26bd-4c88-b7c7-417801677ce5';

  // Fetch personalized feed from backend
  const fetchFeed = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/feed/personalizedfeed/${userId}`);
      const enrichedPosts: Post[] = res.data.feed.map((post: any) => ({
        ...post,
        showDescription: false,
        isLiked: post.isLiked ?? false,
        viewCounted: false,
        likeCount: post.likecount ?? 0,
        viewCount: post.viewcount ?? 0,
        isBookmarked: post.isBookmarked ?? false,
      }));
      setPosts(enrichedPosts);
    } catch (err: any) {
      console.error('Failed to fetch feed:', err.message);
      Alert.alert('Error', 'Failed to load feed');
    }
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed().finally(() => setRefreshing(false));
  }, [fetchFeed]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

const handleInteraction = async (post_id: number, type: 'like' | 'view' | 'share') => {
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
            likeCount: typeof likecount === 'number' ? likecount : post.likeCount,
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
    try {
      const res = await axios.post(`${BACKEND_URL}/bookmark/bookmark`, {
        user_id: userId,
        opennote_id: post_id,
      });

      setPosts(prev =>
        prev.map(post =>
          post.id === post_id
            ? { ...post, isBookmarked: res.data.status === 'added' }
            : post
        )
      );
    } catch (err: any) {
      console.error('❌ Bookmark toggle error:', err.message);
      Alert.alert('Error', 'Failed to toggle bookmark');
    }
  };

  // Render a single post card
  const renderItem = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.metaText}>
        {item.viewCount} views • {item.likeCount} likes
      </Text>

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

      {item.showDescription && <Text style={styles.description}>{item.description}</Text>}

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
  <Text style={[styles.actionText, item.isLiked && { color: '#3B82F6' }]}>
    {item.isInteractionPending ? '...' : 'Like'}
  </Text>
  </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Comment', { postId: item.id, userId })}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleInteraction(item.id, 'share')}
        >
          <Ionicons name="share-social-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleBookmark(item.id)}>
          <Ionicons
            name={item.isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={item.isBookmarked ? '#f59e0b' : '#007AFF'}
          />
          <Text style={[styles.actionText, item.isBookmarked && { color: '#f59e0b' }]}>
            {item.isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={posts}
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
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1F2937',
    letterSpacing: 0.3,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '500',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  pdfButtonText: {
    marginLeft: 8,
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 15,
  },
  toggleDescriptionText: {
    color: '#2563EB',
    marginBottom: 10,
    fontWeight: '600',
    fontSize: 15,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    color: '#4B5563',
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
});
