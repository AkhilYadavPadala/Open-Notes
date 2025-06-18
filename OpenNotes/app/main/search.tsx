import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import debounce from 'lodash.debounce';

const BACKEND_URL = 'http://192.168.225.251:5000';
const defaultTags = ['AI', 'Machine Learning', 'python', 'Dbms'];

export default function SearchScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const userId = 'd718b7b0-0a63-43aa-bbe6-cecd97737d22';

  const fetchResults = useCallback(async (query = '') => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/retrieve/files?query=${encodeURIComponent(query)}`);
      const enrichedResults = res.data.map(post => ({
        ...post,
        showDescription: false,
        isLiked: post.likedByUser || false,
        viewCounted: false,
        likeCount: post.likeCount || 0,
        viewCount: post.viewCount || 0
      }));
      setResults(enrichedResults);
    } catch (err) {
      console.error('Error fetching results:', err.message);
      Alert.alert('Error', 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback(debounce(fetchResults, 400), [fetchResults]);

useEffect(() => {
  if (search.trim() !== '') {
    debouncedFetch(search);
  } else {
    setResults([]); // clear the list when search is empty
  }
}, [search, debouncedFetch]);


const onRefresh = useCallback(() => {
  setRefreshing(true);
  if (search.trim() !== '') {
    fetchResults(search).finally(() => setRefreshing(false));
  } else {
    setResults([]);  // clear results
    setRefreshing(false);
  }
}, [fetchResults, search]);


  const handleInteraction = async (post_id, type) => {
    try {
      await axios.post(`${BACKEND_URL}/interact/interact`, {
        user_id: userId,
        post_id,
        interaction_type: type,
      });

      if (type === 'like') {
        setResults(prev =>
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
      console.error(`Failed to record ${type}:`, err.message);
      Alert.alert('Error', `Failed to ${type} post`);
    }
  };

  const toggleDescription = (postId) => {
    setResults(prev =>
      prev.map(post => {
        if (post.id === postId) {
          if (!post.showDescription && !post.viewCounted) {
            handleInteraction(post.id, 'view');
            return {
              ...post,
              showDescription: true,
              viewCounted: true,
              viewCount: post.viewCount + 1
            };
          }
          return { ...post, showDescription: !post.showDescription };
        }
        return post;
      })
    );
  };

const renderItem = ({ item }) => (
  <View style={styles.postCard}>
    <Text style={styles.title}>{item.title}</Text>
    <Text style={styles.metaText}>{item.viewCount} views • {item.likeCount} likes</Text>

{item.url && (
  <TouchableOpacity
    style={styles.pdfButton}
    onPress={() => {
      console.log("Opening PDF:", item.url);
      navigation.navigate('PdfWebViewer', { fileUrl: item.url });
    }}
  >
    <Ionicons name="document-text-outline" size={20} color="#007AFF" />
    <Text style={styles.pdfButtonText}>View PDF</Text>
  </TouchableOpacity>
)}

{!item.showDescription && (
  <TouchableOpacity onPress={() => toggleDescription(item.id)}>
    <Text style={styles.toggleDescriptionText}>Show Description</Text>
  </TouchableOpacity>
)}
{item.showDescription && (
  <>
    <TouchableOpacity onPress={() => toggleDescription(item.id)}>
      <Text style={styles.toggleDescriptionText}>Hide Description</Text>
    </TouchableOpacity>
    <Text style={styles.description}>{item.description}</Text>
  </>
)}


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
        <Text style={[styles.actionText, item.isLiked && { color: "#3B82F6" }]}>Like</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => Alert.alert('Coming Soon', 'Comment feature will be added soon')}
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
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
  },
  actionText: { color: '#007AFF', marginLeft: 4, fontWeight: '500' },
  noResult: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
});