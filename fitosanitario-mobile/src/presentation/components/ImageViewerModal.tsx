import React, { useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { fixMediaUrl } from '../../shared/utils/mediaUrl';

const { width: W, height: H } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

export function ImageViewerModal({ visible, imageUrl, onClose }: ImageViewerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [zoom, setZoom] = useState(1);

  const handleZoom = () => {
    const nextZoom = zoom === 1 ? 3 : 1;
    setZoom(nextZoom);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeArea} onPress={onClose} activeOpacity={1}>
          <View style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </View>
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bouncesZoom
          onTouchEnd={(e) => {
            const touch = e.nativeEvent as any;
            if (touch?.touches?.length === 1) {
              onClose();
            }
          }}
        >
          <TouchableOpacity onPress={handleZoom} activeOpacity={1}>
            <Image
              source={{ uri: fixMediaUrl(imageUrl)! }}
              style={styles.image}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </ScrollView>

        <Text style={styles.hint}>
          {zoom === 1 ? 'Toca para hacer zoom' : 'Toca para alejar'}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: W,
    height: H * 0.85,
  },
  hint: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
});
