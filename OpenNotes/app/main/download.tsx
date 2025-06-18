import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const BACKEND_URL = 'http://192.168.225.251:5000';
const userId = 'f3b9e103-26bd-4c88-b7c7-417801677ce5';

const DownloadScreen = () => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const navigation = useNavigation();

const fetchBookmarks = async () => {
  try {
    const res = await axios.get(`${BACKEND_URL}/bookmark/bookmark/${userId}`);
    const enriched = res.data.bookmarks.map(post => ({
      ...post,
      showDescription: false,
      isBookmarked: true,
      isLiked: post.isLiked || false,
      likeCount: post.likeCount || 0,
      viewCount: post.viewCount || 0,
      viewCounted: false,   // for tracking if view interaction was counted
    }));
    setBookmarkedPosts(enriched || []);
  } catch (err) {
    console.error("Failed to load bookmarks:", err.message);
    Alert.alert("Error", "Failed to fetch bookmarks");
  }
};


  useFocusEffect(
    useCallback(() => {
      fetchBookmarks();
    }, [])
  );

const toggleDescription = (postId) => {
  setBookmarkedPosts(prev => prev.map(post => {
    if (post.id === postId) {
      if (!post.showDescription && !post.viewCounted) {
        handleInteraction(post.id, 'view');
        return {
          ...post,
          showDescription: true,
          viewCounted: true,
          viewCount: post.viewCount + 1,
        };
      }
      return { ...post, showDescription: !post.showDescription };
    }
    return post;
  }));
};


  const toggleBookmark = async (post_id) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/bookmark/bookmark`, {
        user_id: userId,
        opennote_id: post_id,
      });

      if (res.data.status === 'removed') {
        setBookmarkedPosts(prev => prev.filter(post => post.id !== post_id));
      }
    } catch (err) {
      console.error('❌ Bookmark toggle error:', err.message);
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  const handleInteraction = async (post_id, type) => {
  try {
    await axios.post(`${BACKEND_URL}/interact/interact`, {
      user_id: userId,
      post_id,
      interaction_type: type,
    });

    if (type === 'like') {
      setBookmarkedPosts(prev =>
        prev.map(post =>
          post.id === post_id
            ? {
                ...post,
                isLiked: !post.isLiked,
                likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
              }
            : post
        )
      );
    }
  } catch (err) {
    console.error(`❌ Failed to record ${type}:`, err.message);
    Alert.alert('Error', `Failed to ${type} post`);
  }
};


  const renderItem = ({ item }) => (
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

    {/* 💬 Action Buttons */}
    <View style={styles.actions}>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => handleInteraction(item.id, 'like')}
      >
        <Ionicons
          name={item.isLiked ? "thumbs-up" : "thumbs-up-outline"}
          size={20}
          color={item.isLiked ? "#3B82F6" : "#007AFF"}
        />
        <Text style={[styles.actionText, item.isLiked && { color: "#3B82F6" }]}>
          Like
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

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => toggleBookmark(item.id)}
      >
        <Ionicons name="bookmark" size={20} color="#f59e0b" />
        <Text style={[styles.actionText, { color: "#f59e0b" }]}>
          Bookmarked
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

  return (
    <FlatList
      data={bookmarkedPosts}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={<Text style={styles.emptyText}>No bookmarks found.</Text>}
    />
  );
};

export default DownloadScreen;

const styles = StyleSheet.create({
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
    justifyContent: 'flex-start',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF7E0',
  },
  actionText: {
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#aaa',
  },
});
