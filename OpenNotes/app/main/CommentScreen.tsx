import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  Image
} from 'react-native';
import axios from 'axios';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = 'http://192.168.19.251:5000';

type Comment = {
  id: string;
  comment_text: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
};

type CommentScreenRouteProp = RouteProp<{ params: { postId: string; userId: string } }, 'params'>;

export default function CommentScreen({ navigation }: any) {
  const route = useRoute<CommentScreenRouteProp>();
  const { postId, userId } = route.params;

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/comment/comment/${postId}`);
      setComments(res.data.comments);
    } catch (err: any) {
      console.error('Error fetching comments:', err.message);
      Alert.alert('Error', 'Failed to fetch comments');
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    try {
      await axios.post(`${BACKEND_URL}/comment/comment`, {
        user_id: userId,
        post_id: postId,
        comment_text: commentText,
      });
      setCommentText('');
      fetchComments();
    } catch (err: any) {
      console.error('Error posting comment:', err.message);
      Alert.alert('Error', 'Failed to post comment');
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.select({ ios: 100, android: 80 })}
      >
        {/* Comments List */}
        <View style={styles.commentsContainer}>
          <FlatList
            data={comments}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.commentItemRow}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProfileScreen', { userId: item.user?.id })}
                  disabled={!item.user?.id}
                >
                  <Image
                    source={{ uri: item.user?.avatar_url || 'https://via.placeholder.com/40' }}
                    style={styles.profileIcon}
                  />
                </TouchableOpacity>
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{item.user?.name || 'User'}</Text>
                  <Text style={styles.commentText}>{item.comment_text}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No comments yet</Text>
              </View>
            }
          />
        </View>

        {/* Fixed Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={setCommentText}
            style={styles.input}
            multiline
          />
          <TouchableOpacity 
            onPress={handlePostComment} 
            style={styles.sendButton}
            disabled={!commentText.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={commentText.trim() ? '#007AFF' : '#ccc'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: { 
    flex: 1,
    paddingBottom: 60, // This accounts for the tab bar height
  },
  commentsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  flatListContent: {
    paddingBottom: 100, // Space for input area + tab bar
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  commentItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  commentBubble: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  commentAuthor: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2,
    color: '#222',
  },
  commentText: { 
    fontSize: 14, 
    color: '#333' 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100, // Extra space for tab bar
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
});