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

export default function Enrollment() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    // Basic verification placeholder check
    if (code.trim().length > 0) {
      router.push("/dashboard");
    } else {
      alert(
        "Please enter a valid enrollment code provided by your instructor.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header Display Text */}
        <Text style={styles.headerText}>WELCOME TO GRADTRACK</Text>

        {/* 2. Main Illustration Banner Graphic */}
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/Gradewise logos/logomain.png")}
            style={styles.mainLogo}
            resizeMode="contain"
          />
        </View>

        {/* 3. Central Verification Box Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>ENTER YOUR ENROLLMENT CODE:</Text>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="ENROLLMENT CODE"
            placeholderTextColor="#9E9E9E"
            autoCapitalize="characters"
          />

          {/* Terms Agreement Checkbox Element */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]} />
            <Text style={styles.checkboxLabel}>
              I'VE READ AND AGREED TO THE{" "}
              <Text style={styles.linkText}>TERMS OF SERVICE</Text>
            </Text>
          </TouchableOpacity>

          {/* Action Trigger Button */}
          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#FFFBF9", // Bright canvas backdrop from your center design mockup
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4A1516", // Deep crimson letter tone
    letterSpacing: 1.5,
    marginBottom: 30,
    textAlign: "center",
  },
  imageContainer: {
    marginBottom: 35,
    alignItems: "center",
  },
  mainLogo: {
    width: 200,
    height: 200,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFF8F6",
    borderRadius: 6,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E0D7D5",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4A1516",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  input: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: "#BCAAA4",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#000000",
    textAlign: "center",
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#757575",
    borderRadius: 3,
    marginRight: 10,
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    backgroundColor: "#6D2829",
    borderColor: "#6D2829",
  },
  checkboxLabel: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "500",
  },
  linkText: {
    color: "#3F51B5", // Classical hyperlink blue from blueprint specs
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  button: {
    width: "100%",
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderColor: "#E0D7D5",
    marginTop: 8,
    paddingTop: 12,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#757575",
    letterSpacing: 1,
  },
});
