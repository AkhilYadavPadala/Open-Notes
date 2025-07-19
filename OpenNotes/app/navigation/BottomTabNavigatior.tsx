import React from 'react';
import type { ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, Animated, Easing, Dimensions, Text } from 'react-native';
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

const { width } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const [expanded, setExpanded] = React.useState(false);
  const animation = React.useRef(new Animated.Value(0)).current;

  // Animation values for morphing FAB
  const fabTranslateY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const fabWidth = animation.interpolate({ inputRange: [0, 1], outputRange: [70, 260] });
  const fabBorderRadius = animation.interpolate({ inputRange: [0, 1], outputRange: [35, 30] });
  const fabShadow = animation.interpolate({ inputRange: [0, 1], outputRange: [5, 10] });
  const optionsOpacity = animation.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0, 0, 1] });
  // Center the FAB horizontally by animating the left property
  const fabLeft = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [width / 2 - 35, width / 2 - 130], // 70/2=35, 260/2=130
  });

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
    Animated.timing(animation, {
      toValue: expanded ? 0 : 1,
      duration: 350,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  };

  // Split tabs: 2 left, 2 right, skip Upload (center)
  const leftTabs = state.routes.slice(0, 2);
  const rightTabs = state.routes.slice(3);

  return (
    <View style={styles.tabBarContainer}>
      <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Left tabs */}
        {leftTabs.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          let iconName: any;
          if (route.name === 'Home') iconName = isFocused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = isFocused ? 'search' : 'search-outline';
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Ionicons name={iconName} size={24} color={isFocused ? '#3B82F6' : '#888888'} />
            </TouchableOpacity>
          );
        })}
        {/* Center placeholder for FAB */}
        <View style={{ width: 80 }} />
        {/* Right tabs */}
        {rightTabs.map((route: any, i: number) => {
          const index = i + 3;
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          let iconName: any;
          if (route.name === 'Download') iconName = isFocused ? 'bookmark' : 'bookmark-outline';
          else if (route.name === 'Profile') iconName = isFocused ? 'person' : 'person-outline';
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Ionicons name={iconName} size={24} color={isFocused ? '#3B82F6' : '#888888'} />
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Absolutely positioned morphing FAB and options */}
      <View pointerEvents="box-none" style={styles.fabAbsoluteContainer}>
        <Animated.View
          style={[
            styles.morphFab,
            {
              width: fabWidth,
              borderRadius: fabBorderRadius,
              transform: [{ translateY: fabTranslateY }],
              shadowRadius: fabShadow,
              left: fabLeft,
            },
          ]}
        >
          {/* Options row, only visible when expanded */}
          <Animated.View style={[styles.optionsRow, { opacity: optionsOpacity }]}> 
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setExpanded(false);
                Animated.timing(animation, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: false,
                }).start();
                navigation.navigate('Upload', { mode: 'text' });
              }}
            >
              <Ionicons name="document-text-outline" size={24} color="#fff" />
              <Text style={styles.optionLabel}>Request PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={toggleExpand}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setExpanded(false);
                Animated.timing(animation, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: false,
                }).start();
                navigation.navigate('Upload', { mode: 'pdf' });
              }}
            >
              <Ionicons name="document-attach-outline" size={24} color="#fff" />
              <Text style={styles.optionLabel}>Upload PDF</Text>
            </TouchableOpacity>
          </Animated.View>
          {/* Main FAB (shows only when not expanded) */}
          <TouchableOpacity
            style={[styles.fabButton, { position: 'absolute', left: 0, right: 0, marginLeft: 'auto', marginRight: 'auto', opacity: expanded ? 0 : 1 }]}
            onPress={toggleExpand}
            activeOpacity={0.8}
          >
            <Ionicons name={expanded ? 'close' : 'add'} size={32} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Search" component={SearchStack} />
      <Tab.Screen name="Upload" component={UploadOptionScreen} />
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
    backgroundColor: '#232b3b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#181f2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 70,
    borderTopWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderColor: '#232b3b',
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  fabButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 41,
  },
  fabAbsoluteContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 30,
    pointerEvents: 'box-none',
  },
  morphFab: {
    position: 'absolute',
    bottom: 20,
    left: width / 2 - 130,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: 'row',
    overflow: 'visible',
  },
  optionsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
});