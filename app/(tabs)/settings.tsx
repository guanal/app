import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Moon, Sun, Bell, Lock, Trash2, Info, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  const { theme, toggleTheme, colors } = useTheme();
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const styles = getStyles(colors);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Here you would call a function to delete the user's account
            Alert.alert('Account Deletion', 'This is a demo. In a real app, your account would be deleted.');
          }
        }
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This is a demo. In a real app, you would be able to change your password here.');
  };

  const handleAbout = () => {
    Alert.alert('About DocChat', 'DocChat v1.0.0\nDeveloped by StackBlitz\n\nAn AI-powered document chat application that lets you upload documents and ask questions about them.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            {theme === 'dark' ? 
              <Moon size={20} color={colors.textSecondary} /> : 
              <Sun size={20} color={colors.textSecondary} />
            }
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Bell size={20} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleChangePassword}>
          <View style={styles.settingLabelContainer}>
            <Lock size={20} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>Change Password</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleDeleteAccount}>
          <View style={styles.settingLabelContainer}>
            <Trash2 size={20} color={colors.error} />
            <Text style={[styles.settingLabel, { color: colors.error }]}>Delete Account</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity style={styles.settingButton} onPress={handleAbout}>
          <View style={styles.settingLabelContainer}>
            <Info size={20} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>About DocChat</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: colors.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: colors.text,
    marginLeft: 12,
  },
});