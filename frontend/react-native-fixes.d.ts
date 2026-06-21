import * as React from 'react';

declare module 'react-native' {
  interface NativeMethodsFix {
    focus(): void;
    blur(): void;
    measure(callback: any): void;
    measureInWindow(callback: any): void;
    measureLayout(relativeTo: any, onSuccess: any, onFail: any): void;
    setNativeProps(nativeProps: object): void;
  }

  interface View extends React.Component<any>, NativeMethodsFix {}
  interface Text extends React.Component<any>, NativeMethodsFix {}
  interface TextInput extends React.Component<any>, NativeMethodsFix {}
  interface ScrollView extends React.Component<any>, NativeMethodsFix {}
  interface TouchableOpacity extends React.Component<any>, NativeMethodsFix {}
  interface SafeAreaView extends React.Component<any>, NativeMethodsFix {}
  interface KeyboardAvoidingView extends React.Component<any>, NativeMethodsFix {}
  interface Modal extends React.Component<any>, NativeMethodsFix {}
  interface ActivityIndicator extends React.Component<any>, NativeMethodsFix {}
  interface Image extends React.Component<any>, NativeMethodsFix {}
  interface Pressable extends React.Component<any>, NativeMethodsFix {}
  interface FlatList extends React.Component<any>, NativeMethodsFix {}
  interface SectionList extends React.Component<any>, NativeMethodsFix {}
  interface Switch extends React.Component<any>, NativeMethodsFix {}
  interface StatusBar extends React.Component<any>, NativeMethodsFix {}
}
