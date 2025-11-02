import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AuthScreen from '../screens/AuthScreen';
import BottomNavigation from './BottomTabNavigation';
import EmployeeDetailsScreen from '../screens/EmployeeDetailsScreen';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AttendanceReport from '../screens/AttendanceReport';
const Stack = createNativeStackNavigator();

export default function StackNavigation() {
  const [initialRoute, setInitialRoute] = useState('');

  useEffect(() => {
    const fetchToken = async () => {
      const token = await AsyncStorage.getItem('authToken');
      setInitialRoute(token ? 'bottomTab' : 'auth');
    };
    fetchToken();
  }, []);

  if (!initialRoute) {
    return null;
  }
  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen
        name="auth"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="bottomTab"
        component={BottomNavigation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="employeeDetails"
        component={EmployeeDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AttendanceReport"
        component={AttendanceReport}
        options={{headerShown:false}}
        />
     
      
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({})