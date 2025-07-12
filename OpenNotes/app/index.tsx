import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import { View, ActivityIndicator, Text, Image, StyleSheet } from 'react-native';
import BottomTabNavigator from './navigation/BottomTabNavigatior';
import LoginScreen from './main/LoginScreen';
import { createStackNavigator } from '@react-navigation/stack';
import * as WebBrowser from 'expo-web-browser';
import InterestsScreen from './main/InterestsScreen';

WebBrowser.maybeCompleteAuthSession();
const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      {/* Replace with your logo if available */}
      <Image source={require('../assets/images/splash-icon.png')} style={styles.splashLogo} />
      <Text style={styles.splashTitle}>Open Notes</Text>
      <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 24 }} />
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return user ? <BottomTabNavigator /> : <AuthStack />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  splashLogo: {
    width: 100,
    height: 100,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
    letterSpacing: 1.2,
  },
});