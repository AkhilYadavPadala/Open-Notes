import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { getBackendUrl } from '../utils/config';
import BackgroundWrapper from '../utils/BackgroundWrapper';

console.log('LoginScreen mounted');

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '296978714021-2j0qim3a41vnfgch8vvv5hjgro5bgkpc.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    redirectUri: 'com.akhilpadala.opennotes:/oauthredirect',
  });

  useEffect(() => {
    console.log('Google useEffect triggered', response);
    if (response?.type === 'success') {
      console.log('Google auth success with response:', response);
      
      if (response.authentication?.idToken) {
        // Direct ID token flow
        console.log('Using direct ID token:', response.authentication.idToken);
        handleGoogleSignIn(response.authentication.idToken);
      } else if (response.params?.code) {
        // Authorization code flow - need to exchange for ID token
        console.log('Using authorization code:', response.params.code);
        handleGoogleSignInWithCode(response.params.code);
      } else {
        console.log('No ID token or authorization code found in response');
        Alert.alert('Error', 'No authentication tokens received from Google');
      }
    } else if (response?.type === 'error') {
      console.error('Google Auth Error:', response.error);
      Alert.alert('Auth Error', `Failed to authenticate with Google: ${response.error?.message || 'Unknown error'}`);
    } else if (response?.type === 'dismiss') {
      console.log('User dismissed auth flow');
    } else if (response === null) {
      console.log('Response is null - this is normal on initial load');
    }
  }, [response]);

  useEffect(() => {
    // Listen for deep links
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Received deep link:', url);
      const parsed = Linking.parse(url);
      let code = parsed?.queryParams?.code;
      if (Array.isArray(code)) code = code[0];
      if (code) {
        setLoading(true);
        console.log('Parsed code from deep link:', code);
        handleGoogleSignInWithCode(code);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Also check if app was opened with a link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        const parsed = Linking.parse(url);
        let code = parsed?.queryParams?.code;
        if (Array.isArray(code)) code = code[0];
        if (code) {
          setLoading(true);
          console.log('Parsed code from initial URL:', code);
          handleGoogleSignInWithCode(code);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Show loading spinner instantly after redirect if pending_login is set
    AsyncStorage.getItem('pending_login').then((pending) => {
      if (pending === 'true') {
        setLoading(true);
      }
    });
  }, []);

  const handleGoogleSignIn = async (idToken: string) => {
    setLoading(true);
    try {
      console.log('Attempting Supabase sign-in with Google token:', idToken);

      // 1. Sign in with Google token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      console.log('Supabase signInWithIdToken result:', { data, error });

      if (error) throw error;

      // 2. Immediately get and log the session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session after Supabase signInWithIdToken:', sessionData);

      if (!sessionData.session) {
        throw new Error('No session found after sign-in');
      }

      // 3. Check if user exists in users table (case-insensitive)
      const userEmail = sessionData.session.user.email ?? '';
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .ilike('email', userEmail)
        .maybeSingle();
      if (userRow) {
        router.replace('/'); // User exists, go to home
      } else {
        router.replace('/main/InterestsScreen'); // New user, go to interests
      }

    } catch (error: any) {
      console.error('Sign-In Error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInWithAccessToken = async (accessToken: string) => {
    setLoading(true);
    try {
      console.log('Attempting Supabase sign-in with Google access token:', accessToken);

      // 1. Sign in with Google access token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: accessToken,
      });

      console.log('Supabase signInWithIdToken result:', { data, error });

      if (error) throw error;

      // 2. Immediately get and log the session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session after Supabase signInWithIdToken:', sessionData);

      if (!sessionData.session) {
        throw new Error('No session found after sign-in');
      }

      // 3. Check if user exists in users table (case-insensitive)
      const userEmail = sessionData.session.user.email ?? '';
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .ilike('email', userEmail)
        .maybeSingle();
      if (userRow) {
      router.replace('/');
      } else {
        router.replace('/main/InterestsScreen');
      }

    } catch (error: any) {
      console.error('Sign-In Error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInWithCode = async (code: string) => {
    setLoading(true);
    try {
      console.log('🔄 Starting Google OAuth flow with code');
      // Always use backend code exchange flow
      const codeVerifier = await AsyncStorage.getItem('google_code_verifier');
      if (!codeVerifier) throw new Error('No code verifier found for PKCE flow.');
      console.log('Calling backend with code and codeVerifier:', code, codeVerifier);
      const backendUrl = `${getBackendUrl()}/oauth/google`;
      console.log('🌐 OAuth backend URL:', backendUrl);
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          codeVerifier,
          redirectUri: 'com.akhilpadala.opennotes:/oauthredirect',
        }),
      });
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('Backend response:', data);
      if (data.error) {
        console.log('Backend returned error:', data.error, data.error_description);
        throw new Error(data.error_description || data.error);
      }
      // Now sign in with Supabase using the id_token
      console.log('Signing in with Supabase using id_token:', data.id_token);
      const { data: supaData, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: data.id_token,
      });
      console.log('Supabase signInWithIdToken result:', { supaData, error });
      if (error) throw error;
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session after Supabase signInWithIdToken:', sessionData);
      if (!sessionData.session) {
        throw new Error('No session found after sign-in');
      }
      // 3. Check if user exists in users table (case-insensitive)
      const userEmail = sessionData.session.user.email ?? '';
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .ilike('email', userEmail)
        .maybeSingle();
      if (userRow) {
        router.replace('/');
      } else {
        router.replace('/main/InterestsScreen');
      }
    } catch (error: any) {
      console.log('❌ Error in handleGoogleSignInWithCode:', error);
      console.log('🔍 Full error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
      await AsyncStorage.removeItem('pending_login'); // Remove pending login flag
    }
  };

  const handleGoogleLogin = async () => {
    console.log('Google login button pressed');
    try {
      if (request?.codeVerifier) {
        await AsyncStorage.setItem('google_code_verifier', request.codeVerifier);
        await AsyncStorage.setItem('pending_login', 'true'); // Set pending login flag
        console.log('Saved codeVerifier to AsyncStorage:', request.codeVerifier);
      }
      const result = await promptAsync();
      console.log('promptAsync result:', result);
    } catch (error) {
      console.error('Error calling promptAsync:', error);
      Alert.alert('Error', 'Failed to start Google authentication');
    }
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={{ marginTop: 16, color: '#4285F4', fontWeight: 'bold' }}>Signing you in...</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Sign in to OpenNotes</Text>
            <Pressable
              style={[styles.button, { backgroundColor: '#4285F4' }]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </Pressable>
          </>
        )}
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#ffffff',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});