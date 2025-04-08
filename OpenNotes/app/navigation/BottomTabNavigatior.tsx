import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';

import HomeScreen from '../main/home';
import SearchScreen from '../main/search';
import UploadOptionScreen from '../main/upload';  // Correct Import
import DownloadScreen from '../main/download';
import ProfileScreen from '../main/profile';

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({ children, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.uploadButtonContainer}
      onPress={onPress}
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
          backgroundColor: colorScheme === 'dark' ? '#111' : '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 70,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName} size={24} color={focused ? '#3B82F6' : 'gray'} />;
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
            return <Ionicons name={iconName} size={24} color={focused ? '#3B82F6' : 'gray'} />;
          } else if (route.name === 'Download') {
            return <Feather name="download" size={24} color={focused ? '#3B82F6' : 'gray'} />;
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName} size={24} color={focused ? '#3B82F6' : 'gray'} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen
        name="Upload"
        component={UploadOptionScreen} // This navigates to UploadOptionScreen
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="plus" size={24} color="#fff" />
          ),
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tab.Screen name="Download" component={DownloadScreen} />
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
