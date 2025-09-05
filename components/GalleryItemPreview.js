import React, {useState, useEffect, useRef} from 'react';
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
  PanResponder,
  Animated,
} from 'react-native';
import RNFS from 'react-native-fs';
import {cameraCategories} from '../utils/cameraData';

const {width, height} = Dimensions.get('window');

const GalleryItemPreview = ({navigation, route}) => {
  const {item} = route.params || {};
  const [isVideo, setIsVideo] = useState(false);

  // Animation for slide down gesture
  const slideAnimation = useRef(new Animated.Value(0)).current;
  // Animation for diagonal slide gesture
  const diagonalSlideAnimation = useRef(new Animated.Value(0)).current;

  // Interpolate slide animation to translateY
  const slideInterpolate = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height], // Slide down by full screen height
  });

  // Interpolate diagonal slide animation to translateX and translateY
  const diagonalSlideInterpolateX = diagonalSlideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -width], // Slide left by full screen width
  });

  const diagonalSlideInterpolateY = diagonalSlideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height], // Slide down by full screen height
  });

  // Function to get filter name from filter ID
  const getFilterName = filterId => {
    if (!filterId) return 'Original';

    // Search through all camera categories to find the filter
    for (const category of cameraCategories) {
      const camera = category.cameras.find(cam => cam.id === filterId);
      if (camera) {
        return camera.name;
      }
    }
    return 'Original'; // Default fallback
  };

  // PanResponder for slide gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Respond to downward movements OR diagonal movements (top-right to bottom-left)
        const isDownward = gestureState.dy > 10;
        const isDiagonal = gestureState.dy > 10 && gestureState.dx < -10; // Moving down and left
        return isDownward || isDiagonal;
      },
      onPanResponderGrant: () => {
        // Reset animation values when gesture starts
        slideAnimation.setValue(0);
        diagonalSlideAnimation.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Check if it's a diagonal movement (top-right to bottom-left)
        if (gestureState.dy > 0 && gestureState.dx < 0) {
          // Diagonal movement: calculate distance from start point
          const distance = Math.sqrt(
            gestureState.dy * gestureState.dy +
              gestureState.dx * gestureState.dx,
          );
          const progress = Math.min(distance / 800, 1); // Reduced from 400 to 800 (2x slower)
          diagonalSlideAnimation.setValue(progress);
        } else if (gestureState.dy > 0) {
          // Pure downward movement
          const progress = Math.min(gestureState.dy / 800, 1); // Reduced from 400 to 800 (2x slower)
          slideAnimation.setValue(progress);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Check if it's a diagonal movement
        if (gestureState.dy > 0 && gestureState.dx < 0) {
          const distance = Math.sqrt(
            gestureState.dy * gestureState.dy +
              gestureState.dx * gestureState.dx,
          );
          if (distance > 100) {
            // Navigate back immediately to show AppGallery behind the sliding image
            navigation.goBack();
            // Complete the animation after navigation
            Animated.timing(diagonalSlideAnimation, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          } else {
            // If not swiped far enough, snap back to original position
            Animated.spring(diagonalSlideAnimation, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        } else if (gestureState.dy > 100) {
          // Navigate back immediately to show AppGallery behind the sliding image
          navigation.goBack();
          // Complete the animation after navigation
          Animated.timing(slideAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          // If not swiped far enough, snap back to original position
          Animated.spring(slideAnimation, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

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

              // No need to call refresh callback - AppGallery will refresh on focus

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

  const handleLiit = () => {
    /* Alert.alert('Like Item', 'Are you sure you want to like this item?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Like', style: 'destructive', onPress: () => {}},
    ]); */
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
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {translateX: diagonalSlideInterpolateX},
            {
              translateY: Animated.add(
                slideInterpolate,
                diagonalSlideInterpolateY,
              ),
            },
          ],
        },
      ]}
      {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        {/*       <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Text style={styles.headerButtonText}>‹</Text>
        </TouchableOpacity>
 */}
        {/*   <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>
            {isVideo ? 'Video Preview' : 'Photo Preview'}
          </Text>
        </View> */}

        {/*     <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Text style={styles.headerButtonText}>↗</Text>
        </TouchableOpacity> */}
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

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {/* Info Panel */}
        <View style={styles.infoPanel}>
          <Text style={styles.fileName}>
            #{getFilterName(item.filterId || item.activeFilter)}
          </Text>
          {/* <Text style={styles.fileName}>{item.fileName || 'Untitled'}</Text> */}
          {/* {item.fileSize && (
            <Text style={styles.fileSize}>
              {(item.fileSize / 1024 / 1024).toFixed(2)} MB
            </Text>
          )} */}
          {/* {item.timestamp && (
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          )} */}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, {paddingLeft: 110}]}
            onPress={handleShare}>
            {/* <Text style={styles.shareButtonText}>📤 Share</Text> */}
            <Image
              source={require('../src/assets/icons/share.png')}
              style={styles.shareButtonIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleLiit}>
            {/* <Text style={styles.deleteButtonText}>🗑️ Delete</Text> */}
            <Image
              source={require('../src/assets/icons/liit2.png')}
              style={[styles.LiitButtonIcon, {}]}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            {/* <Text style={styles.deleteButtonText}>🗑️ Delete</Text> */}
            <Image
              source={require('../src/assets/icons/trash.png')}
              style={styles.deleteButtonIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 0,
    margin: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
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
    width: '100%',
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#000',
    padding: 0,
    margin: 0,
  },
  image: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: width,
    height: '100%',
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
    maxWidth: '50%',
    paddingVertical: 20,
    //backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    //borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  fileName: {
    marginLeft: 0,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    borderRadius: 25,
    //backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  deleteButtonIcon: {
    width: 25,
    height: 25,
    tintColor: 'rgb(235, 235, 235)',
  },
  LiitButtonIcon: {
    width: 25,
    height: 25,
  },
  shareButtonIcon: {
    width: 25,
    height: 25,
    tintColor: 'rgb(223, 223, 223)',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -3,
  },
});

export default GalleryItemPreview;
