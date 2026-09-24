import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Dimensions,
    Image,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();

  // Dynamic layout state systems
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
            onPress={() => setSidebarOpen(true)}
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
        </View>
      </View>

      {/* OVERLAY 1: Blur Simulation Layer for Active Notification State Screen View */}
      {notificationsOpen && (
        <View style={styles.notificationOverlayContainer}>
          <View style={styles.blurCoverFilterBackdrop} />
          <Text style={styles.notificationHeadingTitle}>Notifications</Text>
          <Text style={styles.noNotificationsSubtitleText}>
            No new updates right now.
          </Text>
        </View>
      )}

      {/* OVERLAY 2: Sliding Sidebar Navigation Drawer Layout Panel */}
      {sidebarOpen && (
        <View style={styles.sidebarDrawerContainer}>
          {/* Top Header inside the sidebar */}
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

          {/* Close / Return Home trigger at the absolute bottom of the panel drawer */}
          <TouchableOpacity
            style={styles.sidebarFooterButton}
            onPress={() => setSidebarOpen(false)}
          >
            <Text style={styles.sidebarFooterButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. SOLID FIXED BOTTOM NAVIGATION BAR ROW PANEL CONTAINER */}
      <View style={styles.bottomTabBarRowContainer}>
        {/* Left Item: Home Action Shortcut Button Trigger */}
        <TouchableOpacity
          style={styles.tabButtonElement}
          onPress={() => {
            setNotificationsOpen(false);
            setSidebarOpen(false);
          }}
        >
          <Image
            source={require("../../assets/images/Gradewise logos/home.png")}
            style={styles.footerIconTabAsset}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Center Item: Elevated Floating Shield G Symbol Mascot Circle Wrap */}
        <View style={styles.centerCircularLogoFloatingPodWrapper}>
          <View style={styles.innerShieldGraphicMascotCirclePodContainer}>
            <Image
              source={require("../../assets/images/Gradewise logos/G middle logo.png")}
              style={styles.footerCenterShieldIconAsset}
              resizeMode="contain"
            />
          </View>
        </View>

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

// === PASTE PART 2 IMMEDIATELY DOWN BENEATH THIS LINE ===

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#FFFBF9", // The crisp base tone from your design board canvas
  },

  // BACKGROUND SYSTEM: Renders the custom diagonal slice layout effect
  backgroundCanvasContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    zIndex: 1,
    backgroundColor: "#EFEBE9", // The light grey-beige tone from your blueprint slice
  },
  diagonalSliceShape: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    // These vector parameters use screen dimensions to create a clean, uniform diagonal cut
    borderLeftWidth: width,
    borderBottomWidth: height * 0.85,
    borderLeftColor: "transparent",
    borderBottomColor: "#FFFBF9", // Intersects the base background tone cleanly
  },

  // CONTENT OVERLAYS
  mainLayoutContent: {
    flex: 1,
    zIndex: 2, // Positions elements directly above your custom background canvas layer
    paddingHorizontal: 24,
  },
  topControlRow: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    justifyContent: "flex-end", // Aligns your custom hamburger button directly to the top right corner
    alignItems: "center",
    marginTop: Platform.OS === "android" ? 10 : 0,
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
    backgroundColor: "#000000", // Dark line thickness matching your layout mockup lines
    borderRadius: 2,
  },
  centerBrandDisplayBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.15, // Centers logo beautifully above the floating tab bar
  },
  centerMainLogoAsset: {
    width: width * 0.55,
    height: width * 0.55,
  },

  // SOLID FIXED BOTTOM NAVIGATION BAR TAB ROW SYSTEM
  bottomTabBarRowContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: width,
    height: 75,
    backgroundColor: "#4A1516", // Your beautiful dark maroon/crimson background code color
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 10, // Locks navbar securely over all background views and notification windows
    paddingBottom: Platform.OS === "ios" ? 15 : 0,
  },
  tabButtonElement: {
    width: 60,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  footerIconTabAsset: {
    width: 26,
    height: 26,
  },
  centerCircularLogoFloatingPodWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FFFBF9", // Matching cutout outer ring background wrapper
    justifyContent: "center",
    alignItems: "center",
    top: -24, // Floats the center shield asset beautifully elevated above the bar line like your design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  innerShieldGraphicMascotCirclePodContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#4A1516", // Inner maroon profile backing container frame
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFBF9",
  },
  footerCenterShieldIconAsset: {
    width: 44,
    height: 44,
  },

  // === PASTE PART 3 IMMEDIATELY DOWN BENEATH THIS LINE ===

  // OVERLAY SYSTEM 1: Full-Screen Notification Blurring View
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
  },
  blurCoverFilterBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: "rgba(255, 251, 249, 0.88)", // Matches light mockup overlay
    // On web, this creates a crisp native blur filter effect. On devices,
    // it functions as a premium frosted panel overlay over your dashboard elements
    backdropFilter: "blur(20px)",
  },
  notificationHeadingTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4A1516", // Deep crimson heading font color
    marginBottom: 8,
    zIndex: 6,
  },
  noNotificationsSubtitleText: {
    fontSize: 14,
    color: "#757575",
    zIndex: 6,
  },

  // OVERLAY SYSTEM 2: Sliding Sidebar Drawer Layout Panel Panel
  sidebarDrawerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width * 0.72, // Takes up exactly 72% of the screen width matching your blueprint scale
    height: height,
    backgroundColor: "#4A1516", // Beautiful solid maroon/crimson background fill color
    zIndex: 15, // Rides safely over top controls and nav bars
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  sidebarHeaderBlock: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(255, 251, 249, 0.15)", // Subtle separator border line line
    backgroundColor: "#FFFFFF", // Matches top background cutout block in sidebar image blueprint
    paddingVertical: 12,
  },
  sidebarBrandLogoAsset: {
    width: "80%",
    height: "80%",
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
    borderColor: "rgba(255, 251, 249, 0.1)", // Clean internal link dividers
  },
  menuItemLabelText: {
    color: "#FFFBF9", // Pristine white text links matching your image mockup
    fontSize: 16,
    fontWeight: "500",
  },
  menuChevronArrowText: {
    color: "rgba(255, 251, 249, 0.6)",
    fontSize: 14,
  },
  sidebarFooterButton: {
    width: "100%",
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: "rgba(255, 251, 249, 0.15)",
    justifyContent: "center",
  },
  sidebarFooterButtonText: {
    color: "#FFFBF9",
    fontSize: 16,
    fontWeight: "bold",
  },
});
