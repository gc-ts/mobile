import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import ChatNavigator from './ChatNavigator';
import ForumNavigator from './ForumNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();
const Root = createStackNavigator();

function TabIcon({ focused, label, marker, colors }) {
  return (
    <View style={styles.tabIconContainer}>
      <View
        style={[
          styles.tabMarker,
          {
            backgroundColor: focused ? colors.ink : colors.paper,
            borderColor: focused ? colors.ink : colors.line,
          },
        ]}
      >
        <Text style={[styles.tabMarkerText, { color: focused ? colors.bg : colors.ink2 }]}>{marker}</Text>
      </View>
      <Text style={[styles.tabLabel, { color: focused ? colors.tabActive : colors.tabInactive }]}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 92 : 78,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 12,
          paddingHorizontal: 12,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="CHAT" marker="AI" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="ForumTab"
        component={ForumNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="FORUM" marker="KB" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="SETTINGS" marker="ST" colors={colors} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { employee } = useAuth();

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {!employee ? (
        <Root.Screen name="Auth" component={AuthScreen} />
      ) : (
        <Root.Screen name="Main" component={MainTabs} />
      )}
    </Root.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabMarker: {
    minWidth: 40,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabMarkerText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_600SemiBold',
    letterSpacing: 0.6,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono_500Medium',
    letterSpacing: 1,
  },
});
