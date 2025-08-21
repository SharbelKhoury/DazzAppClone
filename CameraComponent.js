import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
import {launchImageLibrary} from 'react-native-image-picker';

const CameraComponent = ({navigation}) => {
  const {hasPermission, requestPermission} = useCameraPermission();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const cameraRef = useRef(null);
  const devices = useCameraDevices();
  const device =
    devices?.back || devices?.front || Object.values(devices || {})[0];

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    console.log('Devices:', devices);
    console.log('Selected device:', device);
    console.log('Has permission:', hasPermission);
  }, [devices, device, hasPermission]);

  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert('Camera not ready', 'Please wait for camera to initialize');
      return;
    }

    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });

      Alert.alert('Photo taken!', `Photo saved to: ${photo.path}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Error taking photo:', error);
    }
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to open gallery');
      } else if (response.assets && response.assets[0]) {
        const image = response.assets[0];
        setSelectedImage(image.uri);
        Alert.alert('Image Selected', `Selected: ${image.fileName || 'Image'}`);
      }
    });
  };

  const openFilterControl = () => {
    navigation.navigate('FilterControl');
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <Text style={[styles.permissionText, {fontSize: 14, marginTop: 20}]}>
          Permission status: {hasPermission ? 'Granted' : 'Not granted'}
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
        <Text style={[styles.permissionText, {fontSize: 14, marginTop: 10}]}>
          Devices: {JSON.stringify(Object.keys(devices || {}))}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        onInitialized={() => setIsCameraReady(true)}
      />

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{uri: selectedImage}} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.clearImageButton}
            onPress={() => setSelectedImage(null)}>
            <Text style={styles.clearImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Camera Controls */}
      <View style={styles.controlsContainer}>
        {/* Gallery Button (Left) */}
        <TouchableOpacity style={styles.sideButton} onPress={openGallery}>
          <View style={styles.galleryIcon}>
            <Text style={styles.buttonText}>📷</Text>
          </View>
          <Text style={styles.buttonLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Shutter Button (Center) */}
        <TouchableOpacity
          style={styles.shutterButton}
          onPress={takePicture}
          disabled={!isCameraReady}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        {/* Retro Camera Button (Right) */}
        <TouchableOpacity style={styles.sideButton} onPress={openFilterControl}>
          <View style={styles.retroIcon}>
            <Text style={styles.buttonText}>🎞️</Text>
          </View>
          <Text style={styles.buttonLabel}>Retro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  imagePreviewContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  clearImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sideButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  retroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 24,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraComponent;
