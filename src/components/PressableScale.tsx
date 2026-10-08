import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  children,
  style,
  scaleTo = 0.97,
  ...pressableProps
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.set(
          withTiming(scaleTo, {
            duration: 100,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
          })
        );
      }}
      onPressOut={() => {
        scale.set(
          withTiming(1, {
            duration: 150,
            easing: Easing.bezier(0.23, 1, 0.32, 1),
          })
        );
      }}
      {...pressableProps}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};
