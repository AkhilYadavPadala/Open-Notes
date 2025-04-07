import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './navigation/BottomTabNavigatior';  // Correct path

export default function App() {
  return (
    <NavigationContainer>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}
export default BottomTabNavigator;