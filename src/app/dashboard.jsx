import { BlurTargetView, BlurView } from "expo-blur";
import { useRouter } from "expo-router";
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
import { account, config, databases, ID } from "../../lib/appwrite";

const { width, height } = Dimensions.get("window");
const bottomTabBarHeight = Platform.OS === "ios" ? 105 : 95;

export default function Dashboard() {
  const router = useRouter();

  // Layout presentation controls
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [shouldRenderNotifications, setShouldRenderNotifications] =
    useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [expandedApprovalId, setExpandedApprovalId] = useState(null);
  const [updatingApprovalId, setUpdatingApprovalId] = useState(null);

  // Animation references for the sidebar slide and both glass backdrops
  const [slideAnim] = useState(() => new Animated.Value(width));
  const [sidebarBackdropOpacity] = useState(() => new Animated.Value(0));
  const [notificationOpacity] = useState(() => new Animated.Value(0));
  const dashboardBlurTarget = useRef(null);

  // Appwrite platform authentication records
  const [userProfile, setUserProfile] = useState(null);

  const fetchPendingApprovals = useCallback(
    async (teacherProfile) => {
      if (teacherProfile?.role !== "teacher") return;

      try {
        const response = await databases.listDocuments(
          config.databaseId,
          config.approvalsCollectionId,
          [
            Query.equal("teacherEmail", teacherProfile.email),
            Query.equal("status", "pending"),
          ],
        );
        setPendingApprovals(response.documents);
      } catch (error) {
        console.log("Error fetching pending portal approvals:", error);
        Alert.alert(
          "Notifications Error",
          "Could not load pending portal requests.",
        );
      }
    },
    [],
  );

  // Synchronize layout sessions on container mount lines
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentAccount = await account.get();
        const response = await databases.listDocuments(
          config.databaseId,
          config.usersCollectionId,
          [Query.equal("email", currentAccount.email)],
        );

        const profile =
          response.documents.length > 0
            ? response.documents[0]
            : { name: currentAccount.name, role: "student" };
        setUserProfile(profile);

        if (profile.role === "teacher") {
          await fetchPendingApprovals(profile);
        }
      } catch (error) {
        console.log("❌ Error fetching user dashboard profile:", error);
        Alert.alert("Session Error", "Could not load user profile details.");
        router.replace("/");
      }
    };

    fetchUserData();
  }, [fetchPendingApprovals, router]);

  const handleApprovalDecision = async (approval, status) => {
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
        if (!enrolledPortals.includes(approval.portalCode)) {
          await databases.updateDocument(
            config.databaseId,
            config.usersCollectionId,
            student.$id,
            { enrolledPortals: [...enrolledPortals, approval.portalCode] },
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
      console.log(`Error ${status} portal approval:`, error);
      Alert.alert(
        "Request Update Failed",
        error.message || "Could not update this portal request.",
      );
    } finally {
      setUpdatingApprovalId(null);
    }
  };

  const handleTeacherPortalManagement = async () => {
    try {
      const response = await databases.listDocuments(
        config.databaseId,
        config.classesCollectionId,
        [Query.equal("teacherEmail", userProfile.email)],
      );

      if (response.documents.length > 0) {
        const code = response.documents[0].portalCode;
        Alert.alert(
          "Your Portal Code",
          `Students can use this code to join your portal:\n\n${code}`,
        );
      } else {
        const generatedCode =
          "GW-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        await databases.createDocument(
          config.databaseId,
          config.classesCollectionId,
          ID.unique(),
          {
            className: `${userProfile.name}'s Class`,
            portalCode: generatedCode,
            teacherEmail: userProfile.email,
            teacherName: userProfile.name,
          },
        );
        Alert.alert(
          "Portal Code Created!",
          `Your new portal code is:\n\n${generatedCode}`,
        );
      }
    } catch (error) {
      console.log("Error managing portal code:", error);
      Alert.alert("Error", "Could not retrieve or create portal code.");
    }
  };

  // Fire sliding fluid transitions smoothly every single turn
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
  };

  // Securely clear sessions and bounce user back to sign in
  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      setShouldRenderSidebar(false);
      router.replace("/");
    } catch (error) {
      console.log("❌ LOGOUT ERROR:", error);
      Alert.alert(
        "Logout Failed",
        "An unexpected error occurred while clearing your session.",
      );
    }
  };

  // Central Hub Button interaction behavior selector
  const handleCenterButtonPress = () => {
    if (!userProfile) return;

    if (userProfile.role === "teacher") {
      Alert.alert(
        "Teacher Portal",
        `Hello ${userProfile.name}! Next, we'll code your sliding management sheet here to handle portal approvals.`,
      );
    } else {
      Alert.alert(
        "Student Status",
        "Students only have access to view coursework updates and grades.",
      );
    }
  };
  return (
    <SafeAreaView style={styles.safeContainer}>
      <BlurTargetView
        ref={dashboardBlurTarget}
        style={styles.dashboardBlurTarget}
      >
        {/* BACKGROUND AREA: The custom diagonal visual slice background layer */}
        <View style={styles.backgroundCanvasContainer}>
          <View style={styles.diagonalSliceShape} />
        </View>

        {/* MAIN SCREEN INTERFACE CONTENT */}
        <View style={styles.mainLayoutContent}>
          {/* Top Header Controls: Top Right Hamburger Button Trigger */}
          <View style={styles.topControlRow}>
            <TouchableOpacity
              style={styles.hamburgerTouchArea}
              onPress={openSidebarAnimated}
            >
              <View style={styles.hamburgerLine} />
              <View style={[styles.hamburgerLine, { marginVertical: 5 }]} />
              <View style={styles.hamburgerLine} />
            </TouchableOpacity>
          </View>

          {/* Central Graphic Brand Section Container */}
          <View style={styles.centerBrandDisplayBlock}>
            <Image
              source={require("../../assets/images/Gradewise logos/logomain.png")}
              style={styles.centerMainLogoAsset}
              resizeMode="contain"
            />
            {/* Bold Brand Title Matching Figma Specification Typography */}
            <Text style={styles.brandTitleBoldText}>GRADTRACK</Text>

            {userProfile && (
              <Text style={styles.userGreetingText}>
                Welcome, {userProfile.name} ({userProfile.role})
              </Text>
            )}
          </View>
        </View>
      </BlurTargetView>

      {/* Bottom navigation stays clear and outside the dashboard blur target. */}
      <View style={styles.bottomTabBarRowContainer}>
        <TouchableOpacity
          style={styles.tabButtonElement}
          onPress={handleHomePress}
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
            if (userProfile?.role === "teacher") {
              fetchPendingApprovals(userProfile);
            }
          }}
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
                  No pending portal requests.
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
                              Portal: {approval.portalCode}
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

      {/* Right-Aligned Sliding Sidebar Panel with Click-Outside-To-Close Backdrop */}
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

          {/* Sidebar Drawer Body Panel with fluid sliding animation wrapper */}
          <Animated.View
            style={[
              styles.sidebarDrawerContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            {/* Top Header inside the sidebar - Extends completely to the upper limit to eliminate background bleeding */}
            <View style={styles.sidebarHeaderBlock}>
              <Image
                source={require("../../assets/images/Gradewise logos/logomain.png")}
                style={styles.sidebarBrandLogoAsset}
                resizeMode="contain"
              />
            </View>

            {/* Sidebar Navigation Shortcut Item Links */}
            <View style={styles.sidebarLinksListWrapper}>
              <TouchableOpacity
                style={styles.menuItemRowButton}
                onPress={() => {
                  closeSidebarAnimated();
                  router.push("/portals-menu");
                }}
              >
                <Text style={styles.menuItemLabelText}>Course Tracking</Text>
                <Text style={styles.menuChevronArrowText}>❯</Text>
              </TouchableOpacity>
            </View>

            {/* Secure Logout trigger lifted beautifully above the Android virtual navigation line */}
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
    marginBottom: height * 0.22, // Raised up slightly to allow optimal room for text stacks
  },
  centerMainLogoAsset: {
    width: width * 0.55,
    height: width * 0.55,
    transform: [{ translateX: 9 }],
  },
  brandTitleBoldText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000", // Sharp black text color matching your figma blueprint line
    letterSpacing: 2,
    marginTop: 10,
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", // Mirrors premium Libre Bodoni typography
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

  // FIXED BOTTOM NAVIGATION BAR ROW - INCREASED REAL ESTATE
  bottomTabBarRowContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: bottomTabBarHeight, // Expanded height to provide premium layout breathing space
    backgroundColor: "#4A1516",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 30,
    elevation: 30,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    borderTopLeftRadius: 12, // Subtle rounded upper lips matching figma layout cards
    borderTopRightRadius: 12,
  },
  tabButtonElement: {
    width: 70,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  footerIconTabAsset: {
    width: 36, // Scaled up cleanly from 32px for dominant legibility lines
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
    width: 92, // Scaled up beautifully to balance the expanded navbar height
    height: 92,
    borderRadius: 46,
    backgroundColor: "#DDDDDD", // Crisp matte pebble gray framework backing container
    justifyContent: "center",
    alignItems: "center",
    top: -32, // Floats higher above the thick action row panel divider line
    borderWidth: 3,
    borderColor: "#4A1516", // Bold maroon intersection outline removing layered flat circle looks
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
    backgroundColor: "#DDDDDD", // Consistent pebble baseline color mapping texture lines
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.08)", // Fine internal grain tracking shadow offset
  },
  footerCenterShieldIconAsset: {
    width: 52, // Enriched asset proportions to completely dominate central focus points
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
