// screens/AuthScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import { COLORS, DARK_COLORS } from "../colors/color";
import { useColorScheme } from "react-native";
import { useAuth } from "../contexts/AuthContext";   // <-- adjust import path

const AuthScreen = ({ navigation }: any) => {
  const { login, register, loading, error } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? DARK_COLORS : COLORS;

  const [isLogin, setIsLogin] = useState(true);
  const [photo, setPhoto] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      includeBase64: false,
    });

    if (result.assets?.[0]) {
      setPhoto(result.assets[0]);
    }
  };

  const handleAuth = async () => {
    const { name, email, password, phone, department } = form;

    // ---------- Validation ----------
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
        navigation.replace("bottomTab");
      } else {
        await register(name, email, password, phone, department, photo?.uri);
        navigation.replace("bottomTab");
      }
    } catch (err: any) {
      // error is already set in context, but we still show it
      Alert.alert("Error", err.message);
    }
  };

  // Show context error if any (e.g. network, 401, etc.)
  React.useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/logo/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* ---------- Register-only fields ---------- */}
      {!isLogin && (
        <>
          <TextInput
            placeholder="Name"
            placeholderTextColor={theme.subText}
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            value={form.name}
            onChangeText={(t) => handleChange("name", t)}
          />
          <TextInput
            placeholder="Phone"
            placeholderTextColor={theme.subText}
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            value={form.phone}
            onChangeText={(t) => handleChange("phone", t)}
            keyboardType="phone-pad"
          />
          <TextInput
            placeholder="Department"
            placeholderTextColor={theme.subText}
            style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
            value={form.department}
            onChangeText={(t) => handleChange("department", t)}
          />

          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Text style={{ color: theme.accent }}>
              {photo ? "Change Photo" : "Upload Profile Photo"}
            </Text>
          </TouchableOpacity>

          {photo && (
            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
          )}
        </>
      )}

      {/* ---------- Common fields ---------- */}
      <TextInput
        placeholder="Email"
        placeholderTextColor={theme.subText}
        style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
        value={form.email}
        onChangeText={(t) => handleChange("email", t)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={theme.subText}
        style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
        value={form.password}
        onChangeText={(t) => handleChange("password", t)}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.authBtn, { backgroundColor: theme.accent }]}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.authText}>{isLogin ? "Login" : "Sign Up"}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={[styles.switchText, { color: theme.subText }]}>
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AuthScreen;

/* ---------- Styles (unchanged) ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  logo: { width: 200, height: 200 },
  input: { borderRadius: 12, padding: 14, marginVertical: 8, fontSize: 16 },
  uploadBtn: { alignItems: "center", padding: 10 },
  previewImage: { width: 90, height: 90, borderRadius: 45, alignSelf: "center", marginVertical: 10 },
  authBtn: { padding: 15, borderRadius: 12, alignItems: "center", marginVertical: 10 },
  authText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  switchText: { textAlign: "center", marginTop: 10, fontSize: 15 },
});