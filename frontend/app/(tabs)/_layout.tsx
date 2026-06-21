import { Tabs } from "expo-router";
import { Home as HomeIcon, Wallet as WalletIcon, TrendingUp as TrendingUpIcon, Sparkles as SparklesIcon, User as UserIcon } from "lucide-react-native";
import React from "react";

const Home = HomeIcon as any;
const Wallet = WalletIcon as any;
const TrendingUp = TrendingUpIcon as any;
const Sparkles = SparklesIcon as any;
const User = UserIcon as any;
import { View, Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#10b981",
        tabBarInactiveTintColor: "#7c8a87",
        tabBarStyle: {
          backgroundColor: "#0d1512",
          borderTopWidth: 1,
          borderTopColor: "#1a2c26",
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 68,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "bold",
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: "#0d1512",
          borderBottomWidth: 1,
          borderBottomColor: "#1a2c26",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: "#ffffff",
          fontSize: 18,
          fontWeight: "bold",
        },
        headerTintColor: "#ffffff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Smart EMI",
          tabBarIcon: ({ color, size, focused }: any) => (
            <View className={`p-2 rounded-xl ${focused ? "bg-[#10b981]/15" : ""}`}>
              <Home color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="emis"
        options={{
          title: "EMIs",
          headerTitle: "Manage EMIs",
          tabBarIcon: ({ color, size, focused }: any) => (
            <View className={`p-2 rounded-xl ${focused ? "bg-[#10b981]/15" : ""}`}>
              <Wallet color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Money",
          headerTitle: "Expenses Logger",
          tabBarIcon: ({ color, size, focused }: any) => (
            <View className={`p-2 rounded-xl ${focused ? "bg-[#10b981]/15" : ""}`}>
              <TrendingUp color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          headerTitle: "AI Financial Insights",
          tabBarIcon: ({ color, size, focused }: any) => (
            <View className={`p-2 rounded-xl ${focused ? "bg-[#10b981]/15" : ""}`}>
              <Sparkles color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "My Profile & Banks",
          tabBarIcon: ({ color, size, focused }: any) => (
            <View className={`p-2 rounded-xl ${focused ? "bg-[#10b981]/15" : ""}`}>
              <User color={color} size={20} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
