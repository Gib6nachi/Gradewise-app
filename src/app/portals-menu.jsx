import { BlurTargetView, BlurView } from "expo-blur";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { account, config, databases } from "../../lib/appwrite";

const BURGUNDY = "#4D241F";

export default function PortalsMenu() {
  const blurTarget = useRef(null);
  const [courses, setCourses] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCourses = useCallback(async () => {
    try {
      const currentAccount = await account.get();
      setErrorMessage("");
      const profileResponse = await databases.listDocuments(
        config.databaseId,
        config.usersCollectionId,
        [Query.equal("email", currentAccount.email), Query.limit(1)],
      );
      const profile = profileResponse.documents[0] || {
        email: currentAccount.email,
        role: "student",
        enrolledPortals: [],
      };
      setRole(profile.role);

      let courseQueries;
      if (profile.role === "teacher") {
        courseQueries = [
          Query.equal("teacherEmail", currentAccount.email),
          Query.limit(100),
        ];
      } else {
        const enrolledPortals = profile.enrolledPortals || [];
        if (enrolledPortals.length === 0) {
          setCourses([]);
          return;
        }
        courseQueries = [
          Query.equal("portalCode", enrolledPortals),
          Query.limit(100),
        ];
      }

      const response = await databases.listDocuments(
        config.databaseId,
        config.classesCollectionId,
        courseQueries,
      );
      setCourses(response.documents);
    } catch (error) {
      console.log("Error loading course tracking list:", error);
      setErrorMessage(
        error?.message || "Could not load your courses. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadCourses);
  }, [loadCourses]);

  const handleRetry = () => {
    setLoading(true);
    setErrorMessage("");
    loadCourses();
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <View style={styles.header}>
        <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
          <View style={styles.headerBackdrop} />
        </BlurTargetView>
        <BlurView
          blurTarget={blurTarget}
          blurMethod="dimezisBlurView"
          intensity={24}
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
        <Text style={styles.headerTitle}>COURSE TRACKING</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>YOUR ACTIVE COURSES</Text>

        {loading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator color={BURGUNDY} />
            <Text style={styles.stateText}>Loading your courses...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleRetry}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>TRY AGAIN</Text>
            </Pressable>
          </View>
        ) : courses.length > 0 ? (
          courses.map((course) => (
            <Pressable
              key={course.$id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${course.className || "course"} dashboard`}
              onPress={() =>
                router.push({
                  pathname: "/subject-dashboard",
                  params: {
                    portalCode: course.portalCode || "",
                    className: course.className || "",
                    courseCode: course.courseCode || "",
                  },
                })
              }
              style={styles.courseCard}
            >
              <Text style={styles.courseName}>
                {[course.className, course.courseCode]
                  .filter(Boolean)
                  .join(" - ")}
              </Text>
              {course.academicTerm ? (
                <Text style={styles.courseTerm}>{course.academicTerm}</Text>
              ) : null}
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No active courses yet</Text>
            <Text style={styles.emptyDescription}>
              Your active courses will appear here.
            </Text>
          </View>
        )}

        {role === "teacher" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a course"
            onPress={() => router.push("/create-course")}
            style={styles.addCourseCard}
          >
            <View style={styles.plusBlock}>
              <Text style={styles.plusText}>+</Text>
            </View>
            <Text style={styles.addCourseText}>ADD A COURSE</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
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
    paddingTop: 30,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: BURGUNDY,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 18,
  },
  courseCard: {
    minHeight: 98,
    justifyContent: "center",
    backgroundColor: BURGUNDY,
    borderRadius: 18,
    marginBottom: 14,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  courseName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  courseTerm: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    marginTop: 8,
  },
  emptyCard: {
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderRadius: 18,
    backgroundColor: "#F4F1F0",
    marginBottom: 14,
  },
  emptyTitle: {
    color: BURGUNDY,
    fontSize: 16,
    fontWeight: "700",
  },
  emptyDescription: {
    color: "#706967",
    fontSize: 14,
    marginTop: 6,
  },
  stateContainer: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  stateText: {
    color: "#706967",
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: "#A32626",
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: BURGUNDY,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  addCourseCard: {
    minHeight: 110,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D1CCCA",
    borderStyle: "dashed",
    backgroundColor: "#F6F5F5",
    marginTop: 8,
    paddingHorizontal: 18,
    opacity: 0.82,
  },
  plusBlock: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#E4E0DF",
  },
  plusText: {
    color: "#827B79",
    fontSize: 36,
    fontWeight: "300",
    lineHeight: 40,
  },
  addCourseText: {
    color: "#746D6B",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 16,
  },
});
