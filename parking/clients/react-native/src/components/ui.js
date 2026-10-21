// The handful of building blocks the web clients get from HTML and styles.css.
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '../theme.js';

// testID carries the same panel id the web clients use (auth-panel, admin-panel, ...).
export function Panel({ id, title, subtitle, children }) {
  return (
    <View testID={id} style={styles.panel}>
      <View>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function Button({ label, onPress, kind = 'primary', disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[kind],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.buttonText, kind === 'ghost' && styles.ghostText]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkSoft}
        style={styles.input}
        {...inputProps}
      />
    </View>
  );
}

// A phone has no <select>. For a handful of options, a row of chips is the native choice:
// every option is visible and one tap picks it.
export function Choices({ label, options, value, onChange, disabled = false }) {
  return (
    <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[styles.chip, selected && styles.chipSelected, disabled && styles.disabled]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// status is { text, isError } or null.
export function Status({ status }) {
  if (!status) return null;
  return <Text style={[styles.status, status.isError && styles.error]}>{status.text}</Text>;
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderRadius: radius,
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  subtitle: {
    marginTop: 4,
    color: colors.inkSoft,
  },
  button: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.mint,
  },
  danger: {
    backgroundColor: colors.coral,
  },
  ghost: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  ghostText: {
    color: colors.ink,
  },
  field: {
    gap: 6,
  },
  label: {
    color: colors.ink,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.ink,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  chipText: {
    color: colors.ink,
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  status: {
    color: colors.inkSoft,
  },
  error: {
    color: colors.error,
  },
});
