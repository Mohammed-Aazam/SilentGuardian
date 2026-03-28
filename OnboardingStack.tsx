// src/navigation/OnboardingStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import BaselineScreen from '../screens/BaselineScreen';
import { Colors, Typography } from '../lib/theme';

const Stack = createNativeStackNavigator();

export default function OnboardingStack({ route }: any) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.brand },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontFamily: 'Georgia',
          fontSize: Typography.sizes.md,
        },
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Baseline"
        component={BaselineScreen}
        options={{ title: 'Build Baseline' }}
      />
    </Stack.Navigator>
  );
}
