import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';

// Import camera icons
const cameraIcons = {
  // DIGITAL
  original: require('../src/assets/cameras/original.png'),
  grdr: require('../src/assets/cameras/grdr.png'),
  ccdr: require('../src/assets/cameras/ccdr.png'),
  collage: require('../src/assets/cameras/collage.png'),
  puli: require('../src/assets/cameras/puli.png'),
  fxnr: require('../src/assets/cameras/fxnr.png'),

  // VIDEO
  vclassic: require('../src/assets/cameras/vclassic.png'),
  originalv: require('../src/assets/cameras/originalv.png'),
  dam: require('../src/assets/cameras/dam.png'),
  '16mm': require('../src/assets/cameras/16mm.png'),
  '8mm': require('../src/assets/cameras/8mm.png'),
  vhs: require('../src/assets/cameras/vhs.png'),
  kino: require('../src/assets/cameras/kino.png'),
  instss: require('../src/assets/cameras/instss.png'),
  vfuns: require('../src/assets/cameras/vfuns.png'),
  dcr: require('../src/assets/cameras/dcr.png'),
  glow: require('../src/assets/cameras/glow.png'),
  slidep: require('../src/assets/cameras/slidep.png'),

  // VINTAGE 120
  sclassic: require('../src/assets/cameras/sclassic.png'),
  hoga: require('../src/assets/cameras/hoga.png'),
  s67: require('../src/assets/cameras/s67.png'),
  kv88: require('../src/assets/cameras/kv88.png'),

  // INST COLLECTION
  instc: require('../src/assets/cameras/instc.png'),
  instsq: require('../src/assets/cameras/instsq.png'),
  instsqc: require('../src/assets/cameras/instsqc.png'),
  pafr: require('../src/assets/cameras/pafr.png'),

  // VINTAGE 135
  dclassic: require('../src/assets/cameras/dclassic.png'),
  grf: require('../src/assets/cameras/grf.png'),
  ct2f: require('../src/assets/cameras/ct2f.png'),
  dexp: require('../src/assets/cameras/dexp.png'),
  nt16: require('../src/assets/cameras/nt16.png'),
  d3d: require('../src/assets/cameras/d3d.png'),
  '135ne': require('../src/assets/cameras/135ne.png'),
  dfuns: require('../src/assets/cameras/dfuns.png'),
  ir: require('../src/assets/cameras/ir.png'),
  classicu: require('../src/assets/cameras/classicu.png'),
  dqs: require('../src/assets/cameras/dqs.png'),
  fqsr: require('../src/assets/cameras/fqsr.png'),
  golf: require('../src/assets/cameras/golf.png'),
  cpm35: require('../src/assets/cameras/cmp35.png'),
  '135sr': require('../src/assets/cameras/135sr.png'),
  dhalf: require('../src/assets/cameras/dhalf.png'),
  dslide: require('../src/assets/cameras/dslide.png'),

  // Camera info icons
  photo: require('../src/assets/camera-info/photo.png'),
  video: require('../src/assets/camera-info/video.png'),
  filmNegatives: require('../src/assets/camera-info/film-negatives.png'),
  importPhotos: require('../src/assets/camera-info/import-photos.png'),
  videoPhotoLivephoto: require('../src/assets/camera-info/video-photo-livephoto.png'),

  // Accessory info icons
  ndFilter: require('../src/assets/accessory/ndfilter.png'),
  fisheyeF: require('../src/assets/accessory/fisheyef.png'),
  fisheyeW: require('../src/assets/accessory/fisheyew.png'),
  prism: require('../src/assets/accessory/prism.png'),
  flashC: require('../src/assets/accessory/flashc.png'),
  star: require('../src/assets/accessory/star.png'),
};

const CamerasScreen = ({navigation}) => {
  const [selectedCameras, setSelectedCameras] = useState(new Set());
  const [openModalId, setOpenModalId] = useState(null);
  const openCameraInfoModal = cameraId => {
    setOpenModalId(cameraId);
  };
  // Camera data organized by categories
  const cameraCategories = [
    {
      title: 'DIGITAL',
      cameras: [
        {
          id: 'original',
          name: 'Original',
          icon: cameraIcons.original,
          hasVideo: true,
          infoIcons: [
            cameraIcons.photo,
            cameraIcons.importPhotos,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: 'grdr',
          name: 'GRD R',
          icon: cameraIcons.grdr,
          hasVideo: true,
          infoIcons: [cameraIcons.photo, cameraIcons.filmNegatives],
        },
        {
          id: 'ccdr',
          name: 'CCD R',
          icon: cameraIcons.ccdr,
          hasVideo: true,
          infoIcons: [cameraIcons.photo, cameraIcons.filmNegatives],
        },
        {
          id: 'collage',
          name: 'Collage',
          icon: cameraIcons.collage,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'puli',
          name: 'Puli',
          icon: cameraIcons.puli,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'fxnr',
          name: 'FXN R',
          icon: cameraIcons.fxnr,
          hasVideo: true,
          infoIcons: [cameraIcons.photo, cameraIcons.filmNegatives],
        },
      ],
    },
    {
      title: 'VIDEO',
      cameras: [
        {
          id: 'vclassic',
          name: 'V Classic',
          icon: cameraIcons.vclassic,
          hasVideo: false,
          infoIcons: [
            cameraIcons.videoPhotoLivephoto,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: 'originalv',
          name: 'Original V',
          icon: cameraIcons.originalv,
          hasVideo: false,
          infoIcons: [cameraIcons.videoPhotoLivephoto],
        },
        {
          id: 'dam',
          name: 'DAM',
          icon: cameraIcons.dam,
          hasVideo: false,
          infoIcons: [cameraIcons.videoPhotoLivephoto],
        },
        {
          id: '16mm',
          name: '16mm',
          icon: cameraIcons['16mm'],
          hasVideo: false,
          infoIcons: [
            cameraIcons.videoPhotoLivephoto,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: '8mm',
          name: '8mm',
          icon: cameraIcons['8mm'],
          hasVideo: false,
          infoIcons: [
            cameraIcons.videoPhotoLivephoto,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: 'vhs',
          name: 'VHS',
          icon: cameraIcons.vhs,
          hasVideo: false,
          infoIcons: [
            cameraIcons.videoPhotoLivephoto,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: 'kino',
          name: 'Kino',
          icon: cameraIcons.kino,
          hasVideo: false,
          infoIcons: [
            cameraIcons.videoPhotoLivephoto,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: 'instss',
          name: 'Inst SS',
          icon: cameraIcons.instss,
          hasVideo: false,
          infoIcons: [cameraIcons.video, cameraIcons.filmNegatives],
        },
        {
          id: 'vfuns',
          name: 'V FunS',
          icon: cameraIcons.vfuns,
          hasVideo: false,
          infoIcons: [
            cameraIcons.videoPhotoLivephoto,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: 'dcr',
          name: 'DCR',
          icon: cameraIcons.dcr,
          hasVideo: false,
          infoIcons: [
            cameraIcons.videoPhotoLivephoto,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: 'glow',
          name: 'Glow',
          icon: cameraIcons.glow,
          hasVideo: false,
          infoIcons: [
            cameraIcons.videoPhotoLivephoto,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: 'slidep',
          name: 'Slide P',
          icon: cameraIcons.slidep,
          hasVideo: false,
          infoIcons: [cameraIcons.video, cameraIcons.filmNegatives],
        },
      ],
    },
    {
      title: 'VINTAGE 135',
      cameras: [
        {
          id: 'dclassic',
          name: 'D Classic',
          icon: cameraIcons.dclassic,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'grf',
          name: 'GR F',
          icon: cameraIcons.grf,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'ct2f',
          name: 'CT2F',
          icon: cameraIcons.ct2f,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'dexp',
          name: 'D Exp',
          icon: cameraIcons.dexp,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'nt16',
          name: 'NT16',
          icon: cameraIcons.nt16,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'd3d',
          name: 'D3D',
          icon: cameraIcons.d3d,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: '135ne',
          name: '135 NE',
          icon: cameraIcons['135ne'],
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'dfuns',
          name: 'D FunS',
          icon: cameraIcons.dfuns,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'ir',
          name: 'IR',
          icon: cameraIcons.ir,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'classicu',
          name: 'Classic U',
          icon: cameraIcons.classicu,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'dqs',
          name: 'DQS',
          icon: cameraIcons.dqs,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'fqsr',
          name: 'FQS R',
          icon: cameraIcons.fqsr,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'golf',
          name: 'Golf',
          icon: cameraIcons.golf,
          hasVideo: false,
          infoIcons: [cameraIcons.video, cameraIcons.importPhotos],
        },
        {
          id: 'cpm35',
          name: 'CPM35',
          icon: cameraIcons.cpm35,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: '135sr',
          name: '135 SR',
          icon: cameraIcons['135sr'],
          hasVideo: false,
          infoIcons: [
            cameraIcons.photo,
            cameraIcons.filmNegatives,
            cameraIcons.importPhotos,
          ],
        },
        {
          id: 'dhalf',
          name: 'D Half',
          icon: cameraIcons.dhalf,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'dslide',
          name: 'D Slide',
          icon: cameraIcons.dslide,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
      ],
    },
    {
      title: 'VINTAGE 120',
      cameras: [
        {
          id: 'sclassic',
          name: 'S Classic',
          icon: cameraIcons.sclassic,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'hoga',
          name: 'HOGA',
          icon: cameraIcons.hoga,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 's67',
          name: 'S 67',
          icon: cameraIcons.s67,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'kv88',
          name: 'KV88',
          icon: cameraIcons.kv88,
          hasVideo: true,
          infoIcons: [
            cameraIcons.photo,
            cameraIcons.importPhotos,
            cameraIcons.filmNegatives,
          ],
        },
      ],
    },
    {
      title: 'INST COLLECTION',
      cameras: [
        {
          id: 'instc',
          name: 'Inst C',
          icon: cameraIcons.instc,
          hasVideo: true,
          infoIcons: [
            cameraIcons.photo,
            cameraIcons.importPhotos,
            cameraIcons.filmNegatives,
          ],
        },
        {
          id: 'instsq',
          name: 'Inst SQ',
          icon: cameraIcons.instsq,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'instsqc',
          name: 'Inst SQC',
          icon: cameraIcons.instsqc,
          hasVideo: false,
          infoIcons: [cameraIcons.photo, cameraIcons.importPhotos],
        },
        {
          id: 'pafr',
          name: 'PAF R',
          icon: cameraIcons.pafr,
          hasVideo: true,
          infoIcons: [cameraIcons.photo, cameraIcons.filmNegatives],
        },
      ],
    },
    {
      title: 'ACCESSORY',
      accessories: [
        {
          id: 'ndfilter',
          name: 'ND Filter',
          icon: cameraIcons.ndFilter,
          hasVideo: false,
        },
        {
          id: 'fisheyef',
          name: 'Fisheye F',
          icon: cameraIcons.fisheyeF,
          hasVideo: false,
        },
        {
          id: 'fisheyew',
          name: 'Fisheye W',
          icon: cameraIcons.fisheyeW,
          hasVideo: false,
        },
        {id: 'prism', name: 'Prism', icon: cameraIcons.prism, hasVideo: false},
        {
          id: 'flashc',
          name: 'Flash C',
          icon: cameraIcons.flashC,
          hasVideo: false,
        },
        {id: 'star', name: 'Star', icon: cameraIcons.star, hasVideo: false},
      ],
    },
  ];

  const toggleCameraSelection = cameraId => {
    const newSelected = new Set(selectedCameras);
    if (newSelected.has(cameraId)) {
      newSelected.delete(cameraId);
    } else {
      newSelected.add(cameraId);
    }
    setSelectedCameras(newSelected);
  };

  const renderCameraItem = ({item, category}) => {
    const isSelected = selectedCameras.has(item.id);

    return (
      <View style={styles.cameraItem}>
        <View style={styles.cameraHeader}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              isSelected && styles.radioButtonSelected,
            ]}
            onPress={() => toggleCameraSelection(item.id)}
          />
          <Text style={styles.cameraName}>{item.name}</Text>
        </View>

        <View style={styles.cameraIconContainer}>
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>{item.icon}</Text>
          </View>

          <View style={styles.featureIcons}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📷</Text>
            </View>
            {item.hasVideo && (
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🎥</Text>
              </View>
            )}
          </View>
        </View>

        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAccessoryItem = ({item}) => {
    const isSelected = selectedCameras.has(item.id);

    return (
      <View style={styles.accessoryItem}>
        <View style={styles.accessoryIcon}>
          <Text style={styles.accessoryIconText}>{item.icon}</Text>
        </View>
        <Text style={styles.accessoryName}>{item.name}</Text>
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategory = ({item}) => {
    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>{item.title}</Text>

        <View
          style={[
            styles.cameraGrid,
            item.title === 'ACCESSORY' && styles.lastSectionGrid,
          ]}>
          {item.title === 'ACCESSORY'
            ? item.accessories.map(accessory => (
                <TouchableOpacity
                  key={accessory.id}
                  style={styles.cameraGridItem}
                  onPress={() => toggleCameraSelection(accessory.id)}>
                  <View style={styles.cameraGridIcon}>
                    {typeof accessory.icon === 'string' ? (
                      <Text style={styles.cameraGridIconText}>
                        {accessory.icon}
                      </Text>
                    ) : (
                      <Image
                        source={accessory.icon}
                        style={styles.cameraGridIconImage}
                      />
                    )}
                  </View>
                  <Text style={styles.cameraGridName}>{accessory.name}</Text>
                  {selectedCameras.has(accessory.id) && (
                    <View style={styles.selectionIndicator}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            : item.cameras.map(camera => (
                <TouchableOpacity
                  key={camera.id}
                  style={styles.cameraGridItem}
                  onPress={() => toggleCameraSelection(camera.id)}>
                  <View style={styles.cameraGridIcon}>
                    {typeof camera.icon === 'string' ? (
                      <Text style={styles.cameraGridIconText}>
                        {camera.icon}
                      </Text>
                    ) : (
                      <Image
                        source={camera.icon}
                        style={styles.cameraGridIconImage}
                      />
                    )}
                  </View>
                  <Text style={styles.cameraGridName}>
                    {camera.name.includes(' R') ? (
                      <>
                        {camera.name.split(' R')[0]}
                        <Text style={styles.specialR}> R</Text>
                      </>
                    ) : (
                      camera.name
                    )}
                  </Text>
                  {camera.infoIcons && (
                    <TouchableOpacity
                      onPress={() => openCameraInfoModal(camera.id)}
                      style={styles.infoIconsContainer}>
                      {camera.infoIcons.map((infoIcon, index) => {
                        const isCircularIcon =
                          infoIcon === cameraIcons.photo ||
                          infoIcon === cameraIcons.video ||
                          infoIcon === cameraIcons.videoPhotoLivephoto;
                        return (
                          <Image
                            key={index}
                            source={infoIcon}
                            style={[
                              styles.infoIcon,
                              isCircularIcon && styles.circularInfoIcon,
                            ]}
                          />
                        );
                      })}
                    </TouchableOpacity>
                  )}
                  {selectedCameras.has(camera.id) && (
                    <View style={styles.selectionIndicator}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <TouchableOpacity
        style={styles.backButtonContainer}
        onPress={() => navigation.goBack()}>
        <Image
          style={styles.backButton}
          source={require('../src/assets/icons/back-arrow.png')}
        />
      </TouchableOpacity>
      <View style={styles.headerSpacer} />

      {/* Camera categories list */}
      <FlatList
        data={cameraCategories}
        renderItem={renderCategory}
        keyExtractor={item => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={openModalId !== null}
        onRequestClose={() => setOpenModalId(null)}>
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          activeOpacity={1}
          onPress={() => setOpenModalId(null)}>
          <View
            style={{
              backgroundColor: 'rgb(34, 34, 34)',
              width: 270,
              height: 220,
              borderRadius: 15,
              padding: 20,
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
            <View
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: 10,
                marginLeft: 15,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.photo}
                  style={{width: 13, height: 13, borderRadius: 10}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Photo
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.video}
                  style={{width: 13, height: 13, borderRadius: 10}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Video
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.videoPhotoLivephoto}
                  style={{width: 13, height: 13, borderRadius: 10}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Video,Photo,LivePhoto
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.filmNegatives}
                  style={{width: 13, height: 13}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Import Photos
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.importPhotos}
                  style={{width: 13, height: 13}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Film Negatives
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginTop: 16,
    marginLeft: 17,
    width: 18,
    height: 18,
    zIndex: 1000,
    borderRadius: 50,
    tintColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonContainer: {
    backgroundColor: 'rgb(33, 33, 33)',
    width: 50,
    height: 50,
    borderRadius: 50,
    position: 'absolute',
    right: 40,
    bottom: 70,
    zIndex: 1000,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    height: 40,
  },
  listContainer: {
    paddingBottom: 20,
  },
  categoryContainer: {
    marginBottom: 30,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  cameraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    gap: 10,
  },
  lastSectionGrid: {
    marginBottom: 100,
  },
  cameraGridItem: {
    width: '30%',
    height: 164,
    alignItems: 'center',
    marginBottom: 15,
    marginHorizontal: 2,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingTop: 40,
  },
  cameraGridIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cameraGridIconText: {
    fontSize: 24,
  },
  cameraGridIconImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
    resizeMode: 'contain',
  },
  cameraGridName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    fontWeight: 'bold',
  },
  infoIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    gap: 5,
  },
  infoIcon: {
    width: 13,
    height: 13,
    paddingHorizontal: 9,
    resizeMode: 'contain',
  },
  circularInfoIcon: {
    borderRadius: 20,
  },
  specialR: {
    color: 'rgb(64, 62, 206)',
    fontWeight: '900',
    fontSize: 13,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CamerasScreen;
