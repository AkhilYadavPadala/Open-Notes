import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';


export default function ProfileScreen() {
  const [profileImage, setProfileImage] = useState(
    'https://via.placeholder.com/150'
  );
  const [loading, setLoading] = useState(false);

  // Optional: Fetch the currently logged-in user on mount
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const sessionUser = supabase.auth.getUser();
    sessionUser.then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        if (data.user.user_metadata?.avatar_url) {
          setProfileImage(data.user.user_metadata.avatar_url);
        }
      }
    });
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        // Supabase handles redirect automatically in Expo
        Alert.alert('Success', 'Check your browser to complete login');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <View style={styles.profileContainer}>
        <Pressable onPress={pickImage}>
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
          <Text style={styles.uploadText}>Upload Profile</Text>
        </Pressable>

        <Text style={styles.username}>{user?.email || 'John Doe'}</Text>
        <Text style={styles.bio}>Passionate Developer & Tech Lover 🚀</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>25</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>1.2k</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>180</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <Pressable
          style={styles.button}
          onPress={() => Alert.alert('Edit Profile')}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => Alert.alert('Settings')}
        >
          <Text style={styles.buttonText}>Settings</Text>
        </Pressable>

        <Pressable
          style={[styles.button, { backgroundColor: '#EF4444' }]}
          onPress={() => Alert.alert('Logged Out')}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable>

        {/* Google Login Button */}
        <Pressable
          style={[styles.button, { backgroundColor: '#4285F4', marginTop: 20 }]}
          onPress={signInWithGoogle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in with Google</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    height: 100,
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: -60,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadText: {
    color: '#3B82F6',
    marginTop: 5,
    fontSize: 12,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#111',
  },
  bio: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 15,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  statLabel: {
    fontSize: 13,
    color: 'gray',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
