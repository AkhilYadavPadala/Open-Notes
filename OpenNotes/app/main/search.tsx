import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const dummyData = [
  { id: '1', title: 'Paris Tour', image: 'https://i.imgur.com/8Km9tLL.png' },
  { id: '2', title: 'Mountain Hiking', image: 'https://i.imgur.com/jtYGV.png' },
  { id: '3', title: 'Beach Relax', image: 'https://i.imgur.com/UPrs1EW.png' },
  { id: '4', title: 'City Exploration', image: 'https://i.imgur.com/sZC1R.png' },
];

const defaultTags = ['Beach', 'Mountain', 'City', 'Adventure', 'Popular'];

const AnimatedCard = ({ item }) => {
  const anim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { transform: [{ translateY: anim }] }]}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{item.title}</Text>
    </Animated.View>
  );
};

export default function SearchScreen() {
  const [search, setSearch] = useState('');

  const filteredData = dummyData.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#aaa" />
        <TextInput
          placeholder="Search destinations..."
          style={styles.input}
          value={search}
          onChangeText={setSearch}
        />
        <Feather name="filter" size={20} color="#007AFF" />
      </View>

      {search === '' && (
        <View style={styles.tagsContainer}>
          {defaultTags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tagBtn}
              onPress={() => setSearch(tag)}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          renderItem={({ item }) => <AnimatedCard item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View style={styles.noResult}>
          <Image
            source={{ uri: 'https://i.imgur.com/VzvD0uD.png' }} // No Result Illustration
            style={{ width: 200, height: 200 }}
          />
          <Text style={{ fontSize: 16, color: '#999', marginTop: 10 }}>
            No Results Found
          </Text>
        </View>
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
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    marginBottom: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  noResult: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
