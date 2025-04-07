import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';
import UploadOptionScreen from '../main/upload';


import HomeScreen from '../main/home';
import SearchScreen from '../main/search';
import UploadScreen from '../main/upload';
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
        tabBarIcon: ({ focused }) => {
          let iconColor = focused ? '#3B82F6' : 'gray';

          if (route.name === 'Home') {
            return <Ionicons name="home" size={24} color={iconColor} />;
          } else if (route.name === 'Search') {
            return <Ionicons name="search" size={24} color={iconColor} />;
          } else if (route.name === 'Download') {
            return <Feather name="download" size={24} color={iconColor} />;
          } else if (route.name === 'Profile') {
            return <Ionicons name="person" size={24} color={iconColor} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />

      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarIcon: () => (
            <Feather name="upload" size={28} color="#fff" style={{ lineHeight: 30 }} />
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
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});

export default BottomTabNavigator;