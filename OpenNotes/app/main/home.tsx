import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const posts = [
  {
    id: '1',
    user: 'Allie Moreno',
    time: '2 days ago',
    views: '1.2M views',
    content: 'Exploring the wonders of Antelope Canyon.',
    image: 'https://i.imgur.com/sZC1R.png',
  },
  {
    id: '2',
    user: 'Alex Leavitt',
    time: '3 days ago',
    views: '24K views',
    content: 'Sunset vibes in the desert!',
    image: 'https://i.imgur.com/jtYGV.png',
  },
  {
    id: '3',
    user: 'Sophia Clarke',
    time: '5 hours ago',
    views: '10K views',
    content: 'Morning coffee with a mountain view.',
    image: 'https://i.imgur.com/8Km9tLL.png',
  },
  {
    id: '4',
    user: 'Daniel Wright',
    time: '1 week ago',
    views: '540K views',
    content: 'Night lights of the city never disappoint.',
    image: 'https://i.imgur.com/UPrs1EW.png',
  },
];

export default function HomeScreen() {
  const renderItem = ({ item }: any) => {
    const slideAnim = new Animated.Value(100);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return (
      <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-circle-outline" size={40} color="#007AFF" />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.username}>{item.user}</Text>
              <Text style={styles.subInfo}>{item.time} • {item.views}</Text>
            </View>
          </View>
          <Feather name="bookmark" size={24} color="#007AFF" />
        </View>

        <Text style={styles.content}>{item.content}</Text>

        <Image source={{ uri: item.image }} style={styles.postImage} />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="thumbs-up-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-social-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  card: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subInfo: {
    fontSize: 12,
    color: '#777',
  },
  content: {
    fontSize: 14,
    marginVertical: 10,
    color: '#444',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    color: '#007AFF',
  },
});
