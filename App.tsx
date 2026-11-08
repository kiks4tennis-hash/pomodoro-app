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
          tabBarLabelStyle: { fontSize: 15, fontWeight: "600", marginTop: 1 },
          tabBarIconStyle: { marginTop: 0 },
          tabBarStyle: {
            position: "absolute",
            left: 18,
            right: 18,
            bottom: 18,
            height: 84,
            paddingTop: 7,
            paddingBottom: 9,
            borderRadius: 42,
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            elevation: 8,
            shadowColor: colors.text,
            shadowOpacity: 0.1,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 5 },
          },
        }}
      >
        <Tab.Screen name={language === "ja" ? "タイマー" : "Timer"} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 30, fontWeight: "500" }}>◷</Text> }}>
          {(props) => <TimerScreen {...props} onLanguageChange={onLanguageChange} />}
        </Tab.Screen>
        <Tab.Screen name={language === "ja" ? "記録" : "History"} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 28, fontWeight: "500" }}>▤</Text> }}>
          {(props) => <HistoryScreen {...props} language={language} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
