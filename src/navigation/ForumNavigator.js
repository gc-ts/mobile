import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ForumScreen from '../screens/forum/ForumScreen';
import TopicScreen from '../screens/forum/TopicScreen';
import ArticleScreen from '../screens/forum/ArticleScreen';

const Stack = createStackNavigator();

export default function ForumNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ForumHome" component={ForumScreen} />
      <Stack.Screen name="Topic" component={TopicScreen} />
      <Stack.Screen name="Article" component={ArticleScreen} />
    </Stack.Navigator>
  );
}
