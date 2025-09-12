import {SafeAreaView, Image, PixelRatio, ScrollView} from 'react-native';
/* import {
  Canvas,
  useImage,
  Skia,
  Shader,
  ImageShader,
  Fill,
  Group,
  FilterMode,
  MipmapMode,
  MitchellCubicSampling,
} from '@shopify/react-native-skia'; */
import {base64 as lutBase64} from './vintage2';
import {
  Grayscale,
  Sepia,
  Tint,
  ColorMatrix,
  concatColorMatrices,
  invert,
  contrast,
  saturate,
  sepia,
  tint,
} from 'react-native-color-matrix-image-filters';

/* const pixelRatio = PixelRatio.get(); */

const App = () => {
  /* const image = useImage(require('./image.png')); */

  /*   const shader = Skia.RuntimeEffect.Make(`
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
      
      return lutsColor;
    }
`);

  const lutData = Skia.Data.fromBase64(lutBase64);
  const lutImage = Skia.Image.MakeImageFromEncoded(lutData);
 */

  const GrayscaledImage = imageProps => (
    <Grayscale>
      <Image
        source={require('./image.png')}
        style={{width: 300, height: 300}}
      />
    </Grayscale>
  );

  const CombinedFiltersImage = imageProps => (
    <ColorMatrix matrix={concatColorMatrices(sepia(), tint(1.25))}>
      <Image
        source={require('./image.png')}
        style={{width: 300, height: 300}}
      />
    </ColorMatrix>
  );

  const ColorMatrixImage = imageProps => (
    <ColorMatrix
      matrix={concatColorMatrices(saturate(-0.9), contrast(5.2), invert())}>
      <Image
        source={require('./image.png')}
        style={{width: 300, height: 300}}
      />
    </ColorMatrix>
  );
  /* 
  if (!image) return null; */

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
      }}>
      <ScrollView>
        <Image
          source={require('./image.png')}
          style={{
            width: 300,
            height: 300,
          }}
          resizeMode="contain"
        />

        {/*  <Canvas
        style={{
          width: 300,
          height: 200,
        }}>
        <Group
          transform={[
            {
              scale: 1 / pixelRatio,
            },
          ]}>
          <Group
            clip={{
              rect: {
                x: 0,
                y: 0,
                width: 300,
                height: 200,
              },
            }}
            transform={[
              {
                scale: pixelRatio,
              },
            ]}>
            <Fill />
            <Shader source={shader}>
              <ImageShader
                image={image}
                x={0}
                y={0}
                width={300}
                height={200}
                fit="contain"
                sampling={
                  {
                    filter: FilterMode.Nearest,
                    mipmap: MipmapMode.Nearest,
                  }
                  // MitchellCubicSampling
                }
              />
              <ImageShader
                image={lutImage}
                x={0}
                y={0}
                width={512}
                height={512}
                fit="contain"
              />
            </Shader>
          </Group>
        </Group>
      </Canvas> */}

        <GrayscaledImage />
        <CombinedFiltersImage />
        <ColorMatrixImage />
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
