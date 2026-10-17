import { BlurTargetView, BlurView } from "expo-blur";
import {
  Stack,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { account, config, databases } from "../../lib/appwrite";

const { width, height } = Dimensions.get("window");
const bottomTabBarHeight = Platform.OS === "ios" ? 105 : 95;

function getRouteValue(value) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default function SubjectDashboard() {
  const { portalCode, className, courseCode } = useLocalSearchParams();
  const router = useRouter();
  const activePortalCode = getRouteValue(portalCode).trim();
  const activeClassName = getRouteValue(className);
  const activeCourseCode = getRouteValue(courseCode);

  const [shouldRenderSidebar, setShouldRenderSidebar] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [shouldRenderNotifications, setShouldRenderNotifications] =
    useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [expandedApprovalId, setExpandedApprovalId] = useState(null);
  const [updatingApprovalId, setUpdatingApprovalId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [slideAnim] = useState(() => new Animated.Value(width));
  const [sidebarBackdropOpacity] = useState(() => new Animated.Value(0));
  const [notificationOpacity] = useState(() => new Animated.Value(0));
  const dashboardBlurTarget = useRef(null);

  const fetchPendingApprovals = useCallback(async () => {
    if (userProfile?.role !== "teacher" || !activePortalCode) {
      setPendingApprovals([]);
      return;
    }

    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.approvalsCollectionId,
        [
          Query.equal("teacherEmail", userProfile.email),
          Query.equal("portalCode", activePortalCode),
          Query.equal("status", "pending"),
        ],
      );
      setPendingApprovals(response.documents);
    } catch (error) {
      console.log("Error fetching subject portal approvals:", error);
      Alert.alert(
        "Notifications Error",
        "Could not load pending requests for this subject.",
      );
    }
  }, [activePortalCode, userProfile]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!activePortalCode) {
          throw new Error("This subject is missing its portal entry token.");
        }

        const currentAccount = await account.get();
        const response = await databases.listDocuments(
          config.databaseId,
          config.usersCollectionId,
          [Query.equal("email", currentAccount.email)],
        );

        const profile =
          response.documents.length > 0
            ? response.documents[0]
            : {
                name: currentAccount.name,
                email: currentAccount.email,
                role: "student",
              };
        setUserProfile(profile);
      } catch (error) {
        console.log("Error fetching subject dashboard profile:", error);
        Alert.alert(
          "Subject Dashboard Error",
          error?.message || "Could not load your account details.",
          [{ text: "Back to courses", onPress: () => router.replace("/portals-menu") }],
        );
      }
    };

    void Promise.resolve().then(fetchUserData);
  }, [activePortalCode, router]);

  useEffect(() => {
    if (userProfile?.role === "teacher") {
      void Promise.resolve().then(fetchPendingApprovals);
    }
  }, [fetchPendingApprovals, userProfile?.role]);

  const handleApprovalDecision = async (approval, status) => {
    if (
      userProfile?.role !== "teacher" ||
      approval.portalCode !== activePortalCode ||
      approval.teacherEmail !== userProfile.email
    ) {
      Alert.alert(
        "Request Unavailable",
        "This request does not belong to the current subject portal.",
      );
      return;
    }

    setUpdatingApprovalId(approval.$id);
    try {
      if (status === "approved") {
        const userResponse = await databases.listDocuments(
          config.databaseId,
          config.usersCollectionId,
          [Query.equal("email", approval.studentEmail)],
        );

        if (userResponse.documents.length === 0) {
          throw new Error("Could not find the student's profile.");
        }

        const student = userResponse.documents[0];
        const enrolledPortals = student.enrolledPortals || [];
        if (!enrolledPortals.includes(activePortalCode)) {
          await databases.updateDocument(
            config.databaseId,
            config.usersCollectionId,
            student.$id,
            { enrolledPortals: [...enrolledPortals, activePortalCode] },
          );
        }
      }

      await databases.updateDocument(
        config.databaseId,
        config.approvalsCollectionId,
        approval.$id,
        { status },
      );

      setPendingApprovals((currentApprovals) =>
        currentApprovals.filter((item) => item.$id !== approval.$id),
      );
      setExpandedApprovalId(null);
    } catch (error) {
      console.log(`Error ${status} subject portal request:`, error);
      Alert.alert(
        "Request Update Failed",
        error?.message || "Could not update this subject request.",
      );
    } finally {
      setUpdatingApprovalId(null);
    }
  };

  const openSidebarAnimated = () => {
    slideAnim.stopAnimation();
    sidebarBackdropOpacity.stopAnimation();
    slideAnim.setValue(width);
    sidebarBackdropOpacity.setValue(0);
    setShouldRenderSidebar(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarBackdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSidebarAnimated = () => {
    if (!shouldRenderSidebar) return;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarBackdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setShouldRenderSidebar(false);
    });
  };

  const openNotifications = () => {
    notificationOpacity.stopAnimation();
    notificationOpacity.setValue(0);
    setShouldRenderNotifications(true);
    setNotificationsOpen(true);
    Animated.timing(notificationOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    if (userProfile?.role === "teacher") {
      void fetchPendingApprovals();
    }
  };

  const closeNotifications = () => {
    if (!shouldRenderNotifications) return;

    setNotificationsOpen(false);
    Animated.timing(notificationOpacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setShouldRenderNotifications(false);
    });
  };

  const handleHomePress = () => {
    closeNotifications();
    closeSidebarAnimated();
    router.replace("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      setShouldRenderSidebar(false);
      router.replace("/");
    } catch (error) {
      console.log("Subject dashboard logout error:", error);
      Alert.alert(
        "Logout Failed",
        "An unexpected error occurred while clearing your session.",
      );
    }
  };

  const handleCenterButtonPress = () => {
    if (!activePortalCode) return;
    Alert.alert("Portal Entry Token", activePortalCode);
  };

  const handleSidebarTokenPress = () => {
    closeSidebarAnimated();
    handleCenterButtonPress();
  };

  const handleSidebarNotificationsPress = () => {
    closeSidebarAnimated();
    openNotifications();
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <BlurTargetView
        ref={dashboardBlurTarget}
        style={styles.dashboardBlurTarget}
      >
        <View style={styles.backgroundCanvasContainer}>
          <View style={styles.diagonalSliceShape} />
        </View>

        <View style={styles.mainLayoutContent}>
          <View style={styles.topControlRow}>
            <TouchableOpacity
              style={styles.hamburgerTouchArea}
              onPress={openSidebarAnimated}
              accessibilityRole="button"
              accessibilityLabel="Open subject navigation"
            >
              <View style={styles.hamburgerLine} />
              <View style={[styles.hamburgerLine, { marginVertical: 5 }]} />
              <View style={styles.hamburgerLine} />
            </TouchableOpacity>
          </View>

          <View style={styles.centerBrandDisplayBlock}>
            <Image
              source={require("../../assets/images/Gradewise logos/logomain.png")}
              style={styles.centerMainLogoAsset}
              resizeMode="contain"
            />
            <Text style={styles.brandTitleBoldText} numberOfLines={2}>
              {activeCourseCode
                ? `${activeCourseCode} Portal Hub`
                : "Portal Hub"}
            </Text>
            <Text style={styles.userGreetingText} numberOfLines={2}>
              Section: {activeClassName || "Unavailable"}
            </Text>
            <View style={styles.portalTokenCard}>
              <Text style={styles.portalTokenText}>
                Portal Entry Token: {activePortalCode || "Unavailable"}
              </Text>
            </View>
          </View>
        </View>
      </BlurTargetView>

      <View style={styles.bottomTabBarRowContainer}>
        <TouchableOpacity
          style={styles.tabButtonElement}
          onPress={handleHomePress}
          accessibilityRole="button"
          accessibilityLabel="Return to dashboard"
        >
          <Image
            source={require("../../assets/images/Gradewise logos/home.png")}
            style={styles.footerIconTabAsset}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerCircularLogoFloatingPodWrapper}
          onPress={handleCenterButtonPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Show portal entry token"
        >
          <View style={styles.innerShieldGraphicMascotCirclePodContainer}>
            <Image
              source={require("../../assets/images/Gradewise logos/G middle logo.png")}
              style={styles.footerCenterShieldIconAsset}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButtonElement}
          onPress={() => {
            if (notificationsOpen) {
              closeNotifications();
              return;
            }
            openNotifications();
          }}
          accessibilityRole="button"
          accessibilityLabel="Open subject notifications"
        >
          <Image
            source={require("../../assets/images/Gradewise logos/Gbell.icon.png")}
            style={styles.footerIconTabAsset}
            resizeMode="contain"
          />
          {userProfile?.role === "teacher" && pendingApprovals.length > 0 && (
            <View style={styles.notificationBadgeDot} />
          )}
        </TouchableOpacity>
      </View>

      {shouldRenderNotifications && (
        <Animated.View
          pointerEvents={notificationsOpen ? "auto" : "none"}
          style={[
            styles.notificationOverlayContainer,
            { opacity: notificationOpacity },
          ]}
        >
          <TouchableWithoutFeedback onPress={closeNotifications}>
            <View style={styles.notificationDismissBackdrop}>
              <BlurView
                blurTarget={dashboardBlurTarget}
                intensity={65}
                tint="light"
                blurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.notificationTint} />
            </View>
          </TouchableWithoutFeedback>

          <View style={styles.notificationPanel}>
            <Text style={styles.notificationHeadingTitle}>Notifications</Text>
            {userProfile?.role === "teacher" ? (
              pendingApprovals.length === 0 ? (
                <Text style={styles.noNotificationsSubtitleText}>
                  No pending portal requests for this subject.
                </Text>
              ) : (
                <ScrollView
                  style={styles.approvalList}
                  contentContainerStyle={styles.approvalListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {pendingApprovals.map((approval) => {
                    const isExpanded = expandedApprovalId === approval.$id;
                    const isUpdating = updatingApprovalId === approval.$id;
                    return (
                      <View key={approval.$id} style={styles.approvalCard}>
                        <View style={styles.approvalSummary}>
                          <View style={styles.approvalStudentInfo}>
                            <Text style={styles.approvalStudentName}>
                              {approval.studentName || "Student"}
                            </Text>
                            <Text style={styles.approvalPortalCode}>
                              Portal: {activePortalCode}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.expandApprovalButton}
                            onPress={() =>
                              setExpandedApprovalId(
                                isExpanded ? null : approval.$id,
                              )
                            }
                            accessibilityRole="button"
                            accessibilityLabel={
                              isExpanded
                                ? "Hide request details"
                                : "Show request details"
                            }
                          >
                            <Text style={styles.expandApprovalButtonText}>
                              {isExpanded ? "Less" : "More"}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {isExpanded && (
                          <View style={styles.approvalDetails}>
                            <Text style={styles.approvalDetailText}>
                              Student email: {approval.studentEmail}
                            </Text>
                            <Text style={styles.approvalDetailText}>
                              Request status: {approval.status}
                            </Text>
                          </View>
                        )}

                        <View style={styles.approvalActions}>
                          <TouchableOpacity
                            style={[
                              styles.approvalActionButton,
                              styles.rejectApprovalButton,
                            ]}
                            onPress={() =>
                              handleApprovalDecision(approval, "rejected")
                            }
                            disabled={updatingApprovalId !== null}
                            accessibilityRole="button"
                            accessibilityLabel="Reject portal request"
                          >
                            <Text style={styles.approvalActionText}>X</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.approvalActionButton,
                              styles.approveApprovalButton,
                            ]}
                            onPress={() =>
                              handleApprovalDecision(approval, "approved")
                            }
                            disabled={updatingApprovalId !== null}
                            accessibilityRole="button"
                            accessibilityLabel="Approve portal request"
                          >
                            <Text style={styles.approvalActionText}>✓</Text>
                          </TouchableOpacity>
                        </View>
                        {isUpdating && (
                          <Text style={styles.approvalUpdatingText}>
                            Updating request...
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              )
            ) : (
              <Text style={styles.noNotificationsSubtitleText}>
                No new updates right now.
              </Text>
            )}
          </View>
        </Animated.View>
      )}

      {shouldRenderSidebar && (
        <View style={styles.sidebarWrapperOverlay}>
          <TouchableWithoutFeedback onPress={closeSidebarAnimated}>
            <Animated.View
              style={[
                styles.sidebarDimDismissBackdrop,
                { opacity: sidebarBackdropOpacity },
              ]}
            >
              <BlurView
                blurTarget={dashboardBlurTarget}
                intensity={55}
                tint="light"
                blurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.sidebarTint} />
            </Animated.View>
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.sidebarDrawerContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <View style={styles.sidebarHeaderBlock}>
              <Image
                source={require("../../assets/images/Gradewise logos/logomain.png")}
                style={styles.sidebarBrandLogoAsset}
                resizeMode="contain"
              />
            </View>

            <View style={styles.sidebarLinksListWrapper}>
              <TouchableOpacity
                style={styles.menuItemRowButton}
                onPress={handleSidebarTokenPress}
              >
                <Text style={styles.menuItemLabelText}>Portal Entry Token</Text>
                <Text style={styles.menuChevronArrowText}>❯</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItemRowButton}
                onPress={handleSidebarNotificationsPress}
              >
                <Text style={styles.menuItemLabelText}>Student Requests</Text>
                <Text style={styles.menuChevronArrowText}>❯</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.sidebarFooterButton}
              onPress={handleLogout}
            >
              <Text style={styles.sidebarFooterButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {shouldRenderSidebar && (
        <TouchableOpacity
          style={styles.sidebarHomeButton}
          onPress={handleHomePress}
          accessibilityRole="button"
          accessibilityLabel="Home; close sidebar"
        >
          <Image
            source={require("../../assets/images/Gradewise logos/home.png")}
            style={styles.footerIconTabAsset}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FFFBF9",
  },
  dashboardBlurTarget: {
    flex: 1,
  },
  backgroundCanvasContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 1,
    backgroundColor: "#EFEBE9",
  },
  diagonalSliceShape: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: width,
    borderBottomWidth: height * 1.06,
    borderLeftColor: "transparent",
    borderBottomColor: "#FFFBF9",
  },
  mainLayoutContent: {
    flex: 1,
    zIndex: 2,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  topControlRow: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? 15 : 0,
  },
  hamburgerTouchArea: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  hamburgerLine: {
    width: 26,
    height: 3,
    backgroundColor: "#000000",
    borderRadius: 2,
  },
  centerBrandDisplayBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.22,
  },
  centerMainLogoAsset: {
    width: width * 0.55,
    height: width * 0.55,
    transform: [{ translateX: 9 }],
  },
  brandTitleBoldText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 2,
    marginTop: 10,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textAlign: "center",
  },
  userGreetingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "500",
    color: "#4A1516",
    opacity: 0.75,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    textTransform: "capitalize",
    textAlign: "center",
  },
  portalTokenCard: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(74, 21, 22, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 18,
    maxWidth: "100%",
  },
  portalTokenText: {
    color: "#4A1516",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  // FIXED BOTTOM NAVIGATION BAR ROW - INCREASED REAL ESTATE
  bottomTabBarRowContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: bottomTabBarHeight,
    backgroundColor: "#4A1516",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 30,
    elevation: 30,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tabButtonElement: {
    width: 70,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  footerIconTabAsset: {
    width: 36,
    height: 36,
  },
  notificationBadgeDot: {
    position: "absolute",
    top: 22,
    right: 18,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E53935",
    borderWidth: 1.5,
    borderColor: "#FFFBF9",
  },

  // THE INTERACTIVE STONE PEBBLE PLATFORM POD CAPSULE
  centerCircularLogoFloatingPodWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
    top: -32,
    borderWidth: 3,
    borderColor: "#4A1516",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 8,
  },
  innerShieldGraphicMascotCirclePodContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  footerCenterShieldIconAsset: {
    width: 52,
    height: 52,
  },

  notificationOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: bottomTabBarHeight,
    zIndex: 20,
    elevation: 20,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  notificationDismissBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  notificationTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 251, 249, 0.14)",
  },
  notificationPanel: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#FFFBF9",
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationHeadingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4A1516",
    marginBottom: 14,
    textAlign: "center",
  },
  noNotificationsSubtitleText: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    paddingVertical: 12,
  },
  approvalList: {
    width: "100%",
  },
  approvalListContent: {
    paddingBottom: 2,
  },
  approvalCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0D7D5",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  approvalSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  approvalStudentInfo: {
    flex: 1,
    marginRight: 10,
  },
  approvalStudentName: {
    color: "#4A1516",
    fontSize: 16,
    fontWeight: "bold",
  },
  approvalPortalCode: {
    color: "#757575",
    fontSize: 13,
    marginTop: 4,
  },
  expandApprovalButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  expandApprovalButtonText: {
    color: "#6D2829",
    fontSize: 13,
    fontWeight: "600",
  },
  approvalDetails: {
    borderTopWidth: 1,
    borderTopColor: "#F0E9E7",
    marginTop: 10,
    paddingTop: 10,
  },
  approvalDetailText: {
    color: "#5F5552",
    fontSize: 12,
    marginBottom: 4,
  },
  approvalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  approvalActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  rejectApprovalButton: {
    backgroundColor: "#B3261E",
  },
  approveApprovalButton: {
    backgroundColor: "#2E7D32",
  },
  approvalActionText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
  },
  approvalUpdatingText: {
    color: "#757575",
    fontSize: 11,
    marginTop: 6,
    textAlign: "right",
  },
  sidebarWrapperOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    elevation: 40,
    flexDirection: "row",
  },
  sidebarHomeButton: {
    position: "absolute",
    bottom: 0,
    left: (width - 232) / 6,
    width: 70,
    height: bottomTabBarHeight,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    zIndex: 50,
    elevation: 50,
  },
  sidebarDimDismissBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: bottomTabBarHeight,
  },
  sidebarTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 251, 249, 0.2)",
  },
  sidebarDrawerContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: width * 0.72,
    bottom: 0,
    backgroundColor: "#4A1516",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeaderBlock: {
    width: "100%",
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(255, 251, 249, 0.15)",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 40 : 25,
  },
  sidebarBrandLogoAsset: {
    width: "100%",
    height: "100%",
  },
  sidebarLinksListWrapper: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  menuItemRowButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 251, 249, 0.1)",
  },
  menuItemLabelText: {
    color: "#FFFBF9",
    fontSize: 16,
    fontWeight: "500",
  },
  menuChevronArrowText: {
    color: "rgba(255, 251, 249, 0.6)",
    fontSize: 14,
  },
  sidebarFooterButton: {
    width: "100%",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: "rgba(255, 251, 249, 0.15)",
    justifyContent: "center",
    marginBottom: Platform.OS === "android" ? 35 : 45,
  },
  sidebarFooterButtonText: {
    color: "#FFFBF9",
    fontSize: 16,
    fontWeight: "bold",
  },
});
