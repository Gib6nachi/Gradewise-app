import { BlurTargetView, BlurView } from "expo-blur";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { account, config, databases, ID } from "../../lib/appwrite";

const BURGUNDY = "#4D241F";
const GRADING_OPTIONS = ["Numerical", "Percentage", "Letter"];

function createPortalCode() {
  return `GW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export default function CreateCourse() {
  const blurTarget = useRef(null);
  const [academicTerm, setAcademicTerm] = useState(
    "1st Sem First Year 2026",
  );
  const [className, setClassName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [gradingSystem, setGradingSystem] = useState("Numerical");
  const [saving, setSaving] = useState(false);

  const adjustCredits = (amount) => {
    const currentValue = Number(credits) || 0;
    setCredits(String(Math.max(0, currentValue + amount)));
  };

  const handleSave = async () => {
    const cleanTerm = academicTerm.trim();
    const cleanClassName = className.trim();
    const cleanCourseCode = courseCode.trim();
    const creditValue = Number(credits);

    if (!cleanTerm || !cleanClassName || !cleanCourseCode) {
      Alert.alert(
        "Missing course details",
        "Enter an academic term, class name, and course code before saving.",
      );
      return;
    }

    if (!Number.isFinite(creditValue) || creditValue <= 0) {
      Alert.alert("Invalid credits", "Credits must be a number greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const currentAccount = await account.get();
      const profileResponse = await databases.listDocuments(
        config.databaseId,
        config.usersCollectionId,
        [Query.equal("email", currentAccount.email), Query.limit(1)],
      );
      const profile = profileResponse.documents[0];

      if (profile?.role !== "teacher") {
        throw new Error("Only teacher accounts can create courses.");
      }

      let portalCode = "";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = createPortalCode();
        const existingCode = await databases.listDocuments(
          config.databaseId,
          config.classesCollectionId,
          [Query.equal("portalCode", candidate), Query.limit(1)],
        );

        if (existingCode.documents.length === 0) {
          portalCode = candidate;
          break;
        }
      }

      if (!portalCode) {
        throw new Error("Could not generate a unique course portal code.");
      }

      await databases.createDocument(
        config.databaseId,
        config.classesCollectionId,
        ID.unique(),
        {
          academicTerm: cleanTerm,
          className: cleanClassName,
          courseCode: cleanCourseCode,
          credits: String(creditValue),
          gradingSystem,
          portalCode,
          teacherEmail: currentAccount.email,
          teacherName: profile.name || currentAccount.name,
        },
      );

      router.back();
    } catch (error) {
      console.log("Error creating course:", error);
      Alert.alert(
        "Could not save course",
        error?.message || "Please check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <View style={styles.header}>
        <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
          <View style={styles.headerBackdrop} />
        </BlurTargetView>
        <BlurView
          blurTarget={blurTarget}
          blurMethod="dimezisBlurView"
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>CREATE COURSE</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.introText}>
          Add the details for a new course portal.
        </Text>

        <View style={styles.formFrame}>
          <Text style={styles.label}>ACADEMIC TERM</Text>
          <TextInput
            value={academicTerm}
            onChangeText={setAcademicTerm}
            placeholder="1st Sem First Year 2026"
            placeholderTextColor="#A49B98"
            style={styles.input}
            returnKeyType="next"
          />

          <Text style={styles.label}>CLASS NAME</Text>
          <TextInput
            value={className}
            onChangeText={setClassName}
            placeholder="e.g. BSCS1021"
            placeholderTextColor="#A49B98"
            style={styles.input}
            returnKeyType="next"
          />

          <Text style={styles.label}>COURSE CODE</Text>
          <TextInput
            value={courseCode}
            onChangeText={setCourseCode}
            placeholder="e.g. CS 101"
            placeholderTextColor="#A49B98"
            style={styles.input}
            autoCapitalize="characters"
            returnKeyType="done"
          />

          <Text style={styles.label}>CREDITS &amp; UNITS</Text>
          <View style={styles.numberPicker}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease credits"
              onPress={() => adjustCredits(-1)}
              style={styles.stepperButton}
            >
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <TextInput
              accessibilityLabel="Credits and units"
              value={credits}
              onChangeText={(value) =>
                setCredits(value.replace(/[^\d.]/g, ""))
              }
              keyboardType="decimal-pad"
              style={styles.numberInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase credits"
              onPress={() => adjustCredits(1)}
              style={styles.stepperButton}
            >
              <Text style={styles.stepperText}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>GRADING SCALE</Text>
          <View style={styles.gradingOptions}>
            {GRADING_OPTIONS.map((option) => {
              const selected = gradingSystem === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setGradingSystem(option)}
                  style={[
                    styles.gradingOption,
                    selected && styles.gradingOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.gradingOptionText,
                      selected && styles.gradingOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={handleSave}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "SAVING..." : "SAVE"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 126,
    backgroundColor: BURGUNDY,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 22,
    overflow: "hidden",
  },
  headerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BURGUNDY,
  },
  backButton: {
    position: "absolute",
    left: 20,
    bottom: 16,
    width: 44,
    height: 44,
    justifyContent: "center",
    zIndex: 1,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 38,
    lineHeight: 42,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  introText: {
    color: "#655B58",
    fontSize: 15,
    marginBottom: 20,
  },
  formFrame: {
    borderWidth: 1,
    borderColor: BURGUNDY,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    padding: 18,
  },
  label: {
    color: BURGUNDY,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: BURGUNDY,
    borderRadius: 7,
    color: "#261C1A",
    fontSize: 15,
    paddingHorizontal: 12,
  },
  numberPicker: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BURGUNDY,
    borderRadius: 7,
    overflow: "hidden",
  },
  stepperButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F1F0",
  },
  stepperText: {
    color: BURGUNDY,
    fontSize: 24,
  },
  numberInput: {
    flex: 1,
    color: "#261C1A",
    fontSize: 16,
    textAlign: "center",
    paddingVertical: 8,
  },
  gradingOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gradingOption: {
    minHeight: 42,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BURGUNDY,
    borderRadius: 7,
    paddingHorizontal: 14,
  },
  gradingOptionSelected: {
    backgroundColor: BURGUNDY,
  },
  gradingOptionText: {
    color: BURGUNDY,
    fontSize: 13,
    fontWeight: "600",
  },
  gradingOptionTextSelected: {
    color: "#FFFFFF",
  },
  saveButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BURGUNDY,
    borderRadius: 8,
    marginTop: 22,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
