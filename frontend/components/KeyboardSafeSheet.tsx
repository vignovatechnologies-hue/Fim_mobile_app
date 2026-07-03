import React from "react";
import {
  Modal as ModalComponent,
  Platform,
  View as ViewComponent,
  StyleSheet,
  TouchableOpacity as TouchableOpacityComponent,
  KeyboardAvoidingView as KeyboardAvoidingViewComponent
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Bypass React Native JSX typing issue under React 19 / RN 0.81
const Modal = ModalComponent as any;
const View = ViewComponent as any;
const TouchableOpacity = TouchableOpacityComponent as any;
const KeyboardAvoidingView = KeyboardAvoidingViewComponent as any;

export interface KeyboardSafeSheetProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  contentStyle?: any;
}

export default function KeyboardSafeSheet({
  visible,
  onRequestClose,
  children,
  contentStyle
}: KeyboardSafeSheetProps) {
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === "ios" ? 34 : 16);
  const dynamicPaddingBottom = bottomInset + 12;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Full-screen root with dim background */}
        <View style={styles.root} pointerEvents="box-none">

          {/* Backdrop layer — only this handles the close tap, sits behind the sheet */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={onRequestClose}
          />

          {/* Sheet */}
          <View
            style={[
              styles.sheet,
              {
                paddingBottom: dynamicPaddingBottom,
                maxHeight: "90%",
              },
              contentStyle,
            ]}
          >
            {/* Grab handle */}
            <View style={styles.handleBar} />

            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 8,
    width: "100%",
    flexShrink: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 20,
    marginTop: 8,
  },
} as any);
