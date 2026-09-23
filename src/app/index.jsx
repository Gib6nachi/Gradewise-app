import { useRouter } from "expo-router";
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

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true); // True means hidden by default
  const router = useRouter();

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

        {/* 2. White Inner Sign-In Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>sign in to your account</Text>

          {/* Email Input Field */}
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            autoCapitalize="none"
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

          {/* Action Row: Show Password & Forgot Password */}
          <View style={styles.actionRow}>
            {/* Show/Hide Toggle */}
            <TouchableOpacity
              style={styles.showPasswordContainer}
              onPress={() => setSecureText(!secureText)}
            >
              <Text style={styles.showPasswordText}>
                {secureText ? "Show password" : "Hide password"}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotContainer}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Custom Maroon/Crimson Sign In Button */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Bottom Sign Up Navigation Link */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.signUpLinkText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFEBE9", // Soft beige background color
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  keyboardContainer: {
    flex: 1,
    backgroundColor: "#EFEBE9", // Maintains your clean beige backdrop color
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center", // Keeps the card elevated and perfectly centered like Figma
    padding: 20,
  },

  logoContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center", // Clean alignment fix you added
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
    fontFamily: "System",
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
  button: {
    backgroundColor: "#6D2829", // The crimson/maroon color
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

  // === PASTED NEW ACTION ROW STYLES START HERE ===
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Pushes Show Password left, Forgot Password right
    alignItems: "center",
    marginTop: 8,
    width: "100%",
  },
  showPasswordContainer: {
    paddingVertical: 2,
  },
  showPasswordText: {
    color: "#757575", // Balanced grey style color
    fontSize: 13,
    fontWeight: "500",
  },
  forgotContainer: {
    paddingVertical: 2,
  },
  forgotText: {
    color: "#6D2829", // Corporate crimson brand color
    fontSize: 13,
    fontWeight: "500",
  },
  // === PASTED NEW ACTION ROW STYLES END HERE ===

  footerContainer: {
    flexDirection: "row",
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    color: "#757575",
    fontSize: 14,
  },
  signUpLinkText: {
    color: "#6D2829",
    fontSize: 14,
    fontWeight: "bold",
  },
});
