import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/config/theme';
import AuthNavigator from './src/navigation/AuthNavigator';
import StudentNavigator from './src/navigation/StudentNavigator';
import TeacherNavigator from './src/navigation/TeacherNavigator';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userRole, setUserRole] = React.useState(null);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
              <Stack.Screen name="Auth" component={AuthNavigator} />
            ) : userRole === 'student' ? (
              <Stack.Screen name="Student" component={StudentNavigator} />
            ) : (
              <Stack.Screen name="Teacher" component={TeacherNavigator} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}

