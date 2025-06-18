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
import { supabase } from '../utils/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';


WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const [profileImage, setProfileImage] = useState(
    'https://via.placeholder.com/150'
  );
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'opennotes', // your custom scheme from app.json
  });
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '296978714021-0bccbunpvlsn4eubihoi1bq6f0sj7k2o.apps.googleusercontent.com',
    iosClientId: '296978714021-32itoknn1ldgd2egsi1rdj87bknd6t50.apps.googleusercontent.com',
    androidClientId: '296978714021-32itoknn1ldgd2egsi1rdj87bknd6t50.apps.googleusercontent.com',
    redirectUri,
    scopes: ['profile', 'email'],
  });



  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        setUser(sessionData.session.user);
        const avatar = sessionData.session.user.user_metadata?.avatar_url;
        if (avatar) setProfileImage(avatar);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      const idToken = response.authentication.idToken;
      const accessToken = response.authentication.accessToken;
  
      console.log('✅ ID Token:', idToken);
      console.log('✅ Access Token:', accessToken);
  
      if (!idToken || !accessToken) {
        Alert.alert('Missing token(s)', 'ID Token or Access Token is not received from Google');
        return;
      }
  
      handleGoogleSignIn(idToken, accessToken);
    } else if (response?.type === 'error') {
      console.error('Google Auth Error:', response.error);
      Alert.alert('Auth Error', 'Failed to authenticate with Google');
    }
  }, [response]);
  
  
  

  const handleGoogleSignIn = async (idToken: string, accessToken: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        access_token: accessToken,
      });
  
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Successfully signed in with Google');
        setUser(data.user);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Sign-In Error', error.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  

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
          onPress={async () => {
            await supabase.auth.signOut();
            setUser(null);
            Alert.alert('Logged Out');
          }}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable>

        {!user && (
          <View style={styles.googleButtonContainer}>
            <Pressable
              style={[styles.button, { backgroundColor: '#4285F4' }]}
              onPress={() => promptAsync()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in with Google</Text>
              )}
            </Pressable>
          </View>
        )}
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
  googleButtonContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
});
