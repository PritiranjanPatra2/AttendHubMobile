
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigation from "./navigations/StackNavigation";
import { AuthProvider } from "./contexts/AuthContext";
import { EmployeeProvider } from "./contexts/EmployeeContext";
import { AttendanceProvider } from "./contexts/AttendanceContext";
// import BootSplash from "react-native-bootsplash";
import RNBootSplash from 'react-native-bootsplash';


export default function App() {

  
  return (
    <AuthProvider>
      <EmployeeProvider>
        <AttendanceProvider>
      <NavigationContainer
       onReady={() => {RNBootSplash.hide({ fade: true }); }}
       >
        <StackNavigation />
      </NavigationContainer>
      </AttendanceProvider>
      </EmployeeProvider>
      </AuthProvider>
  );
}

