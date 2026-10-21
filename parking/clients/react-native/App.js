import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { isAdmin, isSensor } from '../shared/roles.js';
import AdminPanel from './src/components/AdminPanel.js';
import Hero from './src/components/Hero.js';
import LanguagePanel from './src/components/LanguagePanel.js';
import LanguagePicker from './src/components/LanguagePicker.js';
import LoginPanel from './src/components/LoginPanel.js';
import LotList from './src/components/LotList.js';
import SensorPanel from './src/components/SensorPanel.js';
import UsersPanel from './src/components/UsersPanel.js';
import { colors } from './src/theme.js';
import { useParking } from './src/useParking.js';

export default function App() {
  const parking = useParking();
  const { user } = parking;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        {/* Keeps the field being typed in above the on-screen keyboard. */}
        <KeyboardAvoidingView style={styles.screen} behavior="padding">
          <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
            <LanguagePicker parking={parking} />
            <Hero parking={parking} />
            <LotList parking={parking} />
            <LanguagePanel parking={parking} />
            <LoginPanel parking={parking} />
            {isAdmin(user) && <AdminPanel parking={parking} />}
            {isSensor(user) && <SensorPanel parking={parking} />}
            {isAdmin(user) && <UsersPanel parking={parking} />}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  page: {
    padding: 18,
    gap: 24,
  },
});
