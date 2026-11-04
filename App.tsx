import React, { useCallback, useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import * as Localization from "expo-localization";
import TimerScreen from "./src/screens/TimerScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import { colors } from "./src/theme";
import { loadSettings } from "./src/lib/storage";
import { AppLanguage, LanguagePreference } from "./src/types";
import { resolveLanguage } from "./src/i18n";

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
  const [language, setLanguage] = useState<AppLanguage>(() => resolveLanguage("system", Localization.getLocales()[0]?.languageCode));
  useEffect(() => {
    loadSettings().then((settings) => setLanguage(resolveLanguage(settings.language, Localization.getLocales()[0]?.languageCode)));
  }, []);

  const onLanguageChange = useCallback((preference: LanguagePreference) => {
    setLanguage(resolveLanguage(preference, Localization.getLocales()[0]?.languageCode));
  }, []);

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.surface },
          tabBarActiveTintColor: colors.focus,
          tabBarInactiveTintColor: colors.textMuted,
        }}
      >
        <Tab.Screen name={language === "ja" ? "タイマー" : "Timer"}>
          {(props) => <TimerScreen {...props} onLanguageChange={onLanguageChange} />}
        </Tab.Screen>
        <Tab.Screen name={language === "ja" ? "記録" : "History"}>
          {(props) => <HistoryScreen {...props} language={language} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
