import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View } from 'react-native';
import { COLORS } from '../colors/color';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TeamScreen from '../screens/TeamScreen';

const Tab = createBottomTabNavigator();

export default function BottomNavigation() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: true,
        tabBarIcon: ({ focused }) => {
          let iconSource;

          if (route.name === 'Home') {
            iconSource = require('../assets/bottomTab/home.png');
        } else if (route.name === 'Profile') {
            iconSource = require('../assets/bottomTab/profile.png');
          }else if(route.name==='Team'){
            iconSource = require('../assets/bottomTab/meet.png');
          }
           else {
            return <View style={{ width: 0, height: 0 }} />;
          }

          return (
            <Image
              source={iconSource}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? COLORS.accent : COLORS.subText,
              }}
              resizeMode="contain"
            />
          );
        },
        tabBarActiveTintColor: COLORS.accent, 
        tabBarInactiveTintColor: COLORS.subText,
        tabBarStyle: {
          backgroundColor: COLORS.card, 
          borderTopColor: COLORS.offline,
          borderTopWidth: 1,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Team"
        component={TeamScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
