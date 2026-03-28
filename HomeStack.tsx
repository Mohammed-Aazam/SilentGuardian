// src/navigation/HomeStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import CheckInScreen from '../screens/CheckInScreen';
import ResultScreen from '../screens/ResultScreen';
import { Colors, Typography } from '../lib/theme';

export type HomeStackParamList = {
  Home: undefined;
  CheckIn: undefined;
  Result: { entryId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.brand },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: 'Georgia',
          fontSize: Typography.sizes.md,
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'SilentGuardian' }}
      />
      <Stack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ title: "Today's Check-in" }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: 'Analysis' }}
      />
    </Stack.Navigator>
  );
}
