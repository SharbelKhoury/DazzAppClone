import React, {forwardRef} from 'react';
import {Image, View} from 'react-native';
import {Grayscale} from 'react-native-color-matrix-image-filters';

/**
 * GrayscaleFilterComponent - A React component that applies grayscale filter using react-native-color-matrix-image-filters
 * This component can be used with react-native-view-shot to capture the filtered image
 */
const GrayscaleFilterComponent = forwardRef(
  ({imageUri, width, height, style}, ref) => {
    return (
      <View
        ref={ref}
        style={[
          {
            width: width || 300,
            height: height || 300,
            backgroundColor: 'transparent',
          },
          style,
        ]}
        collapsable={false}>
        <Grayscale>
          <Image
            source={{uri: imageUri}}
            style={{
              width: width || 300,
              height: height || 300,
              resizeMode: 'contain',
            }}
          />
        </Grayscale>
      </View>
    );
  },
);

GrayscaleFilterComponent.displayName = 'GrayscaleFilterComponent';

export default GrayscaleFilterComponent;
