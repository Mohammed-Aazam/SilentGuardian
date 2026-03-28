// App.tsx — Root entry point
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import TabNavigator from './src/navigation/TabNavigator';
import OnboardingStack from './src/navigation/OnboardingStack';
import { hasCompletedOnboarding } from './src/lib/storage';
import { Colors } from './src/lib/theme';

const RootStack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      const onboarded = await hasCompletedOnboarding();
      setIsOnboarded(onboarded);
      setIsReady(true);
    })();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.brand} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.brand} />
        <NavigationContainer>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {!isOnboarded ? (
              <RootStack.Screen
                name="Onboarding"
                component={OnboardingStack}
                initialParams={{ onComplete: () => setIsOnboarded(true) }}
              />
            ) : (
              <RootStack.Screen name="Main" component={TabNavigator} />
            )}
          </RootStack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
