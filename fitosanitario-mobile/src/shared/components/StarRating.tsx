import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';

type Props = {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  showValue?: boolean;
};

export function StarRating({ value, onChange, size = 28, readonly = false, showValue = false }: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {stars.map((star) => {
          const filled = star <= Math.round(value);
          return (
            <Pressable
              key={star}
              onPress={() => {
                if (!readonly && onChange) {
                  onChange(star);
                }
              }}
              disabled={readonly}
              style={styles.starBtn}
            >
              <Text style={[styles.star, { fontSize: size }, filled ? styles.filled : styles.empty]}>
                {filled ? '★' : '☆'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {showValue && (
        <Text style={styles.valueText}>
          {value.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBtn: {
    padding: 2,
  },
  star: {
    lineHeight: undefined,
  },
  filled: {
    color: '#f59e0b',
  },
  empty: {
    color: '#d1d5db',
  },
  valueText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
