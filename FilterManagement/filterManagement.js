import React from 'react';
import {Image, View} from 'react-native';
import {
  Grayscale,
  Sepia,
  Tint,
  ColorMatrix as ColorMatrixFilter,
  concatColorMatrices,
  invert,
  contrast,
  saturate,
  sepia,
  brightness,
  tint,
  gamma,
  hueRotate,
  grayscale,
} from 'react-native-color-matrix-image-filters';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  ColorMatrix,
  Shader,
  ImageShader,
  Fill,
  Group,
  FilterMode,
  MipmapMode,
  drawAsImage,
  ImageFormat,
} from '@shopify/react-native-skia';
import {Skia} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
import {
  openglFilterEffects,
  getOpenGLFilterOverlay,
  createOpenGLFilteredImage,
} from '../utils/openglFilterEffects';
import {
  getFilterMatrix,
  setMatrixSystem,
  getMatrixSystem,
  MATRIX_SYSTEMS,
} from '../utils/filterMatrixUtils';
import {
  loadLUT,
  getCachedLUT,
  getCachedLUTImage,
  getCachedShader,
} from './lutLoader';

// Helper function to create temperature matrix based on temperature value
const createTemperatureMatrix = temperatureValue => {
  // Convert temperature value (0-100) to temperature adjustment (-1 to 1)
  const tempAdjustment = (temperatureValue - 50) / 50;

  // Create warm/cool temperature effect
  if (tempAdjustment > 0) {
    // Warm temperature (orange/red tint)
    return [
      1 + tempAdjustment * 0.3,
      0,
      0,
      0,
      tempAdjustment * 0.1,
      0,
      1 + tempAdjustment * 0.1,
      0,
      0,
      tempAdjustment * 0.05,
      0,
      0,
      1 - tempAdjustment * 0.2,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
    ];
  } else {
    // Cool temperature (blue tint)
    const coolAdjustment = Math.abs(tempAdjustment);
    return [
      1 - coolAdjustment * 0.2,
      0,
      0,
      0,
      0,
      0,
      1 - coolAdjustment * 0.1,
      0,
      0,
      0,
      0,
      0,
      1 + coolAdjustment * 0.3,
      0,
      coolAdjustment * 0.1,
      0,
      0,
      0,
      1,
      0,
    ];
  }
};
// Boost blue channel (amount: 0..0.5), optional blueBias: 0..0.1 to lift highlights
const blueBoost = (amount = 0.15, blueBias = 0) => [
  1,
  0,
  0,
  0,
  0.23, // R' = 1*R
  0.15,
  1,
  0,
  0,
  0.17, // G' = 1*G
  0,
  0,
  1 + amount,
  0,
  blueBias, // B' = (1+amount)*B + blueBias
  0,
  0,
  0,
  1,
  0, // A' = A
];
// Helper function to combine filter matrix with temperature matrix
export const combineWithTemperature = (
  filterMatrix,
  temperatureValue,
  tempActive,
) => {
  if (!tempActive || temperatureValue === 50) {
    return filterMatrix;
  }

  const tempMatrix = createTemperatureMatrix(temperatureValue);
  return concatColorMatrices(filterMatrix, tempMatrix);
};

// Function to get the appropriate filter component based on filter ID
export const getFilterComponent = (
  filterId,
  imageUri,
  temperatureValue = 50,
  tempActive = false,
) => {
  switch (filterId) {
    case 'grf':
      return (
        <Grayscale>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </Grayscale>
      );
    case 'sepia':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            sepia(),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'invert':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            invert(),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'contrast':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            contrast(2.0),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'saturate':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            saturate(2.0),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    // New filter IDs with various effects
    case 'classicu':
      return (
        <View style={{width: '100%', height: '100%', position: 'relative'}}>
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(
                tint(-0.1),
                contrast(1.45),
                //hueRotate(9.5),
                blueBoost(0.95, 0.01), // subtle cool breeze
                hueRotate(-0.5),
                saturate(1.1),
                brightness(0.85),
              ),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
          {/* Noise overlay image */}
          <Image
            source={{
              uri: 'https://img.freepik.com/free-photo/black-abstract-texture-background_1373-500.jpg?semt=ais_incoming&w=740&q=80',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
              opacity: 0.1, // Adjust opacity to control texture intensity
              pointerEvents: 'none',
            }}
          />
        </View>
      );
    case 'cpm35':
      return (
        <View style={{width: '100%', height: '100%', position: 'relative'}}>
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(
                contrast(1),
                saturate(2.8),
                brightness(0.9),
                tint(-0.06),
              ),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
          {/* Noise overlay image */}
          <Image
            source={{
              uri: 'https://img.freepik.com/free-photo/noisy-background_1194-7547.jpg',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
              opacity: 0.15, // Adjust opacity to control noise intensity
              pointerEvents: 'none',
            }}
          />
        </View>
      );
    case 'grdr':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(
              contrast(1),
              sepia(0.15),
              saturate(1),
              brightness(0.9),
              tint(-0.008),
              //gamma(0.9),
            ),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'nt16':
      return (
        <View style={{width: '100%', height: '100%', position: 'relative'}}>
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(
                contrast(1.2),
                saturate(1.9),
                brightness(0.95),
                tint(-0.05),
                hueRotate(0.4),
              ),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
          {/* Noise overlay image */}
          <Image
            source={{
              uri: 'https://img.freepik.com/free-photo/noisy-background_1194-7547.jpg',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
              opacity: 0.2, // Adjust opacity to control noise intensity
              pointerEvents: 'none',
            }}
          />
        </View>
      );
    case 'dclassic':
      return (
        <View style={{width: '100%', height: '100%', position: 'relative'}}>
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(brightness(1.1), contrast(1.45), saturate(1)),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
          {/* Noise overlay image */}
          <Image
            source={{
              uri: 'https://img.freepik.com/free-photo/noisy-background_1194-7547.jpg',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
              opacity: 0.2, // Adjust opacity to control noise intensity
              pointerEvents: 'none',
            }}
          />
        </View>
      );
    case 'ccdr':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(
              contrast(0.9),
              sepia(0.35),
              saturate(1.7),
              brightness(0.85),
            ),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'puli':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(
              sepia(0.19),
              saturate(1.4),
              brightness(0.95),
              contrast(0.9),
            ),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'fqsr':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(contrast(1.2), saturate(1.3)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'collage':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(sepia(0.3), tint(1.3), contrast(1.1)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'fxn':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(contrast(1.7), saturate(0.7)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'fxnr':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(sepia(0.6), contrast(1.4)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'dqs':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(contrast(1.6), saturate(1.1)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'ct2f':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(sepia(0.8), tint(1.1)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'd3d':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(contrast(1.9), saturate(0.5)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'instc':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(sepia(0.4), contrast(1.3), saturate(1.2)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'golf':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(contrast(1.2), saturate(1.5)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'infrared':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(invert(), contrast(1.5)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'vintage':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(sepia(0.9), tint(1.2), contrast(1.1)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'monochrome':
      if (tempActive && temperatureValue !== 50) {
        // Combine grayscale with temperature
        const grayscaleMatrix = [
          0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587,
          0.114, 0, 0, 0, 0, 0, 1, 0,
        ];
        const combinedMatrix = combineWithTemperature(
          grayscaleMatrix,
          temperatureValue,
          tempActive,
        );
        return (
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combinedMatrix}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
        );
      } else {
        return (
          <Grayscale>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </Grayscale>
        );
      }
    case '135ne':
      return (
        <View style={{width: '100%', height: '100%', position: 'relative'}}>
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(
                contrast(1), // Increased contrast for better visibility
                brightness(0.95), // Increased brightness for natural exposure
                sepia(0.15), // Slight saturation boost
              ),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
          {/* Noise overlay image */}
          <Image
            source={{
              uri: 'https://img.freepik.com/free-photo/noisy-background_1194-7547.jpg',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
              opacity: 0.2, // Adjust opacity to control noise intensity
              pointerEvents: 'none',
            }}
          />
        </View>
      );
    case '135sr':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(sepia(0.5), contrast(1.3)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'dhalf':
      // Check if we have dual photos for dhalf filter
      if (imageUri && imageUri.includes('dhalf_merged')) {
        // This is a merged dual photo - show it as is
        return (
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(
                saturate(0.6),
                contrast(0.9),
                [
                  1, 0, 0, 0, 0, 0, 1.02, 0, 0, 0, 0, 0, 0.98, 0, 0, 0, 0, 0, 1,
                  0,
                ],
              ),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
        );
      } else {
        // Regular single photo with dhalf filter
        return (
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(
                saturate(0.6),
                contrast(0.9),
                [
                  1, 0, 0, 0, 0, 0, 1.02, 0, 0, 0, 0, 0, 0.98, 0, 0, 0, 0, 0, 1,
                  0,
                ],
              ),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
        );
      }
    case 'dslide':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(sepia(0.3), contrast(1.5)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'sclassic':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(sepia(0.7), tint(1.1), contrast(1.2)),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'hoga':
      return (
        <View style={{width: '100%', height: '100%', position: 'relative'}}>
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(
                contrast(1.1),
                saturate(1.6),
                brightness(0.8),
                sepia(0.2),
                tint(0.08), // Add subtle warm tone
              ),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
          {/* Diagonal fading lines with gradient from edge to center */}
          <View
            style={{
              position: 'absolute',
              top: '-15%',
              left: '-15%',
              width: '30%',
              height: '30%',
              backgroundColor: 'transparent',
            }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: -3,
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                transform: [{rotate: '45deg'}],
              }}>
              {/* 400 layers for ultra-smooth gradient effect toward center */}
              {Array.from({length: 400}, (_, i) => {
                const opacity = 2.5 - (i * 2.5) / 399; // Much darker opacity with linear fade
                const finalOpacity =
                  Math.min(opacity, 1.0) * (1.0 - Math.pow(i / 399, 1.5)); // More transparent at end
                const leftPosition = i * 0.2; // Each layer is 0.2% width (400 layers total)
                return (
                  <View
                    key={i}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: leftPosition + '%',
                      width: '0.8%',
                      height: '80%',
                      backgroundColor: `rgba(0,0,0,${finalOpacity})`,
                    }}
                  />
                );
              })}
            </View>
          </View>
          <View
            style={{
              position: 'absolute',
              top: '-15%',
              right: '-15%',
              width: '30%',
              height: '30%',
              backgroundColor: 'transparent',
            }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: -9,
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                transform: [{rotate: '-45deg'}],
              }}>
              {/* 400 layers for ultra-smooth gradient effect toward center */}
              {Array.from({length: 400}, (_, i) => {
                const opacity = 2.5 - (i * 2.5) / 399; // Much darker opacity with linear fade
                const finalOpacity =
                  Math.min(opacity, 1.0) * (1.0 - Math.pow(i / 399, 1.5)); // More transparent at end
                const rightPosition = i * 0.2; // Each layer is 0.2% width (400 layers total)
                return (
                  <View
                    key={i}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: rightPosition + '%',
                      width: '0.8%',
                      height: '80%',
                      backgroundColor: `rgba(0,0,0,${finalOpacity})`,
                    }}
                  />
                );
              })}
            </View>
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: '-15%',
              left: '-15%',
              width: '30%',
              height: '30%',
              backgroundColor: 'transparent',
            }}>
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: -3,
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                transform: [{rotate: '-45deg'}],
              }}>
              {/* 400 layers for ultra-smooth gradient effect toward center */}
              {Array.from({length: 400}, (_, i) => {
                const opacity = 2.5 - (i * 2.5) / 399; // Much darker opacity with linear fade
                const finalOpacity =
                  Math.min(opacity, 1.0) * (1.0 - Math.pow(i / 399, 1.5)); // More transparent at end
                const leftPosition = i * 0.2; // Each layer is 0.2% width (400 layers total)
                return (
                  <View
                    key={i}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: leftPosition + '%',
                      width: '0.8%',
                      height: '80%',
                      backgroundColor: `rgba(0,0,0,${finalOpacity})`,
                    }}
                  />
                );
              })}
            </View>
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: '-15%',
              right: '-15%',
              width: '30%',
              height: '30%',
              backgroundColor: 'transparent',
            }}>
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: -9,
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
                transform: [{rotate: '45deg'}],
              }}>
              {/* 400 layers for ultra-smooth gradient effect toward center */}
              {Array.from({length: 400}, (_, i) => {
                const opacity = 2.5 - (i * 2.5) / 399; // Much darker opacity with linear fade
                const finalOpacity =
                  Math.min(opacity, 1.0) * (1.0 - Math.pow(i / 399, 1.5)); // More transparent at end
                const rightPosition = i * 0.2; // Each layer is 0.2% width (400 layers total)
                return (
                  <View
                    key={i}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: rightPosition + '%',
                      width: '0.8%',
                      height: '80%',
                      backgroundColor: `rgba(0,0,0,${finalOpacity})`,
                    }}
                  />
                );
              })}
            </View>
          </View>
        </View>
      );
    case 's67':
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(
              sepia(0),
              //blueBoost(0.85, 0.01),
              tint(0.2), // Increased red tone
              tint(-0.07), // Small green boost
              contrast(1.1),
              saturate(0.63),
              brightness(0.9),
            ),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
    case 'kv88':
      return (
        <View style={{width: '100%', height: '100%', position: 'relative'}}>
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(
                contrast(1.2),
                saturate(2.3),
                tint(-0.15),
                brightness(1.1),
              ),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
          {/* Noise overlay image */}
          <Image
            source={{
              uri: 'https://img.freepik.com/free-photo/noisy-background_1194-7547.jpg',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
              opacity: 0.3, // Adjust opacity to control noise intensity
              pointerEvents: 'none',
            }}
          />
          {/* Comb overlay using a single container */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: '100%',
              height: '100%',
              zIndex: 99999,
            }}>
            {/* Left side combs */}
            <View
              style={{
                position: 'absolute',
                top: 40,
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '8%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '16%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '24%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '32%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '40%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '48%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '56%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '64%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '72%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '80%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '88%',
                left: -3,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />

            {/* Right side combs */}
            <View
              style={{
                position: 'absolute',
                top: 40,
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '8%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '16%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '24%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '32%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '40%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '48%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '56%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '64%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '72%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '80%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: '88%',
                right: -9,
                width: 17,
                height: 16,
                backgroundColor: 'black',
                borderRadius: 7,
              }}
            />
          </View>
        </View>
      );
    case 'instsqc':
      // Generate random color for background
      const randomColors = [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#DDA0DD',
        '#98D8C8',
        '#F7DC6F',
        '#BB8FCE',
        '#85C1E9',
        '#F8C471',
        '#82E0AA',
        '#F1948A',
        '#85C1E9',
        '#D7BDE2',
      ];
      const randomColor =
        randomColors[Math.floor(Math.random() * randomColors.length)];

      return (
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#FFFFFF', // White margins
            paddingTop: 30,
            paddingBottom: 30,
            paddingLeft: 15,
            paddingRight: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          {/* Random colored background square */}
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: randomColor,
              justifyContent: 'center',
              alignItems: 'center',
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
              shadowColor: '#000000',
              shadowOffset: {
                width: 0,
                height: 4,
              },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 4,
            }}>
            {/* Original photo without any filter */}
            <Image
              source={{uri: imageUri}}
              style={{
                width: '90%',
                height: '90%',
                resizeMode: 'cover',
                borderTopLeftRadius: 5,
                borderTopRightRadius: 5,
                borderBottomLeftRadius: 5,
                borderBottomRightRadius: 5,
              }}
            />
          </View>
        </View>
      );
    case 'pafr':
      return (
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'white',
            paddingTop: 25,
            paddingBottom: 25,
            paddingLeft: 32,
            paddingRight: 32,
          }}>
          <ColorMatrixFilter
            style={{width: '100%', height: '100%'}}
            matrix={combineWithTemperature(
              concatColorMatrices(
                grayscale(1.5),
                contrast(3),
                brightness(0.29),
              ),
              temperatureValue,
              tempActive,
            )}>
            <Image
              source={{uri: imageUri}}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </ColorMatrixFilter>
          {/* Noise overlay image */}
          <Image
            source={{
              uri: 'https://img.freepik.com/free-photo/noisy-background_1194-7547.jpg',
            }} // Replace with your noise image path
            style={{
              position: 'absolute',
              top: 25,
              left: 32,
              right: 32,
              bottom: 25,
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
              opacity: 0.3, // Adjust opacity to control noise intensity
              pointerEvents: 'none',
            }}
          />
        </View>
      );
    default:
      // Default combination filter
      return (
        <ColorMatrixFilter
          style={{width: '100%', height: '100%'}}
          matrix={combineWithTemperature(
            concatColorMatrices(sepia(), tint(1.25), invert()),
            temperatureValue,
            tempActive,
          )}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </ColorMatrixFilter>
      );
  }
};

/**
 * Apply Grayscale filter using Skia with the exact same matrix as react-native-color-matrix-image-filters Grayscale component
 * This ensures we get the same result as the Grayscale component but with better reliability
 * @param {string} photoUri - URI of the photo to process
 * @param {Object} ref - React ref (not used in this implementation, kept for compatibility)
 * @returns {Promise<string>} - URI of the processed photo or original if failed
 */
export const applyGrayscaleFilterToPhoto = async (photoUri, ref) => {
  try {
    console.log(
      '🎨 Applying Grayscale filter using Skia with Grayscale component matrix',
    );

    // Read the image file
    const imageData = await RNFS.readFile(photoUri, 'base64');
    const data = Skia.Data.fromBase64(imageData);
    const skiaImage = Skia.Image.MakeImageFromEncoded(data);

    if (!skiaImage) {
      throw new Error('Failed to create Skia image');
    }

    const width = skiaImage.width();
    const height = skiaImage.height();

    // Create a temporary file path for the processed image with correct naming convention
    const tempPath = `${
      RNFS.TemporaryDirectoryPath
    }/skia_filtered_grf_${Date.now()}.jpg`;

    // Create surface and canvas
    const surface = Skia.Surface.Make(width, height);
    const canvas = surface.getCanvas();

    // Apply the exact same grayscale matrix that react-native-color-matrix-image-filters Grayscale component uses
    // This matrix converts RGB to grayscale using the standard luminance formula
    const grayscaleMatrix = [
      0.299,
      0.587,
      0.114,
      0,
      0, // Red channel
      0.299,
      0.587,
      0.114,
      0,
      0, // Green channel
      0.299,
      0.587,
      0.114,
      0,
      0, // Blue channel
      0,
      0,
      0,
      1,
      0, // Alpha channel (unchanged)
    ];

    const colorFilter = Skia.ColorFilter.MakeMatrix(grayscaleMatrix);
    const paint = Skia.Paint();
    paint.setColorFilter(colorFilter);
    canvas.drawImage(skiaImage, 0, 0, paint);

    // Make image from surface
    const image = surface.makeImageSnapshot();
    if (!image) {
      throw new Error('Failed to create image from surface');
    }

    // Encode image to bytes
    const imageDataOut = image.encodeToBytes();
    if (!imageDataOut) {
      throw new Error('Failed to encode image');
    }

    // Convert to base64
    const base64String = Buffer.from(imageDataOut).toString('base64');

    // Save to temporary file
    await RNFS.writeFile(tempPath, base64String, 'base64');

    console.log(
      '✅ Grayscale filter applied successfully using Grayscale component matrix:',
      tempPath,
    );
    return tempPath;
  } catch (error) {
    console.error('❌ Grayscale filter application failed:', error);
    return photoUri; // Return original URI if filtering fails
  }
};

/**
 * Helper function to create color matrix from filter config
 * @param {Object} filterConfig - Filter configuration object
 * @returns {Array} - Color matrix array
 */
const createColorMatrixFromFilter = filterConfig => {
  if (!filterConfig || !filterConfig.filters) {
    return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  }

  let brightness = 0;
  let contrast = 1;
  let saturation = 1;
  let hue = 0;
  let gamma = 1;

  // Extract values from filter config
  filterConfig.filters.forEach(filter => {
    if (filter.name === 'Brightness') brightness = filter.value;
    if (filter.name === 'Contrast') contrast = filter.value;
    if (filter.name === 'Saturation') saturation = filter.value;
    if (filter.name === 'Hue') hue = filter.value;
    if (filter.name === 'Gamma') gamma = filter.value;
  });

  // Special handling for GR F (black and white)
  if (
    filterConfig.name === 'grf' ||
    filterConfig.name?.toLowerCase().includes('grf')
  ) {
    return [
      0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114,
      0, 0, 0, 0, 0, 1, 0,
    ];
  }

  // Create comprehensive color matrix based on filter effects
  const brightnessOffset = brightness * 255;

  // Start with identity matrix
  const matrix = [
    contrast,
    0,
    0,
    0,
    brightnessOffset,
    0,
    contrast,
    0,
    0,
    brightnessOffset,
    0,
    0,
    contrast,
    0,
    brightnessOffset,
    0,
    0,
    0,
    1,
    0,
  ];

  // Apply saturation if needed
  if (saturation !== 1) {
    const r = 0.213;
    const g = 0.715;
    const b = 0.072;

    matrix[0] = (1 - saturation) * r + saturation;
    matrix[1] = (1 - saturation) * r;
    matrix[2] = (1 - saturation) * r;

    matrix[5] = (1 - saturation) * g;
    matrix[6] = (1 - saturation) * g + saturation;
    matrix[7] = (1 - saturation) * g;

    matrix[10] = (1 - saturation) * b;
    matrix[11] = (1 - saturation) * b;
    matrix[12] = (1 - saturation) * b + saturation;
  }

  return matrix;
};

/**
 * Helper function to create temperature color matrix
 * @param {number} tempValue - Temperature value (0-100)
 * @returns {Array} - Temperature color matrix array
 */
const createTemperatureColorMatrix = tempValue => {
  // Convert temperatureValue (0-100) to Kelvin (3000-7000)
  const kelvin = 3000 + (tempValue / 100) * 4000;

  // Create temperature color matrix based on inverted polarities
  let rMultiplier = 1.0;
  let gMultiplier = 1.0;
  let bMultiplier = 1.0;

  if (kelvin <= 3200) {
    // Very warm (tungsten) - now gives strong BLUE tint (cold)
    rMultiplier = 0.85; // Reduce red
    gMultiplier = 0.9; // Slightly reduce green
    bMultiplier = 1.2; // Increase blue
  } else if (kelvin <= 4000) {
    // Warm (sunrise/sunset) - now gives light BLUE tint (cool)
    rMultiplier = 0.9; // Reduce red
    gMultiplier = 0.95; // Slightly reduce green
    bMultiplier = 1.1; // Increase blue
  } else if (kelvin <= 5000) {
    // Neutral (midday) - now gives slight COOL tint
    rMultiplier = 0.95; // Slightly reduce red
    gMultiplier = 0.98; // Slightly reduce green
    bMultiplier = 1.05; // Slightly increase blue
  } else if (kelvin <= 6000) {
    // Cool (overcast) - now gives slight WARM tint
    rMultiplier = 1.05; // Slightly increase red
    gMultiplier = 1.02; // Slightly increase green
    bMultiplier = 0.95; // Slightly reduce blue
  } else {
    // Very cool (shade) - now gives stronger WARM tint
    rMultiplier = 1.2; // Increase red
    gMultiplier = 1.1; // Increase green
    bMultiplier = 0.85; // Reduce blue
  }

  // Return temperature color matrix (5x4 matrix)
  return [
    rMultiplier,
    0,
    0,
    0,
    0,
    0,
    gMultiplier,
    0,
    0,
    0,
    0,
    0,
    bMultiplier,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
};

/**
 * Helper function to combine two color matrices that is used especially here for
 * combining the temperature matrix with the filter matrix.
 * Performs matrix multiplication for 5x4 color matrices
 * Used to combine multiple filter effects into a single matrix
 *
 * @param {Array} matrix1 - First 5x4 color matrix
 * @param {Array} matrix2 - Second 5x4 color matrix
 * @returns {Array} - Combined 5x4 color matrix
 */
const combineColorMatrices = (matrix1, matrix2) => {
  // Matrix multiplication for 5x4 matrices
  const result = [];

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 5; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += matrix1[i * 5 + k] * matrix2[k * 5 + j];
      }
      result.push(sum);
    }
  }

  return result;
};

/**
 * Create LUT filter element for Skia processing
 * Creates a Skia component that applies LUT-based filtering with noise effects
 *
 * @param {string} photoUrl - Base64 encoded photo data
 * @param {number} imageWidth - Width of the image
 * @param {number} imageHeight - Height of the image
 * @param {string} filterId - ID of the filter to apply
 * @returns {JSX.Element|null} - Skia filter element or null if failed
 */
export const createLUTFilterElement = async (
  photoUrl,
  imageWidth,
  imageHeight,
  filterId,
) => {
  console.log(
    `⚡ Creating LUT filter element for ${filterId} using cached resources...`,
  );

  // Use cached shader for better performance
  let shader = getCachedShader();
  if (!shader) {
    console.error(
      '❌ Cached shader not found, falling back to dynamic compilation',
    );
    // Fallback to dynamic shader creation if cache is not initialized
    shader = Skia.RuntimeEffect.Make(`
    uniform shader image;
    uniform shader luts;
  
    // Simple noise function
    float rand(float2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
  
    half4 main(float2 xy) {
      // Original image processing
      vec4 color = image.eval(xy);
      
      int r = int(color.r * 255.0 / 4);
      int g = int(color.g * 255.0 / 4);
      int b = int(color.b * 255.0 / 4);
      
      float lutX = float(int(mod(float(b), 8.0)) * 64 + r);
      float lutY = float(int((b / 8) * 64 + g));
      
      vec4 lutsColor = luts.eval(float2(lutX, lutY));
      
      // Generate noise
      float noiseIntensity = 0.04; // Adjust this to control noise strength
      float noise = rand(xy) * noiseIntensity;
      
      // Blend noise with the image (simple additive blend)
      vec4 noisyColor = lutsColor + vec4(noise, noise, noise, 0.0);
      
      return noisyColor;
    }
  `);
    if (!shader) {
      console.error('❌ Failed to create fallback shader');
      return null;
    }
  }

  // Use cached LUT image for better performance
  let lutImage = getCachedLUTImage(filterId);
  if (!lutImage) {
    console.error(
      `❌ Cached LUT image not found for ${filterId}, falling back to dynamic loading`,
    );
    // Fallback to dynamic LUT loading if cache is not initialized
    const lutBase64 = await loadLUT(filterId);
    if (!lutBase64) {
      console.error('❌ Failed to load LUT for filter:', filterId);
      return null;
    }
    const lutData = Skia.Data.fromBase64(lutBase64);
    lutImage = Skia.Image.MakeImageFromEncoded(lutData);
    if (!lutImage) {
      console.error('❌ Failed to create fallback LUT image');
      return null;
    }
  }

  // Process the captured image
  const data = Skia.Data.fromBase64(photoUrl);
  const capturedImage = Skia.Image.MakeImageFromEncoded(data);

  if (!capturedImage || !shader || !lutImage) {
    console.error('❌ Missing required resources for LUT filter');
    return null;
  }

  console.log(`✅ Using cached resources for ${filterId} filter`);

  return (
    <Group>
      <Fill />
      <Shader source={shader} uniforms={{}}>
        <ImageShader
          fit="cover"
          image={capturedImage}
          rect={{
            x: 0,
            y: 0,
            width: imageWidth,
            height: imageHeight,
          }}
          sampling={{
            filter: FilterMode.Linear,
            mipmap: MipmapMode.None,
          }}
        />
        <ImageShader
          fit="cover"
          image={lutImage}
          rect={{
            x: 0,
            y: 0,
            width: 512,
            height: 512,
          }}
          sampling={{
            filter: FilterMode.Linear,
            mipmap: MipmapMode.None,
          }}
        />
      </Shader>
    </Group>
  );
};

/**
 * Apply Skia-based filter to a photo
 * Processes photos using Skia with support for both LUT-based and matrix-based filtering
 * Includes special effects for specific filters like vignettes and color overlays
 *
 * @param {string} photoUri - URI of the photo to process
 * @param {string} filterId - ID of the filter to apply
 * @param {number} temperatureValue - Temperature value for color adjustment (0-100)
 * @returns {Promise<string>} - URI of the processed photo or original if failed
 */
export const applySkiaFilterToPhoto = async (
  photoUri,
  filterId,
  temperatureValue = 50,
) => {
  try {
    console.log('🎨 Commencing Skia approach...');

    // Read the image file
    const imageData = await RNFS.readFile(photoUri, 'base64');
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Create Skia data from buffer
    const data = Skia.Data.fromBytes(new Uint8Array(imageBuffer));
    const skiaImage = Skia.Image.MakeImageFromEncoded(data);

    if (!skiaImage) {
      throw new Error('Failed to create Skia image');
    }

    const width = skiaImage.width();
    const height = skiaImage.height();

    // Create surface and canvas
    const surface = Skia.Surface.Make(width, height);
    const canvas = surface.getCanvas();

    // Apply fast grayscale filter for 'grf' using react-native-color-matrix-image-filters
    if (filterId === 'grf') {
      console.log(
        '🎨 Applying Grayscale filter for grf filter using react-native-color-matrix-image-filters',
      );

      // For grf filter, we need to use the Grayscale component approach
      // This should be called from the camera component where React components can be rendered
      console.log(
        '⚠️ grf filter requires Grayscale component - should be handled in camera component',
      );

      // Fallback to Skia matrix for now
      const grayscaleMatrix = [
        0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587,
        0.114, 0, 0, 0, 0, 0, 1, 0,
      ];
      const colorFilter = Skia.ColorFilter.MakeMatrix(grayscaleMatrix);
      const paint = Skia.Paint();
      paint.setColorFilter(colorFilter);
      canvas.drawImage(skiaImage, 0, 0, paint);
    }
    // Apply LUT-based filtering for 'ir', 'dexp', 'dfuns', 'cpm35', 'classicu', 'grdr', 'nt16', 'dclassic', 'ccdr', 'puli', and 'fqsr' filters
    else if (
      filterId === 'ir' ||
      filterId === 'dexp' ||
      filterId === 'dfuns' ||
      filterId === 'cpm35' ||
      filterId === 'classicu' ||
      filterId === 'grdr' ||
      filterId === 'nt16' ||
      filterId === 'dclassic' ||
      filterId === 'ccdr' ||
      filterId === 'puli' ||
      filterId === 'fqsr'
    ) {
      console.log(`🎨 Applying LUT-based filtering for ${filterId} filter`);
      const lutStartTime = Date.now();

      try {
        console.log('🎨 Using cached LUT resources for optimal performance...');

        // Create LUT filter element using cached resources
        const elementStartTime = Date.now();
        const filteredElement = await createLUTFilterElement(
          imageData,
          width,
          height,
          filterId,
        );
        const elementEndTime = Date.now();
        console.log(
          `⚡ LUT element creation took ${elementEndTime - elementStartTime}ms`,
        );

        if (!filteredElement) {
          throw new Error('Failed to create LUT filter element');
        }

        // Use drawAsImage with cached resources
        const drawStartTime = Date.now();
        const skImage = await drawAsImage(filteredElement, {
          width: width,
          height: height,
        });
        const drawEndTime = Date.now();
        console.log(
          `⚡ drawAsImage rendering took ${drawEndTime - drawStartTime}ms`,
        );

        // Draw the processed image to canvas
        canvas.drawImage(skImage, 0, 0);

        const lutEndTime = Date.now();
        console.log(
          `✅ LUT filtering completed in ${lutEndTime - lutStartTime}ms total`,
        );
      } catch (lutError) {
        console.error(
          '❌ LUT filtering failed, falling back to matrix:',
          lutError,
        );

        // Fallback to matrix-based filtering for grf
        const filterConfig = openglFilterEffects[filterId];
        const colorMatrix = getFilterMatrix(
          filterId,
          openglFilterEffects,
          createColorMatrixFromFilter,
        );
        const temperatureMatrix =
          createTemperatureColorMatrix(temperatureValue);
        const combinedMatrix = combineColorMatrices(
          colorMatrix,
          temperatureMatrix,
        );
        const colorFilter = Skia.ColorFilter.MakeMatrix(combinedMatrix);
        const paint = Skia.Paint();
        paint.setColorFilter(colorFilter);
        canvas.drawImage(skiaImage, 0, 0, paint);
      }
    } else {
      // Use original matrix-based filtering for all other filters
      console.log('🎨 Using matrix-based filtering for', filterId);

      // Create color matrix
      const filterConfig = openglFilterEffects[filterId];
      console.log('🎨 Filter config:', filterConfig);

      // Get the correct color matrix for the specific filter
      console.log('🎨 Current matrix system:', getMatrixSystem());
      const colorMatrix = getFilterMatrix(
        filterId,
        openglFilterEffects,
        createColorMatrixFromFilter,
      );
      console.log('🎨 Color matrix:', colorMatrix);

      // Create temperature color matrix based on current temperature value
      const temperatureMatrix = createTemperatureColorMatrix(temperatureValue);
      console.log('🌡️ Temperature matrix:', temperatureMatrix);

      // Combine filter and temperature matrices
      const combinedMatrix = combineColorMatrices(
        colorMatrix,
        temperatureMatrix,
      );
      console.log('🎨 Combined matrix:', combinedMatrix);

      const colorFilter = Skia.ColorFilter.MakeMatrix(combinedMatrix);

      // Create paint
      const paint = Skia.Paint();
      paint.setColorFilter(colorFilter);

      // Draw the image with the filter
      canvas.drawImage(skiaImage, 0, 0, paint);
    }

    // Apply vignette effect specifically for hoga filter
    if (filterId === 'hoga') {
      console.log('🎨 Applying vignette effect for hoga filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (reduced size as requested)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0,0,0,0.5)')], // 50% dark at corners
        [0, 0.5], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply vignette effect specifically for hoga filter
    if (filterId === 'classicu') {
      console.log('🎨 Applying vignette effect for classicu filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (reduced size as requested)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0,0,0,0.2)')], // 50% dark at corners
        [0, 0.001], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient2 = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(255, 255, 255, 0.09)')], // 50% dark at corners
        [0, 0.001], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient2);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply vignette effect specifically for puli filter
    if (filterId === 'puli') {
      console.log('🎨 Applying vignette effect for puli filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (reduced size as requested)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(255, 255, 255, 0.1)')], // 50% dark at corners
        [0, 0.001], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );
      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply vignette effect specifically for fqsr filter
    if (filterId === 'fqsr') {
      console.log('🎨 Applying vignette effect for fqsr filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark brown corners
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0, 0, 0, 0.1)')], // Dark brown with 0.5 opacity
        [0, 0.005], // Standard vignette effect
        0, // TileMode.Clamp = 0
      );
      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }
    // Apply vignette effect specifically for dfuns filter
    if (filterId === 'dfuns') {
      console.log('🎨 Applying vignette effect for dfuns filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (reduced size as requested)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0,0,0,0.25)')], // 50% dark at corners
        [0, 0.001], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply vignette effect specifically for cpm35 filter
    if (filterId === 'cpm35') {
      console.log('🎨 Applying vignette effect for cpm35 filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (reduced size as requested)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0,0,0,0.25)')], // 50% dark at corners
        [0, 0.001], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply vignette effect specifically for grdr filter
    if (filterId === 'grdr') {
      console.log('🎨 Applying vignette effect for grdr filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0, 0, 0, 0.38)')], // 30% dark at corners
        [0, 0.004], // Moderate vignette effect
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    if (filterId === 'ccdr') {
      console.log('🎨 Applying vignette effect for ccdr filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(16, 15, 5, 0.32)')], // 30% dark at corners
        [0, 0.004], // Moderate vignette effect
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply gradient split overlay effect specifically for nt16 filter
    if (filterId === 'nt16') {
      console.log('🎨 Applying gradient split overlay effect for nt16 filter');

      // Create gradient paint
      const gradientPaint = Skia.Paint();

      // Create linear gradient from white (top) to black (bottom)
      const gradient = Skia.Shader.MakeLinearGradient(
        {x: 0, y: 0}, // Start point (top)
        {x: 0, y: height}, // End point (bottom)
        [
          Skia.Color('rgba(151, 111, 111, 0.38)'), // White at top
          Skia.Color('rgba(38, 50, 71, 0.38)'), // Black at bottom
        ],
        [0, 1], // Color stops
        0, // TileMode.Clamp = 0
      );

      gradientPaint.setShader(gradient);

      // Draw gradient overlay across entire image
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), gradientPaint);
    }

    // Apply vignette effect specifically for dclassic filter
    if (filterId === 'dclassic') {
      console.log('🎨 Applying vignette effect for dclassic filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (same as hoga)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0,0,0,0.48)')], // 50% dark at corners
        [0, 0.005], // Reduced shadow size
        0, // TileMode.Clamp
      );

      const gradient2 = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(255, 255, 255, 0.15)')], // 50% dark at corners
        [0, 0.005], // Reduced shadow size
        0, // TileMode.Clamp
      );

      vignettePaint.setShader(gradient);
      vignettePaint.setShader(gradient2);
      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply special effects for dexp filter
    if (filterId === 'dexp') {
      console.log('🎨 Applying vignette effect for dexp filter');

      // 1. Yellow weak background overlay
      const yellowPaint = Skia.Paint();
      yellowPaint.setColor(Skia.Color('rgba(0, 0, 0, 0.2)')); // Weak yellow overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), yellowPaint);

      // 2. Red vignette at bottom (20% from bottom, full width)
      const redVignettePaint = Skia.Paint();
      const bottomStartY = height * 0.8; // Start from 80% height (20% from bottom)
      const bottomHeight = height * 0.2; // 20% of image height

      // Create linear gradient from transparent to red at bottom
      const redGradient = Skia.Shader.MakeLinearGradient(
        {x: 0, y: bottomStartY}, // Start point (top of bottom area)
        {x: 0, y: height}, // End point (bottom of image)
        [Skia.Color('transparent'), Skia.Color('rgba(255, 0, 0, 0.25)')], // Red with 0.25 opacity
        [0, 4],
        0, // TileMode.Clamp = 0
      );

      redVignettePaint.setShader(redGradient);

      // Draw red vignette at bottom
      canvas.drawRect(
        Skia.XYWHRect(0, bottomStartY, width, bottomHeight),
        redVignettePaint,
      );

      // 3. Black vignette at top (20% from top, full width)
      const blackVignettePaint = Skia.Paint();
      const topStartY = 0; // Start from top
      const topHeight = height * 0.2; // 20% of image height

      // Create linear gradient from black to transparent (top to bottom)
      const blackGradient = Skia.Shader.MakeLinearGradient(
        {x: 0, y: topStartY}, // Start point (top of image)
        {x: 0, y: topHeight}, // End point (20% down from top)
        [Skia.Color('rgba(0, 0, 0, 0.3)'), Skia.Color('transparent')], // Black to transparent
        [0, 1],
        0, // TileMode.Clamp = 0
      );

      blackVignettePaint.setShader(blackGradient);

      // Draw black vignette at top
      canvas.drawRect(
        Skia.XYWHRect(0, topStartY, width, topHeight),
        blackVignettePaint,
      );
    }

    // Apply corner vignette effect for dfuns filter
    if (filterId === 'dfuns') {
      console.log('🎨 Applying corner vignette effect for dfuns filter');

      // Create corner vignette paint
      const cornerVignettePaint = Skia.Paint();
      const cornerSize = Math.min(width, height) * 0.2; // 30% of image size for larger coverage

      // Create radial gradient for corner vignette
      const cornerGradient = Skia.Shader.MakeRadialGradient(
        {x: 0, y: 0}, // Center point (will be adjusted per corner)
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')], // Dark to transparent
        [0, 1],
        0, // TileMode.Clamp = 0
      );

      cornerVignettePaint.setShader(cornerGradient);

      // Top-left corner
      const topLeftGradient = Skia.Shader.MakeRadialGradient(
        {x: 0, y: 0}, // Center at the very corner point
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')],
        [0, 1],
        0,
      );
      cornerVignettePaint.setShader(topLeftGradient);
      canvas.drawRect(
        Skia.XYWHRect(0, 0, cornerSize, cornerSize),
        cornerVignettePaint,
      );

      // Top-right corner
      const topRightGradient = Skia.Shader.MakeRadialGradient(
        {x: width, y: 0}, // Center at the very corner point
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')],
        [0, 1],
        0,
      );
      cornerVignettePaint.setShader(topRightGradient);
      canvas.drawRect(
        Skia.XYWHRect(width - cornerSize, 0, cornerSize, cornerSize),
        cornerVignettePaint,
      );

      // Bottom-left corner
      const bottomLeftGradient = Skia.Shader.MakeRadialGradient(
        {x: 0, y: height}, // Center at the very corner point
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')],
        [0, 1],
        0,
      );
      cornerVignettePaint.setShader(bottomLeftGradient);
      canvas.drawRect(
        Skia.XYWHRect(0, height - cornerSize, cornerSize, cornerSize),
        cornerVignettePaint,
      );

      // Bottom-right corner
      const bottomRightGradient = Skia.Shader.MakeRadialGradient(
        {x: width, y: height}, // Center at the very corner point
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')],
        [0, 1],
        0,
      );
      cornerVignettePaint.setShader(bottomRightGradient);
      canvas.drawRect(
        Skia.XYWHRect(
          width - cornerSize,
          height - cornerSize,
          cornerSize,
          cornerSize,
        ),
        cornerVignettePaint,
      );
    }

    // Make image from surface
    const image = surface.makeImageSnapshot();
    if (!image) {
      throw new Error('Failed to create image from surface');
    }

    // Encode image to bytes
    const imageDataOut = image.encodeToBytes();
    if (!imageDataOut) {
      throw new Error('Failed to encode image');
    }

    // Convert to base64
    const base64String = Buffer.from(imageDataOut).toString('base64');

    // Save to temporary file
    const tempPath = `${
      RNFS.TemporaryDirectoryPath
    }/skia_filtered_${filterId}_${Date.now()}.jpg`;
    await RNFS.writeFile(tempPath, base64String, 'base64');

    console.log('✅ Skia filter applied successfully:', tempPath);
    return tempPath;
  } catch (error) {
    console.error('❌ Skia filter application failed:', error);
    return photoUri; // Return original URI if filtering fails
  }
};
