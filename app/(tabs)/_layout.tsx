import React from "react";
import { Tabs } from "expo-router";
import { TabBar } from "../../src/components/navigation/TabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="objectives" />
      <Tabs.Screen name="system" />
    </Tabs>
  );
}
