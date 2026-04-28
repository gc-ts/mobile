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

function TabIcon({ focused, label, emoji, colors }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.5 }]}>{emoji}</Text>
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
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Чат" emoji="💬" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="ForumTab"
        component={ForumNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Форум" emoji="📋" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Профиль" emoji="👤" colors={colors} />
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
    gap: 2,
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
