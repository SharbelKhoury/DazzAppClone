import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import React, {useState} from 'react';

const Settings = ({navigation}) => {
  // Toggle states for settings
  const [exportToAlbum, setExportToAlbum] = useState(false);
  const [keepOriginalPhotos, setKeepOriginalPhotos] = useState(true);
  const [saveLocation, setSaveLocation] = useState(false);
  const [mirrorFrontCamera, setMirrorFrontCamera] = useState(true);
  const [livePhotoCover, setLivePhotoCover] = useState(false);
  const [assistiveGrid, setAssistiveGrid] = useState(false);
  const [level, setLevel] = useState(false);
  const [shutterVibration, setShutterVibration] = useState(true);
  const [timestampFormat, setTimestampFormat] = useState(false);
  const [preserveSetting, setPreserveSetting] = useState(true);
  return (
    <View style={styles.container}>
      <>
        <TouchableOpacity
          style={{marginLeft: -70}}
          onPress={() => navigation.goBack()}>
          <Image
            source={require('../src/assets/icons/front-arrow.png')}
            style={{
              width: 17,
              height: 17,
              position: 'absolute',
              top: 2,
              left: -140,
              marginRight: 220,
              paddingTop: -40,
              tintColor: '#fff',
            }}
          />
        </TouchableOpacity>
        <Text style={styles.text}>Settings</Text>
      </>

      <View
        style={[styles.divider, {marginTop: 25, marginLeft: 0, width: '110%'}]}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.settingsContainer}>
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text}>Dazz Pro</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={styles.arrowIcon}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Restore Purchases</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={[
                  styles.arrowIcon,
                  {tintColor: 'transparent', backgroundColor: 'transparent'},
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsContainerSingular}>
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Language</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={styles.arrowIcon}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Export to Album</Text>
              <Switch
                value={exportToAlbum}
                onValueChange={setExportToAlbum}
                trackColor={{false: '#767577', true: 'rgb(255, 107, 107)'}}
                thumbColor={exportToAlbum ? '#FFFFFF' : '#f4f3f4'}
                style={styles.toggleSwitch}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Keep Original Photos</Text>
              <Switch
                value={keepOriginalPhotos}
                onValueChange={setKeepOriginalPhotos}
                trackColor={{false: '#767577', true: 'rgb(255, 107, 107)'}}
                thumbColor={keepOriginalPhotos ? '#FFFFFF' : '#f4f3f4'}
                style={styles.toggleSwitch}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Save Location</Text>
              <Switch
                value={saveLocation}
                onValueChange={setSaveLocation}
                trackColor={{false: '#767577', true: 'rgb(255, 107, 107)'}}
                thumbColor={saveLocation ? '#FFFFFF' : '#f4f3f4'}
                style={styles.toggleSwitch}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Mirror Front Camera</Text>
              <Switch
                value={mirrorFrontCamera}
                onValueChange={setMirrorFrontCamera}
                trackColor={{false: '#767577', true: 'rgb(255, 107, 107)'}}
                thumbColor={mirrorFrontCamera ? '#FFFFFF' : '#f4f3f4'}
                style={styles.toggleSwitch}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Live Photo Cover</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={styles.arrowIcon}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Assistive Grid</Text>
              <Switch
                value={assistiveGrid}
                onValueChange={setAssistiveGrid}
                trackColor={{false: '#767577', true: 'rgb(255, 107, 107)'}}
                thumbColor={assistiveGrid ? '#FFFFFF' : '#f4f3f4'}
                style={styles.toggleSwitch}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Level</Text>
              <Switch
                value={level}
                onValueChange={setLevel}
                trackColor={{false: '#767577', true: 'rgb(255, 107, 107)'}}
                thumbColor={level ? '#FFFFFF' : '#f4f3f4'}
                style={styles.toggleSwitch}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Shutter Vibration</Text>
              <Switch
                value={shutterVibration}
                onValueChange={setShutterVibration}
                trackColor={{false: '#767577', true: 'rgb(255, 107, 107)'}}
                thumbColor={shutterVibration ? '#FFFFFF' : '#f4f3f4'}
                style={styles.toggleSwitch}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Timestamp Format</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={styles.arrowIcon}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Preserve Setting</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={styles.arrowIcon}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.settingsContainerSingular}>
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Storage</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={styles.arrowIcon}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.settingsContainerSingular,
            {height: 67, backgroundColor: 'rgba(183, 37, 0, 0.49)'},
          ]}>
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Image
                source={require('../src/assets/icons/poke.png')}
                style={[
                  styles.arrowIcon,
                  {
                    width: 30,
                    height: 30,
                    tintColor: 'rgb(229, 200, 121)',
                    marginRight: 13,
                  },
                ]}
              />
              <Text style={[styles.text2, {fontSize: 12, marginRight: 40}]}>
                Photos and videos are stored within the Dazz App locally. Please
                backup when necessary.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Share with friends</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={[
                  styles.arrowIcon,
                  {tintColor: 'transparent', backgroundColor: 'transparent'},
                ]}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Send FeedBack</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={[
                  styles.arrowIcon,
                  {tintColor: 'transparent', backgroundColor: 'transparent'},
                ]}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Recommended apps</Text>
              <Switch
                value={saveLocation}
                onValueChange={setSaveLocation}
                trackColor={{false: '#767577', true: 'rgb(255, 107, 107)'}}
                thumbColor={saveLocation ? '#FFFFFF' : '#f4f3f4'}
                style={styles.toggleSwitch}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Write Review</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={[
                  styles.arrowIcon,
                  {tintColor: 'transparent', backgroundColor: 'transparent'},
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsContainerSingular}>
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Follow us on Instagram</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={[
                  styles.arrowIcon,
                  {tintColor: 'transparent', backgroundColor: 'transparent'},
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Privacy</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={[
                  styles.arrowIcon,
                  {tintColor: 'transparent', backgroundColor: 'transparent'},
                ]}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity>
            <View style={styles.settingsItem}>
              <Text style={styles.text2}>Terms of Use</Text>
              <Image
                source={require('../src/assets/icons/back-arrow.png')}
                style={[
                  styles.arrowIcon,
                  {tintColor: 'transparent', backgroundColor: 'transparent'},
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Please use the hashtag #dazzcam when you post content on social media.
        </Text>

        <Image
          source={require('../src/assets/icons/dazz-settings.png')}
          style={{
            width: 200,
            height: 110,
            marginLeft: 80,
            marginTop: 20,
            opacity: 0.4,
            marginBottom: 40,
          }}
        />
      </ScrollView>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(0,0,0)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 65,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  text2: {
    fontSize: 14,
    color: 'white',
    fontWeight: '400',
  },
  settingsContainer: {
    marginTop: 25,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  settingsContainerSingular: {
    marginTop: 25,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  settingsItem: {
    width: '100%',
    height: 46,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    width: '94%',
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    marginHorizontal: 20,
  },
  arrowIcon: {
    width: 12,
    height: 12,
    tintColor: 'white',
  },
  toggleSwitch: {
    transform: [{scaleX: 1}, {scaleY: 1}],
  },
  footerText: {
    marginTop: 20,
    marginBottom: 40,
    marginLeft: 1,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
