import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';
import { supabase } from './utils/supabase';

export default function OAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/'); // User is logged in, go to home
      } else {
        router.replace('/main/LoginScreen'); // Not logged in, go to login
      }
    };
    checkSession();
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Redirecting...</Text>
    </View>
  );
}