import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import ChatNavigator from './ChatNavigator';
import ForumNavigator from './ForumNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AdminScreen from '../screens/admin/AdminScreen';
import AuthScreen from '../screens/AuthScreen';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();
const Root = createStackNavigator();

function TabItem({ focused, label, iconName, colors }) {
  return (
    <View style={styles.itemRoot}>
      <View
        style={[
          styles.indicator,
          { backgroundColor: focused ? colors.pistachio : 'transparent' },
        ]}
      />
      <View
        style={[
          styles.pill,
          focused
            ? {
                backgroundColor: colors.mossWash,
                borderColor: colors.moss,
              }
            : {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
              },
        ]}
      >
        <Feather
          name={iconName}
          size={18}
          color={focused ? colors.moss : colors.ink3}
        />
      </View>
      <Text
        style={[
          styles.label,
          {
            color: focused ? colors.moss : colors.ink3,
            fontFamily: focused ? 'JetBrainsMono_600SemiBold' : 'JetBrainsMono_500Medium',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  const { employee } = useAuth();
  const isAdmin = employee?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 74 : 58,
          paddingBottom: Platform.OS === 'ios' ? 20 : 4,
          paddingTop: 0,
          paddingHorizontal: 6,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 0,
        },
      }}
    >
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} label="ЧАТ" iconName="message-circle" colors={colors} />
          ),
        }}
      />
      <Tab.Screen
        name="ForumTab"
        component={ForumNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} label="ФОРУМ" iconName="book-open" colors={colors} />
          ),
        }}
      />
      {isAdmin ? (
        <Tab.Screen
          name="AdminTab"
          component={AdminScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabItem focused={focused} label="АДМИН" iconName="shield" colors={colors} />
            ),
          }}
        />
      ) : null}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem focused={focused} label="ПРОФИЛЬ" iconName="user" colors={colors} />
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
  itemRoot: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    paddingTop: 4,
  },
  indicator: {
    width: 24,
    height: 2,
    marginBottom: 2,
  },
  pill: {
    width: 40,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1.2,
  },
});
