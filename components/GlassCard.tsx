import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'danger' | 'surface';
  style?: ViewStyle;
  padding?: number;
}

export function GlassCard({ children, variant = 'default', style, padding = 20 }: GlassCardProps) {
  const borderColor = variant === 'danger'
    ? 'rgba(220, 38, 38, 0.4)'
    : variant === 'elevated'
      ? 'rgba(14, 165, 233, 0.5)'
      : Colors.glassBorder;

  const bgColor = variant === 'danger'
    ? 'rgba(220, 38, 38, 0.15)'
    : variant === 'surface'
      ? 'rgba(26, 54, 93, 0.4)'
      : Colors.glassBg;

  return (
    <View style={[styles.container, { borderColor }, style]}>
      <BlurView intensity={Colors.glassBlur} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[styles.overlay, { backgroundColor: bgColor }]} />
      <View style={[styles.content, { padding }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'relative',
  },
});
