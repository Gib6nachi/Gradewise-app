import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { account, databases } from "../../lib/appwrite";

const { width, height } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();

  // Layout presentation controls
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shouldRenderSidebar, setShouldRenderSidebar] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Animation value reference driving the sliding translation behavior
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Appwrite platform authentication records
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  // Synchronize layout sessions on container mount lines
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentAccount = await account.get();
        const response = await databases.listDocuments(
          "gradtrack_db",
          "users_collection",
          [Query.equal("email", currentAccount.email)],
        );

        if (response.documents.length > 0) {
          setUserProfile(response.documents[0]); // Targets the exact active record object directly
        } else {
          setUserProfile({ name: currentAccount.name, role: "student" });
        }
      } catch (error) {
        console.log("❌ Error fetching user dashboard profile:", error);
        Alert.alert("Session Error", "Could not load user profile details.");
        router.replace("/");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserData();
  }, []);

  // Fire sliding fluid transitions smoothly every single turn
  const openSidebarAnimated = () => {
    setShouldRenderSidebar(true);
    setSidebarOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0, // Slides cleanly onto the screen layer
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebarAnimated = () => {
    setSidebarOpen(false);
    Animated.timing(slideAnim, {
      toValue: width, // Slides back out of the viewport bounds
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShouldRenderSidebar(false); // Cleanly unmounts only AFTER animation completes tracking
    });
  };

  // Securely clear sessions and bounce user back to sign in
  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
      setSidebarOpen(false);
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

      {/* OVERLAY 1: Stable Cross-Platform Frosted Blur Shield */}
      {notificationsOpen && (
        <TouchableWithoutFeedback onPress={() => setNotificationsOpen(false)}>
          <BlurView
            intensity={75} // Sets how deep and frosted the look feels
            tint="light" // Matches your clean white premium Figma spec
            blurMethod="dimezisBlurView" // THE FIX: Uses the modern stable prop to bypass fallback transparent modes on Android!
            style={styles.notificationOverlayContainer}
          >
            <Text style={styles.notificationHeadingTitle}>Notifications</Text>
            <Text style={styles.noNotificationsSubtitleText}>
              No new updates right now.
            </Text>
          </BlurView>
        </TouchableWithoutFeedback>
      )}

      {/* OVERLAY 2: Right-Aligned Sliding Sidebar Panel with Click-Outside-To-Close Backdrop */}
      {shouldRenderSidebar && (
        <View style={styles.sidebarWrapperOverlay}>
          {/* Captures clicks on the transparent dismiss barrier beside the right panel drawer */}
          <TouchableWithoutFeedback onPress={closeSidebarAnimated}>
            <View style={styles.sidebarDimDismissBackdrop} />
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
              {["Course & Semester", "GPA", "Course Shifting", "Status"].map(
                (menuItem) => (
                  <TouchableOpacity
                    key={menuItem}
                    style={styles.menuItemRowButton}
                  >
                    <Text style={styles.menuItemLabelText}>{menuItem}</Text>
                    <Text style={styles.menuChevronArrowText}>❯</Text>
                  </TouchableOpacity>
                ),
              )}
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

      {/* 3. SOLID EXPANDED FIXED BOTTOM NAVIGATION BAR ROW PANEL CONTAINER */}
      <View style={styles.bottomTabBarRowContainer}>
        {/* Left Item: Home Action Shortcut Button Trigger */}
        <TouchableOpacity
          style={styles.tabButtonElement}
          onPress={() => {
            setNotificationsOpen(false);
            closeSidebarAnimated();
          }}
        >
          <Image
            source={require("../../assets/images/Gradewise logos/home.png")}
            style={styles.footerIconTabAsset}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Center Item: Elevated Tactile Stone Pebble Shield G Mascot Module Container */}
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

        {/* Right Item: Notification Toggle Bell Layout Action Link Trigger */}
        <TouchableOpacity
          style={styles.tabButtonElement}
          onPress={() => setNotificationsOpen(!notificationsOpen)}
        >
          <Image
            source={require("../../assets/images/Gradewise logos/Gbell.icon.png")}
            style={styles.footerIconTabAsset}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FFFBF9",
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
    height: Platform.OS === "ios" ? 105 : 95, // Expanded height to provide premium layout breathing space
    backgroundColor: "#4A1516",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 10,
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
    width: width,
    height: height,
    zIndex: 5,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    overflow: "hidden", // Crucial for clean canvas bounding rules on Android devices
  },

  blurCoverFilterBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: "rgba(255, 251, 249, 0.88)",
  },
  notificationHeadingTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4A1516",
    marginBottom: 8,
    zIndex: 6,
  },
  noNotificationsSubtitleText: {
    fontSize: 14,
    color: "#757575",
    zIndex: 6,
  },
  sidebarWrapperOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 15,
    flexDirection: "row",
  },
  sidebarDimDismissBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  sidebarDrawerContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: width * 0.72,
    height: height,
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
