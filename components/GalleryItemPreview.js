import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import RNFS from 'react-native-fs';

const {width, height} = Dimensions.get('window');

const GalleryItemPreview = ({navigation, route}) => {
  const {item, onRefresh} = route.params || {};
  const [isVideo, setIsVideo] = useState(false);

  useEffect(() => {
    if (item) {
      // Check if it's a video based on file extension or media type
      const isVideoFile =
        item.type === 'video' ||
        item.fileName?.toLowerCase().includes('.mp4') ||
        item.fileName?.toLowerCase().includes('.mov') ||
        item.fileName?.toLowerCase().includes('.avi') ||
        item.uri?.toLowerCase().includes('.mp4') ||
        item.uri?.toLowerCase().includes('.mov') ||
        item.uri?.toLowerCase().includes('.avi');

      setIsVideo(isVideoFile);
    }
  }, [item]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = async () => {
    try {
      if (item?.uri) {
        await Share.share({
          url: item.uri,
          message: 'Check out this photo/video from Dazz App!',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share the item');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item?.uri) {
              // Remove the 'file://' prefix if present
              const filePath = item.uri.replace('file://', '');

              // Check if file exists before deleting
              const fileExists = await RNFS.exists(filePath);
              if (!fileExists) {
                Alert.alert('Error', 'File not found');
                return;
              }

              // Delete the file
              await RNFS.unlink(filePath);
              console.log('✅ File deleted successfully:', filePath);

              // Call the refresh callback if provided
              if (onRefresh && typeof onRefresh === 'function') {
                onRefresh();
              }

              Alert.alert('Success', 'Item deleted successfully');
              navigation.goBack();
            } else {
              Alert.alert('Error', 'No file path available');
            }
          } catch (error) {
            console.error('❌ Error deleting file:', error);
            Alert.alert('Error', 'Failed to delete the item');
          }
        },
      },
    ]);
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No item selected</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back to Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Text style={styles.headerButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>
            {isVideo ? 'Video Preview' : 'Photo Preview'}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Text style={styles.headerButtonText}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* Media Content */}
      <View style={styles.mediaContainer}>
        {isVideo ? (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoIcon}>🎥</Text>
            <Text style={styles.videoText}>Video File</Text>
            <Text style={styles.videoSubtext}>
              {item.fileName || 'Video preview not available'}
            </Text>
            <TouchableOpacity style={styles.playButton}>
              <Text style={styles.playButtonText}>▶️ Play</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Image
            source={{uri: item.uri}}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Info Panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.fileName}>{item.fileName || 'Untitled'}</Text>
        {item.fileSize && (
          <Text style={styles.fileSize}>
            {(item.fileSize / 1024 / 1024).toFixed(2)} MB
          </Text>
        )}
        {item.timestamp && (
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        )}
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Share</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  image: {
    width: width,
    height: height * 0.6,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  videoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
  },
  videoSubtext: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoPanel: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  fileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  fileSize: {
    color: '#999',
    fontSize: 14,
    marginBottom: 5,
  },
  timestamp: {
    color: '#999',
    fontSize: 14,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GalleryItemPreview;
