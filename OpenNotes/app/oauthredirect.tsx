import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, Text } from 'react-native';

export default function OAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Just redirect to login, where the code exchange will happen
    router.replace('/main/LoginScreen');
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Redirecting...</Text>
    </View>
  );
}