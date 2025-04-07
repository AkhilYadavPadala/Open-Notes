import React from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-native-paper';

const Layout = () => {
  return (
    <Provider>
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  );
};

export default Layout;
