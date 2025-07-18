import { Share, Alert } from 'react-native';
import axios from 'axios';
import { getBackendUrl } from './config';

const BACKEND_URL = getBackendUrl();

export async function handleShare(post: any, userId: string | null) {
  try {
    // 1. Open native share dialog
    await Share.share({
      message: `${post.title}\n\n${post.description}\n\nRead more: ${post.url || ''}`,
    });

    // 2. Record share in backend
    if (userId) {
      await axios.post(`${BACKEND_URL}/interact/interact`, {
        user_id: userId,
        post_id: post.id,
        interaction_type: 'share',
      });
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to share post');
  }
} 