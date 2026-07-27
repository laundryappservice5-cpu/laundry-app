import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store/store';
import { AuthBootstrap } from './src/features/auth/AuthBootstrap';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AuthBootstrap>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AuthBootstrap>
        </Provider>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
