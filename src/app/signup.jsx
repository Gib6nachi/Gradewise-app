import { useLocalSearchParams, useRouter } from "expo-router"; // Imports the router to jump back to Sign In
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignUp() {
  const router = useRouter();
  const { role } = useLocalSearchParams();

  // State variables for form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureText, setSecureText] = useState(true);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Top Logo Area */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/Gradewise logos/logomini.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* 2. White Inner Registration Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Sign up</Text>
          <Text style={styles.subtitle}>
            {role === "teacher"
              ? "create a new teacher account"
              : "create a new student account"}
          </Text>

          {/* Full Name Input Field */}
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            autoCapitalize="words"
          />

          {/* Email Input Field */}
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password Input Field */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureText}
            autoCapitalize="none"
          />

          {/* Confirm Password Input Field */}
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureText}
            autoCapitalize="none"
          />

          {/* Action Row: Show/Hide Toggle */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.showPasswordContainer}
              onPress={() => setSecureText(!secureText)}
            >
              <Text style={styles.showPasswordText}>
                {secureText ? "Show passwords" : "Hide passwords"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Crimson Register Button */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Bottom Navigation Link to return to Sign In */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.signInLinkText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#EFEBE9",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
    borderColor: "#D7CCC8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
  },
  subtitle: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: "#757575",
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 8,
    width: "100%",
  },
  showPasswordContainer: {
    paddingVertical: 2,
  },
  showPasswordText: {
    color: "#757575",
    fontSize: 13,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#6D2829",
    width: "100%",
    height: 48,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  footerContainer: {
    flexDirection: "row",
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    color: "#757575",
    fontSize: 14,
  },
  signInLinkText: {
    color: "#6D2829",
    fontSize: 14,
    fontWeight: "bold",
  },
});
