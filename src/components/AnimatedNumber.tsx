import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import {
  useSharedValue,
  useAnimatedReaction,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  style?: TextStyle;
  unitStyle?: TextStyle;
  unit?: string;
  duration?: number;
  decimals?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  style,
  unitStyle,
  unit,
  duration = 300,
  decimals = 0,
}) => {
  const animatedValue = useSharedValue(value);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    animatedValue.set(
      withTiming(value, {
        duration,
        easing: Easing.bezier(0.23, 1, 0.32, 1),
      })
    );
  }, [value]);

  useAnimatedReaction(
    () => animatedValue.get(),
    (current) => {
      setDisplayValue(current);
    }
  );

  return (
    <Text style={[styles.text, style]}>
      {displayValue.toFixed(decimals)}
      {unit ? <Text style={unitStyle}> {unit}</Text> : null}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
  },
});
