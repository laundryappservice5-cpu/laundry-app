import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AnimatedPressable } from './AnimatedPressable';
import { useUploadImagesMutation } from '../api/uploadApi';
import { COLORS } from '../utils/constants';

interface ImagePickerGridProps {
  images: string[];
  onChange: (urls: string[]) => void;
}

export function ImagePickerGrid({ images, onChange }: ImagePickerGridProps) {
  const [uploadImages, { isLoading }] = useUploadImagesMutation();
  const [error, setError] = useState<string | null>(null);

  async function pickAndUpload(useCamera: boolean) {
    setError(null);
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to continue.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true });

    if (result.canceled || result.assets.length === 0) return;

    try {
      const { urls } = await uploadImages({
        files: result.assets.map((asset, idx) => ({
          uri: asset.uri,
          name: `pickup-${Date.now()}-${idx}.jpg`,
          type: 'image/jpeg',
        })),
        folder: 'pickups',
      }).unwrap();
      onChange([...images, ...urls]);
    } catch {
      setError('Image storage is not configured yet — ask your admin to set up Cloudinary.');
    }
  }

  function removeImage(url: string) {
    onChange(images.filter((u) => u !== url));
  }

  return (
    <View>
      <View style={styles.row}>
        {images.map((url) => (
          <View key={url} style={styles.thumbWrapper}>
            <Image source={{ uri: url }} style={styles.thumb} />
            <Pressable style={styles.removeButton} onPress={() => removeImage(url)}>
              <Text style={styles.removeText}>✕</Text>
            </Pressable>
          </View>
        ))}

        <AnimatedPressable style={styles.addTile} onPress={() => pickAndUpload(true)}>
          {isLoading ? <ActivityIndicator /> : <Text style={styles.addIcon}>📷</Text>}
          <Text style={styles.addLabel}>Camera</Text>
        </AnimatedPressable>

        <AnimatedPressable style={styles.addTile} onPress={() => pickAndUpload(false)}>
          {isLoading ? <ActivityIndicator /> : <Text style={styles.addIcon}>🖼️</Text>}
          <Text style={styles.addLabel}>Gallery</Text>
        </AnimatedPressable>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrapper: { position: 'relative' },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: COLORS.border },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addTile: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { fontSize: 20 },
  addLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 8 },
});
