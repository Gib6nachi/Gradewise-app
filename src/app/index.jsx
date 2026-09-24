import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const router = useRouter();
  const [roleModalVisible, setRoleModalVisible] = useState(false);

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
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/enrollment")} // Routes directly to Enrollment Code view
          >
            <Text style={styles.buttonText}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Bottom Sign Up Navigation Link */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => setRoleModalVisible(true)}>
            <Text style={styles.signUpLinkText}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Universal Role Selection Pop-up Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={roleModalVisible}
          onRequestClose={() => setRoleModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Create Account</Text>
              <Text style={styles.modalSubtitle}>
                Please choose your profile path to proceed
              </Text>

              {/* Path 1: Student Routing */}
              <TouchableOpacity
                style={styles.modalOptionButton}
                onPress={() => {
                  setRoleModalVisible(false);
                  router.push({
                    pathname: "/signup",
                    params: { role: "student" },
                  });
                }}
              >
                <Text style={styles.modalOptionButtonText}>
                  Join as Student
                </Text>
              </TouchableOpacity>

              {/* Path 2: Teacher Routing */}
              <TouchableOpacity
                style={[styles.modalOptionButton, styles.teacherButtonBorder]}
                onPress={() => {
                  setRoleModalVisible(false);
                  router.push({
                    pathname: "/signup",
                    params: { role: "teacher" },
                  });
                }}
              >
                <Text style={styles.teacherButtonText}>
                  Register as Teacher
                </Text>
              </TouchableOpacity>

              {/* Cancel out of selection layout */}
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setRoleModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFEBE9",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
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
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  forgotContainer: {
    paddingVertical: 2,
  },
  forgotText: {
    color: "#6D2829",
    fontSize: 13,
    fontWeight: "500",
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
  signUpLinkText: {
    color: "#6D2829",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#757575",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOptionButton: {
    backgroundColor: "#6D2829",
    width: "100%",
    height: 46,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
  },
  modalOptionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  teacherButtonBorder: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#6D2829",
  },
  teacherButtonText: {
    color: "#6D2829",
    fontSize: 15,
    fontWeight: "bold",
  },
  modalCancelButton: {
    marginTop: 14,
    paddingVertical: 4,
  },
  modalCancelText: {
    color: "#757575",
    fontSize: 14,
    fontWeight: "500",
  },
});
