import React from 'react';
import type { ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../main/home';
import SearchScreen from '../main/search';
import UploadOptionScreen from '../main/upload';
import DownloadScreen from '../main/download';
import ProfileScreen from '../main/profile';
import PdfWebViewer from '../main/pdfViewer';
import CommentScreen from '../main/CommentScreen'; // Adjust path as needed


const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="PdfWebViewer"
        component={PdfWebViewer}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'View PDF',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Comment"
        component={CommentScreen}
        options={{
          headerShown: true,
          title: 'Comments',
        }}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile',
        }}
      />
    </Stack.Navigator>
  );
};

// Inside BottomTabNavigator.tsx
const SearchStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SearchMain" 
        component={SearchScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="PdfWebViewer"
        component={PdfWebViewer}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'View PDF',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Comment"
        component={CommentScreen}
        options={{
          headerShown: true,
          title: 'Comments',
        }}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile',
        }}
      />
    </Stack.Navigator>
  );
};

const DownloadStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DownloadMain" 
        component={DownloadScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="PdfWebViewer"
        component={PdfWebViewer}
        options={({ navigation }) => ({
          headerShown: true,
          title: 'View PDF',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Comment"
        component={CommentScreen}
        options={{
          headerShown: true,
          title: 'Comments',
        }}
      />
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile',
        }}
      />
    </Stack.Navigator>
  );
};

type CustomTabBarButtonProps = {
  children: ReactNode;
  onPress?: (...args: any[]) => void;
};
const CustomTabBarButton = ({ children, onPress }: CustomTabBarButtonProps) => {
  const handlePress = onPress || (() => {});
  return (
    <TouchableOpacity
      style={styles.uploadButtonContainer}
      onPress={handlePress}
      activeOpacity={0.7}>
      <View style={styles.uploadButton}>{children}</View>
    </TouchableOpacity>
  );
};

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
          borderTopWidth: 0,
        },
        tabBarIcon: ({ focused }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={24} color={focused ? '#ffffff' : '#888888'} />;
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
            return <Ionicons name={iconName} size={24} color={focused ? '#ffffff' : '#888888'} />;
          } else if (route.name === 'Download') {
            return <Feather name="download" size={24} color={focused ? '#ffffff' : '#888888'} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={24} color={focused ? '#ffffff' : '#888888'} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen
        name="Upload"
        component={UploadOptionScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="plus" size={24} color="#fff" />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen name="Download" component={DownloadStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  uploadButtonContainer: {
    top: -30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});