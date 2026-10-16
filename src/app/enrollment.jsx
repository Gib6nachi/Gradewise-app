import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
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
import { Query } from "react-native-appwrite";
import { account, config, databases, ID } from "../../lib/appwrite";

export default function Enrollment() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrolledPortals, setEnrolledPortals] = useState([]);
  const [studentEmail, setStudentEmail] = useState("");

  // Fetch student email and active enrolled portals on mount
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const currentAccount = await account.get();
        setStudentEmail(currentAccount.email);

        const studentRecord = await databases.listDocuments(
          config.databaseId,
          config.usersCollectionId,
          [Query.equal("email", currentAccount.email)],
        );

        if (studentRecord.documents.length > 0) {
          const portals = studentRecord.documents[0].enrolledPortals || [];
          setEnrolledPortals(portals);
        }
      } catch (error) {
        console.log("Error fetching enrollment info:", error);
      }
    };

    fetchStudentData();
  }, []);

  const handleContinue = async () => {
    if (!code.trim()) {
      Alert.alert("Error", "Please enter a valid portal code.");
      return;
    }
    if (!agreed) {
      Alert.alert(
        "Terms Required",
        "Please agree to the Terms of Service to proceed.",
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Verify if the code exists in the classes collection
      const classResponse = await databases.listDocuments(
        config.databaseId,
        config.classesCollectionId,
        [Query.equal("portalCode", code.trim().toUpperCase())],
      );

      if (classResponse.documents.length === 0) {
        Alert.alert(
          "Invalid Code",
          "No class found matching this portal code.",
        );
        setLoading(false);
        return;
      }

      const matchedClass = classResponse.documents[0];

      // 2. Find the student profile and check for an existing request
      const userResponse = await databases.listDocuments(
        config.databaseId,
        config.usersCollectionId,
        [Query.equal("email", studentEmail)],
      );

      if (userResponse.documents.length === 0) {
        Alert.alert("Error", "Could not find your student profile.");
        return;
      }

      const userDoc = userResponse.documents[0];
      const currentPortals = userDoc.enrolledPortals || [];

      if (currentPortals.includes(matchedClass.portalCode)) {
        Alert.alert(
          "Already Enrolled",
          "You already have access to this portal.",
        );
        router.push("/dashboard");
        return;
      }

      const existingRequest = await databases.listDocuments(
        config.databaseId,
        config.approvalsCollectionId,
        [
          Query.equal("studentEmail", studentEmail),
          Query.equal("portalCode", matchedClass.portalCode),
        ],
      );

      if (existingRequest.documents.length > 0) {
        Alert.alert(
          "Request already exists",
          "A request for this portal has already been submitted.",
        );
        return;
      }

      await databases.createDocument(
        config.databaseId,
        config.approvalsCollectionId,
        ID.unique(),
        {
          studentName: userDoc.name,
          studentEmail,
          portalCode: matchedClass.portalCode,
          teacherEmail: matchedClass.teacherEmail,
          status: "pending",
        },
      );

      setCode("");
      Alert.alert(
        "Request submitted!",
        "Waiting for teacher approval.",
      );
    } catch (error) {
      console.log("Enrollment error:", error);
      Alert.alert("Error", "Failed to process enrollment code.");
    } finally {
      setLoading(false);
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
        <Text style={styles.headerText}>WELCOME TO GRADTRACK</Text>

        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/Gradewise logos/logomain.png")}
            style={styles.mainLogo}
            resizeMode="contain"
          />
        </View>

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

          <TouchableOpacity
            style={styles.button}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "VERIFYING..." : "CONTINUE"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Portals You Have Access To Section */}
        <View style={styles.portalsListContainer}>
          <Text style={styles.portalsListHeading}>
            PORTALS YOU HAVE ACCESS TO:
          </Text>
          {enrolledPortals.length === 0 ? (
            <Text style={styles.noPortalsText}>No portals joined yet.</Text>
          ) : (
            enrolledPortals.map((portalCode, index) => (
              <View key={index} style={styles.portalBadge}>
                <Text style={styles.portalBadgeText}>
                  🟢 Portal Code: {portalCode}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#FFFBF9",
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
    color: "#4A1516",
    letterSpacing: 1.5,
    marginBottom: 20,
    textAlign: "center",
  },
  imageContainer: {
    marginBottom: 25,
    alignItems: "center",
  },
  mainLogo: {
    width: 150,
    height: 150,
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
    marginBottom: 20,
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
    color: "#3F51B5",
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
    marginTop: 4,
    paddingTop: 12,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4A1516",
    letterSpacing: 1,
  },
  portalsListContainer: {
    width: "100%",
    marginTop: 24,
    paddingHorizontal: 4,
  },
  portalsListHeading: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4A1516",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  noPortalsText: {
    fontSize: 12,
    color: "#757575",
    fontStyle: "italic",
  },
  portalBadge: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7CCC8",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  portalBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A1516",
  },
});
