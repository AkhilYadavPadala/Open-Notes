import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';
import BackgroundWrapper from '../utils/BackgroundWrapper';

const TAGS = [
  'Machine Learning',
  'Python',
  'AI',
  'DBMS',
  'Web Development',
  'Data Science',
  'JavaScript',
  'C++',
  'Cloud',
  'Cybersecurity',
  'Blockchain',
  'React',
  'Node.js',
  'Android',
  'iOS',
  'DevOps',
  'UI/UX',
  'Networking',
  'Algorithms',
  'Linux',
];

export default function InterestsScreen() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        router.replace('/main/LoginScreen');
        return;
      }

      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || '';
      const email = user.email ?? '';
      
      setUserInfo({ name, email });
    };
    
    fetchUser();
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!userInfo) return;
    setLoading(true);
    try {
      const { name, email } = userInfo;
      const interests = selectedTags.join(', ');
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      const avatar_url = user?.user_metadata?.avatar_url || 'https://via.placeholder.com/150';
      const id = user?.id;
      const { error } = await supabase.from('users').upsert(
        { id, name, email, interests, avatar_url },
        { onConflict: 'email' }
      );
      if (error) throw error;
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save interests');
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <BackgroundWrapper>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Select your interests</Text>
        <Text style={styles.label}>Choose topics you are interested in:</Text>
        <ScrollView contentContainerStyle={styles.tagsContainer}>
          {TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Button 
          title={loading ? 'Saving...' : 'Continue'} 
          onPress={handleSubmit} 
          disabled={loading || selectedTags.length === 0} 
        />
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffffff',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#ffffff',
    textAlign: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tag: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 6,
    backgroundColor: '#fff',
  },
  tagSelected: {
    backgroundColor: '#3B82F6',
  },
  tagText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  tagTextSelected: {
    color: '#fff',
  },
});