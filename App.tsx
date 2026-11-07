import React, { useCallback, useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import * as Localization from "expo-localization";
import TimerScreen from "./src/screens/TimerScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import { colors } from "./src/theme";
import { loadSettings } from "./src/lib/storage";
import { AppLanguage, LanguagePreference } from "./src/types";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.surface,
    primary: colors.focus,
  },
};

export default function App() {
  const [language, setLanguage] = useState<AppLanguage>(() => Localization.getLocales()[0]?.languageCode?.toLowerCase().startsWith("ja") ? "ja" : "en");
  useEffect(() => {
    loadSettings(Localization.getLocales()[0]?.languageCode).then((settings) => setLanguage(settings.language));
  }, []);

  const onLanguageChange = useCallback((preference: LanguagePreference) => {
    setLanguage(preference);
  }, []);

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.focus,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
          tabBarIconStyle: { marginTop: 3 },
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surface, height: 68, paddingTop: 5, paddingBottom: 6 },
        }}
      >
        <Tab.Screen name={language === "ja" ? "タイマー" : "Timer"} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>◷</Text> }}>
          {(props) => <TimerScreen {...props} onLanguageChange={onLanguageChange} />}
        </Tab.Screen>
        <Tab.Screen name={language === "ja" ? "記録" : "History"} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>▤</Text> }}>
          {(props) => <HistoryScreen {...props} language={language} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
