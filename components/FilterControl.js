import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {filterConfigs} from '../utils/filterConfig';
import {simpleFilterConfigs} from '../utils/simpleImageProcessor';

const FilterControl = ({navigation}) => {
  // Get saved selected camera or null for first time
  const getInitialSelectedCamera = () => {
    if (global.selectedCameraId) {
      return global.selectedCameraId;
    }
    return null;
  };

  const [selectedCamera, setSelectedCamera] = useState(
    getInitialSelectedCamera,
  );
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);

  // Mapping of filter IDs to allowed accessories
  const getFilterAccessoryMapping = () => {
    return {
      // instsq filterid - nd filter, fisheyew, star, and prism
      instsq: ['ndfilter', 'fisheyew', 'star', 'prism'],

      // grf filterid - nd filter, fisheyew, fisheyef, star and prism
      grf: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism'],

      // ir filter - same as grf filter exactly
      ir: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism'],

      // fqsr filter - none are allowed (0)
      fqsr: [],

      // dqs filter - all 6 lenses
      dqs: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism', 'flashc'],

      // original filter - all but fisheye f
      original: ['ndfilter', 'fisheyew', 'star', 'prism', 'flashc'],

      // instsqc - same as original filter
      instsqc: ['ndfilter', 'fisheyew', 'star', 'prism', 'flashc'],

      // collage filter - none are allowed (0)
      collage: [],

      // 135ne filter - same as original filter
      '135ne': ['ndfilter', 'fisheyew', 'star', 'prism', 'flashc'],

      // hoga filter - same as 135ne and original
      hoga: ['ndfilter', 'fisheyew', 'star', 'prism', 'flashc'],

      // pafr filter - none are allowed (0)
      pafr: [],

      // nt16 filter - all 6
      nt16: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism', 'flashc'],

      // classicu - all 6
      classicu: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism', 'flashc'],

      // kv88 - all 6
      kv88: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism', 'flashc'],

      // dfuns - all 6
      dfuns: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism', 'flashc'],

      // dslide - same like original
      dslide: ['ndfilter', 'fisheyew', 'star', 'prism', 'flashc'],

      // sclassic - same as original
      sclassic: ['ndfilter', 'fisheyew', 'star', 'prism', 'flashc'],

      // dexp - all 6
      dexp: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism', 'flashc'],

      // 135sr - only 1 which is flashc
      '135sr': ['flashc'],

      // s67 - same like original
      s67: ['ndfilter', 'fisheyew', 'star', 'prism', 'flashc'],

      // puli filter - prism and star and nd filter and flash c
      puli: ['prism', 'star', 'ndfilter', 'flashc'],

      // dclassic - all 6
      dclassic: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism', 'flashc'],

      // golf - none allowed (0)
      golf: [],

      // grdr - flash c and star those 2 only
      grdr: ['flashc', 'star'],

      // ccdr filter - flash c and fisheye w
      ccdr: ['flashc', 'fisheyew'],

      // dhalf filter - same as original
      dhalf: ['ndfilter', 'fisheyew', 'star', 'prism', 'flashc'],

      // cpm35 - none are allowed (0)
      cpm35: [],

      // ct2f - all 6 allowed all
      ct2f: ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism', 'flashc'],

      // instc filter - same as original
      instc: ['ndfilter', 'fisheyew', 'star', 'prism', 'flashc'],

      // both d3d and fxnr filters - prism, star, nd filter and flash c
      d3d: ['prism', 'star', 'ndfilter', 'flashc'],
      fxnr: ['prism', 'star', 'ndfilter', 'flashc'],
    };
  };

  // Function to get allowed accessories for current filter
  const getAllowedAccessories = () => {
    const mapping = getFilterAccessoryMapping();
    const currentFilter = selectedCamera;

    // If current filter is in second row, get its allowed accessories
    if (mapping[currentFilter]) {
      console.log(
        `🎯 FilterControl: Filter '${currentFilter}' allows accessories:`,
        mapping[currentFilter],
      );
      return mapping[currentFilter];
    }

    // If no mapping found, return all accessories (fallback)
    /* console.log(
      `🎯 FilterControl: No mapping found for '${currentFilter}', using all accessories as fallback`,
    );
     */
    return ['ndfilter', 'fisheyew', 'fisheyef', 'star', 'prism', 'flashc'];
  };

  // Function to get allowed fixed buttons for current filter
  const getFixedButtonMapping = () => {
    return {
      instsq: [5, 4], // Rainbow Square, Gradient Button (4th before 5th)
      grf: [6, 7, 1], // Framing, Frame Rate, Triple C
      ir: [6, 1], // Framing, Triple C
      fqsr: [], // none
      dqs: [6], // Framing only
      original: [6, 7], // Framing, Frame Rate
      instsqc: [5, 4], // Rainbow Square, Gradient Button
      collage: [], // none
      '135ne': [3], // Overlapping Squares only
      hoga: [], // none
      pafr: [1], // Triple C only
      nt16: [6, 1, 4, 7], // Framing, Triple C, Gradient, Frame Rate
      classicu: [6, 7], // Framing, Frame Rate
      kv88: [6, 1, 8], // Framing, Triple C, Halation
      dfuns: [6], // Framing only
      dslide: [5], // Rainbow Square only
      sclassic: [1, 3], // Triple C, Overlapping Squares
      '135sr': [6], // Framing only
      dexp: [6, 1, 4, 7], // Framing, Triple C, Gradient, Frame Rate
      s67: [1, 3], // Triple C, Overlapping Squares
      puli: [], // none
      dclassic: [6, 4, 7], // Framing, Gradient, Frame Rate
      golf: [1, 9, 10], // Triple C , 9 and 10
      grdr: [6], // Framing only
      ccdr: [7], // Frame Rate only
      dhalf: [3, 1], // Overlapping Squares, Triple C
      cpm35: [6, 7], // Framing, Frame Rate
      ct2f: [6, 4, 7], // Framing, Gradient, Frame Rate
      instc: [5], // Rainbow Square only
      d3d: [1, 11], // Only Triple C
      fxnr: [6], // Framing only
    };
  };

  const getAllowedFixedButtons = () => {
    const mapping = getFixedButtonMapping();
    const currentFilter = selectedCamera;

    // If current filter is in second row, get its allowed fixed buttons
    if (mapping[currentFilter]) {
      //console.log(
      //  `🎯 FilterControl: Filter '${currentFilter}' allows fixed buttons:`,
      // mapping[currentFilter],
      // );

      // Special ordering for instsq and instsqc: button 4 should come before button 5
      if (currentFilter === 'instsq' || currentFilter === 'instsqc') {
        return [4, 5]; // 4th before 5th as specified
      }

      return mapping[currentFilter];
    }

    // If no mapping found, return all fixed buttons (fallback)
    console.log(
      `🎯 FilterControl: No mapping found for '${currentFilter}', using all fixed buttons as fallback`,
    );
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  };

  // Initialize active filters based on selected camera
  useEffect(() => {
    if (selectedCamera) {
      console.log(
        'FilterControl: Initializing active filters with selected camera:',
        selectedCamera,
      );
      setActiveFilters([selectedCamera]);
      global.activeFilters = [selectedCamera];
    } else {
      // If no camera selected, use default
      const defaultCamera = getDefaultCamera();
      if (defaultCamera) {
        console.log(
          'FilterControl: Using default camera for active filters:',
          defaultCamera,
        );
        setSelectedCamera(defaultCamera);
        setActiveFilters([defaultCamera]);
        global.activeFilters = [defaultCamera];
        global.selectedCameraId = defaultCamera;
      }
    }
  }, [selectedCamera]);

  // Sync with global state on mount
  useEffect(() => {
    console.log('FilterControl: Component mounted, syncing with global state');
    console.log('Global active filters:', global.activeFilters);
    console.log('Global selected camera:', global.selectedCameraId);

    if (global.activeFilters && global.activeFilters.length > 0) {
      setActiveFilters(global.activeFilters);
      const filterId = global.activeFilters[0];
      setSelectedCamera(filterId);
      console.log('FilterControl: Synced with global active filter:', filterId);
    }
  }, []);

  // Function to get default camera (prioritize accessories, then second row)
  const getDefaultCamera = () => {
    const {firstRow, secondRow, selectedAccessories} = buildCameraModes();

    // First priority: accessories
    if (selectedAccessories && selectedAccessories.length > 0) {
      return selectedAccessories[0].id;
    }

    // Second priority: second row cameras
    if (secondRow && secondRow.length > 0) {
      return secondRow[0].id;
    }

    // Third priority: first row cameras
    if (firstRow && firstRow.length > 0) {
      return firstRow[0].id;
    }

    return null;
  };

  const openCamerasScreen = () => {
    navigation.navigate('CamerasScreen');
  };

  // Function to handle camera selection/deselection in FilterControl
  const handleCameraToggle = cameraId => {
    // Toggle local selection state
    const newSelectedCamera = selectedCamera === cameraId ? null : cameraId;
    setSelectedCamera(newSelectedCamera);

    // Save selected camera globally for persistence
    global.selectedCameraId = newSelectedCamera;

    // ALSO SET THIS CAMERA AS THE ACTIVE FILTER
    if (newSelectedCamera) {
      console.log(
        'FilterControl: Setting camera as active filter:',
        newSelectedCamera,
      );
      setActiveFilters([newSelectedCamera]);
      global.activeFilters = [newSelectedCamera];
      console.log(
        'FilterControl: Global active filters set to:',
        global.activeFilters,
      );
    } else {
      // If deselecting, clear active filters
      setActiveFilters([]);
      global.activeFilters = [];
    }

    // Update CamerasScreen selection if global function exists
    if (global.updateCameraSelection) {
      global.updateCameraSelection(cameraId);
    }
  };

  // Function to toggle filter and camera selection
  const handleFilterToggle = accessoryId => {
    // Only ONE filter should be active at a time
    const newFilters = [accessoryId]; // Replace with only the selected one

    console.log('FilterControl: Selecting filter', accessoryId);
    console.log('FilterControl: New filters array', newFilters);

    setActiveFilters(newFilters);
    global.activeFilters = newFilters; // Save globally

    console.log(
      'FilterControl: Global active filters set to',
      global.activeFilters,
    );

    // Set this accessory as the selected camera
    setSelectedCamera(accessoryId);
    global.selectedCameraId = accessoryId;
  };

  // Debug function to force set GR F filter
  const forceSetGRF = () => {
    console.log('FilterControl: Force setting GR F filter');
    setActiveFilters(['grf']);
    global.activeFilters = ['grf'];
    setSelectedCamera('grf');
    global.selectedCameraId = 'grf';
    console.log('FilterControl: GR F filter force set');
  };

  // Get camera data from CamerasScreen
  const getCameraData = () => {
    if (global.getCameraDataForFilterControl) {
      const dynamicData = global.getCameraDataForFilterControl();
      // Only use dynamic data if it has actual content
      if (
        dynamicData.cameraCategories &&
        dynamicData.cameraCategories.length > 0
      ) {
        return dynamicData;
      }
    }

    // Use static data as fallback, but with saved selections if available
    const fallbackData = {...staticCameraData};
    if (global.userCameraSelections) {
      fallbackData.selectedCameras = global.userCameraSelections;
    }

    return fallbackData;
  };

  // State to track camera data and force re-renders
  const [cameraData, setCameraData] = useState(() => {
    const data = getCameraData();
    return data || staticCameraData; // Ensure we always have valid data
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Create static camera data as fallback
  const staticCameraData = {
    cameraCategories: [
      {
        title: 'VIDEO',
        cameras: [
          {
            id: 'vclassic',
            name: 'V Classic',
            icon: require('../src/assets/cameras/vclassic.png'),
          },
          {
            id: 'originalv',
            name: 'Original V',
            icon: require('../src/assets/cameras/originalv.png'),
          },
          {
            id: 'dam',
            name: 'DAM',
            icon: require('../src/assets/cameras/dam.png'),
          },
          {
            id: '16mm',
            name: '16mm',
            icon: require('../src/assets/cameras/16mm.png'),
          },
          {
            id: '8mm',
            name: '8mm',
            icon: require('../src/assets/cameras/8mm.png'),
          },
          {
            id: 'vhs',
            name: 'VHS',
            icon: require('../src/assets/cameras/vhs.png'),
          },
          {
            id: 'kino',
            name: 'Kino',
            icon: require('../src/assets/cameras/kino.png'),
          },
          {
            id: 'instss',
            name: 'Inst SS',
            icon: require('../src/assets/cameras/instss.png'),
          },
          {
            id: 'dcr',
            name: 'DCR',
            icon: require('../src/assets/cameras/dcr.png'),
          },
        ],
      },
      {
        title: 'DIGITAL',
        cameras: [
          {
            id: 'original',
            name: 'Original',
            icon: require('../src/assets/cameras/original.png'),
          },
          {
            id: 'grdr',
            name: 'GRD R',
            icon: require('../src/assets/cameras/grdr.png'),
          },
          {
            id: 'ccdr',
            name: 'CCD R',
            icon: require('../src/assets/cameras/ccdr.png'),
          },
          {
            id: 'collage',
            name: 'Collage',
            icon: require('../src/assets/cameras/collage.png'),
          },
          {
            id: 'puli',
            name: 'Puli',
            icon: require('../src/assets/cameras/puli.png'),
          },
          {
            id: 'fxnr',
            name: 'FXN R',
            icon: require('../src/assets/cameras/fxnr.png'),
          },
        ],
      },
      {
        title: 'VINTAGE 135',
        cameras: [
          {
            id: 'dclassic',
            name: 'D Classic',
            icon: require('../src/assets/cameras/dclassic.png'),
          },
          {
            id: 'grf',
            name: 'GR F',
            icon: require('../src/assets/cameras/grf.png'),
          },
          {
            id: 'ct2f',
            name: 'CT2F',
            icon: require('../src/assets/cameras/ct2f.png'),
          },
          {
            id: 'dexp',
            name: 'D Exp',
            icon: require('../src/assets/cameras/dexp.png'),
          },
          {
            id: 'nt16',
            name: 'NT16',
            icon: require('../src/assets/cameras/nt16.png'),
          },
          {
            id: 'd3d',
            name: 'D3D',
            icon: require('../src/assets/cameras/d3d.png'),
          },
          {
            id: '135ne',
            name: '135 NE',
            icon: require('../src/assets/cameras/135ne.png'),
          },
          {
            id: 'dfuns',
            name: 'D FunS',
            icon: require('../src/assets/cameras/dfuns.png'),
          },
          {id: 'ir', name: 'IR', icon: require('../src/assets/cameras/ir.png')},
          {
            id: 'classicu',
            name: 'Classic U',
            icon: require('../src/assets/cameras/classicu.png'),
          },
          {
            id: 'golf',
            name: 'Golf',
            icon: require('../src/assets/cameras/golf.png'),
          },
          {
            id: 'cpm35',
            name: 'CPM35',
            icon: require('../src/assets/cameras/cmp35.png'),
          },
          {
            id: '135sr',
            name: '135 SR',
            icon: require('../src/assets/cameras/135sr.png'),
          },
          {
            id: 'dhalf',
            name: 'D Half',
            icon: require('../src/assets/cameras/dhalf.png'),
          },
          {
            id: 'dslide',
            name: 'D Slide',
            icon: require('../src/assets/cameras/dslide.png'),
          },
        ],
      },
      {
        title: 'VINTAGE 120',
        cameras: [
          {
            id: 'sclassic',
            name: 'S Classic',
            icon: require('../src/assets/cameras/sclassic.png'),
          },
          {
            id: 'hoga',
            name: 'HOGA',
            icon: require('../src/assets/cameras/hoga.png'),
          },
          {
            id: 's67',
            name: 'S 67',
            icon: require('../src/assets/cameras/s67.png'),
          },
          {
            id: 'kv88',
            name: 'KV88',
            icon: require('../src/assets/cameras/kv88.png'),
          },
        ],
      },
      {
        title: 'INST COLLECTION',
        cameras: [
          {
            id: 'instc',
            name: 'Inst C',
            icon: require('../src/assets/cameras/instc.png'),
          },
          {
            id: 'instsqc',
            name: 'Inst SQC',
            icon: require('../src/assets/cameras/instsqc.png'),
          },
          {
            id: 'pafr',
            name: 'PAF R',
            icon: require('../src/assets/cameras/pafr.png'),
          },
        ],
      },
      {
        title: 'ACCESSORY',
        accessories: [
          {
            id: 'fisheyew',
            name: 'Fisheye W',
            icon: require('../src/assets/accessory/fisheyew.png'),
          },
          {
            id: 'star',
            name: 'Star',
            icon: require('../src/assets/accessory/star.png'),
          },
          {
            id: 'prism',
            name: 'Prism',
            icon: require('../src/assets/accessory/prism.png'),
          },
          {
            id: 'fisheyef',
            name: 'Fisheye F',
            icon: require('../src/assets/accessory/fisheyef.png'),
          },
          {
            id: 'ndfilter',
            name: 'ND Filter',
            icon: require('../src/assets/accessory/ndfilter.png'),
          },
          {
            id: 'flashc',
            name: 'Flash C',
            icon: require('../src/assets/accessory/flashc.png'),
          },
        ],
      },
    ],
    selectedCameras: [
      'original',
      'grdr',
      'ccdr',
      'collage',
      'puli',
      'fxnr',
      'vclassic',
      'originalv',
      'dam',
      '16mm',
      '8mm',
      'vhs',
      'kino',
      'instss',
      'dcr',
      'dclassic',
      'grf',
      'ct2f',
      'dexp',
      'nt16',
      'd3d',
      '135ne',
      'dfuns',
      'ir',
      'classicu',
      'golf',
      'cpm35',
      '135sr',
      'dhalf',
      'dslide',
      'sclassic',
      'hoga',
      's67',
      'kv88',
      'instc',
      'instsqc',
      'pafr',
      'ndfilter',
      'fisheyef',
      'fisheyew',
      'prism',
      'flashc',
      'star',
    ],
    cameraIcons: {},
  };

  const {
    cameraCategories = [],
    selectedCameras = [],
    cameraIcons = {},
  } = cameraData || {};

  // Build camera modes based on requirements
  const buildCameraModes = () => {
    const firstRow = []; // VIDEO section cameras only (selected)
    const secondRow = []; // All sections except VIDEO and ACCESSORY (selected)
    const selectedAccessories = []; // Selected accessories for circle buttons

    // Check if cameraCategories exists and is an array
    if (!cameraCategories || !Array.isArray(cameraCategories)) {
      return {firstRow, secondRow, selectedAccessories};
    }

    // Find VIDEO section and add only selected cameras
    const videoSection = cameraCategories.find(cat => cat.title === 'VIDEO');
    if (videoSection && videoSection.cameras) {
      videoSection.cameras.forEach(camera => {
        if (selectedCameras && selectedCameras.includes(camera.id)) {
          firstRow.push(camera);
        }
      });
    }

    // Add selected cameras from all other sections except VIDEO and ACCESSORY
    cameraCategories.forEach(category => {
      if (category.title !== 'VIDEO' && category.title !== 'ACCESSORY') {
        if (category.cameras) {
          category.cameras.forEach(camera => {
            if (selectedCameras && selectedCameras.includes(camera.id)) {
              secondRow.push(camera);
            }
          });
        }
      }
    });

    // Get selected accessories from CamerasScreen (these are available for selection)
    const accessorySection = cameraCategories.find(
      cat => cat.title === 'ACCESSORY',
    );
    if (accessorySection && accessorySection.accessories) {
      accessorySection.accessories.forEach(accessory => {
        if (selectedCameras && selectedCameras.includes(accessory.id)) {
          selectedAccessories.push(accessory);
        }
      });
    } else {
      // Fallback: if no accessory section found, create default accessories
      const defaultAccessories = [
        {
          id: 'fisheyef',
          name: 'Fisheye F',
          icon: require('../src/assets/accessory/fisheyef.png'),
        },
        {
          id: 'fisheyew',
          name: 'Fisheye W',
          icon: require('../src/assets/accessory/fisheyew.png'),
        },
        {
          id: 'ndfilter',
          name: 'ND Filter',
          icon: require('../src/assets/accessory/ndfilter.png'),
        },
        {
          id: 'prism',
          name: 'Prism',
          icon: require('../src/assets/accessory/prism.png'),
        },
        {
          id: 'flashc',
          name: 'Flash C',
          icon: require('../src/assets/accessory/flashc.png'),
        },
        {
          id: 'star',
          name: 'Star',
          icon: require('../src/assets/accessory/star.png'),
        },
      ];

      defaultAccessories.forEach(accessory => {
        if (selectedCameras && selectedCameras.includes(accessory.id)) {
          selectedAccessories.push(accessory);
        }
      });
    }

    return {firstRow, secondRow, selectedAccessories};
  };

  const {firstRow, secondRow, selectedAccessories} = buildCameraModes();

  // Function to get the icon of the selected camera
  const getSelectedCameraIcon = () => {
    if (!selectedCamera) return null;

    // Search in first row (VIDEO cameras)
    const videoCamera = firstRow.find(camera => camera.id === selectedCamera);
    if (videoCamera) return videoCamera.icon;

    // Search in second row (other cameras)
    const otherCamera = secondRow.find(camera => camera.id === selectedCamera);
    if (otherCamera) return otherCamera.icon;

    // Search in accessories
    const accessory = selectedAccessories.find(
      acc => acc.id === selectedCamera,
    );
    if (accessory) return accessory.icon;

    return null;
  };

  // Function to refresh camera data
  const refreshCameraData = () => {
    const newData = getCameraData();
    setCameraData(newData);
    setRefreshKey(prev => prev + 1);
  };

  // Add useEffect to ensure data is loaded and refresh periodically
  useEffect(() => {
    // Set data as loaded since we have static fallback
    setDataLoaded(true);

    // Initialize global state if not already set
    console.log(
      'FilterControl: Initializing filters, current global state:',
      global.activeFilters,
    );

    if (!global.activeFilters) {
      // Only set ONE filter as active (the selected camera)
      global.activeFilters = ['ndfilter']; // Default to ND Filter
      console.log(
        'FilterControl: Set initial global filters:',
        global.activeFilters,
      );
      setActiveFilters(global.activeFilters);
    } else {
      console.log(
        'FilterControl: Using existing global filters:',
        global.activeFilters,
      );
      setActiveFilters(global.activeFilters);
    }

    // Force immediate data refresh
    const immediateRefresh = () => {
      refreshCameraData();
      // Force a re-render to ensure accessories are shown
      setRefreshKey(prev => prev + 1);
    };

    // Refresh data immediately and after a short delay
    immediateRefresh();
    setTimeout(immediateRefresh, 50);
    setTimeout(immediateRefresh, 200);

    // Set default camera only on first time (no saved camera)
    if (!selectedCamera && !global.selectedCameraId) {
      const defaultCamera = getDefaultCamera();
      if (defaultCamera) {
        setSelectedCamera(defaultCamera);
        global.selectedCameraId = defaultCamera;
      }
    }

    // Set up interval to check for updates every 100ms for better responsiveness
    const interval = setInterval(() => {
      refreshCameraData();
    }, 100);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Set default camera when data is available (only on first time)
  useEffect(() => {
    if (dataLoaded && !selectedCamera && !global.selectedCameraId) {
      const defaultCamera = getDefaultCamera();
      if (defaultCamera) {
        setSelectedCamera(defaultCamera);
        global.selectedCameraId = defaultCamera;
      }
    }
  }, [dataLoaded, cameraData]);

  const openSubscription = () => {
    navigation.navigate('Subscription');
  };
  const openSample = () => {
    navigation.navigate('Sample');
  };

  const renderCameraItem = (item, isSelected, onPress) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.cameraItem, isSelected && styles.selectedCameraItem]}
      onPress={onPress}>
      <View
        style={[styles.cameraIcon, isSelected && styles.selectedCameraIcon]}>
        {/* Use the actual camera icon from CamerasScreen */}
        {item.icon ? (
          <Image
            source={item.icon}
            style={[
              styles.cameraIconImage,
              (item.id === 'original' || item.id === 'sclassic') && {
                marginTop: 9,
                height: 50,
                width: 32,
                zIndex: 9999,
                borderTopLeftRadius: 9,
                borderTopRightRadius: 9,
              },
            ]}
          />
        ) : (
          <Text style={styles.cameraIconText}>📷</Text>
        )}
      </View>
      <View style={styles.cameraNameContainer}>
        <Text
          style={[styles.cameraName, isSelected && styles.selectedCameraName]}>
          {item.name || 'Camera'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Banner */}
      <TouchableOpacity style={styles.banner} onPress={openSubscription}>
        <LinearGradient
          colors={['#007AFF', '#FF3B30']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.gradientBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerLeft}>
              <Image
                source={require('../src/assets/icons/logo-main.png')}
                style={styles.bannerLogo}
              />
              <TouchableOpacity
                style={styles.bannerText}
                onPress={openSubscription}>
                <Text style={styles.bannerTitle}>Dazz Pro</Text>
                <Text style={styles.bannerSubtitle}>
                  Unlock all Cameras & Accessories.
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Sample and Menu Icons */}
      <View style={styles.topIcons}>
        <TouchableOpacity style={styles.sampleContainer} onPress={openSample}>
          {selectedCamera ? (
            // Show selected camera icon
            <Image
              source={getSelectedCameraIcon()}
              style={styles.selectedCameraIconSample}
            />
          ) : (
            // Show default fire icon if no camera selected
            <Text style={styles.sampleIcon}>🔥</Text>
          )}
          <Text style={styles.sampleText}>SAMPLE</Text>
        </TouchableOpacity>
        <View style={styles.menuIcons}>
          <TouchableOpacity style={styles.menuIcon} onPress={openCamerasScreen}>
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartIcon}>
            <Image
              source={require('../src/assets/icons/Liit.png')}
              style={styles.liitIcon}
            />
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.menuIcon} onPress={forceSetGRF}>
            <Text style={styles.menuIconText}>⚫</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Camera Modes Grid */}
      <View style={styles.cameraGrid}>
        {/* First Row - VIDEO section cameras */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cameraRowScrollContainer}>
          <View
            style={[
              styles.cameraRow,
              {
                borderBottomWidth: 1.5,
                borderBottomColor: 'rgb(35, 35, 35)',
                paddingBottom: 24,
              },
            ]}>
            {firstRow && firstRow.length > 0 && dataLoaded
              ? firstRow.map(camera =>
                  renderCameraItem(camera, selectedCamera === camera.id, () =>
                    handleCameraToggle(camera.id),
                  ),
                )
              : null}
          </View>
        </ScrollView>

        {/* Second Row - All sections except VIDEO and ACCESSORY */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cameraRowScrollContainer}>
          <View
            style={[
              styles.cameraRow,
              {
                marginTop: -13,
                marginBottom: -15,
                borderBottomWidth: 1.5,
                borderBottomColor: 'rgb(35, 35, 35)',
                paddingBottom: 24,
              },
            ]}>
            {secondRow && secondRow.length > 0 && dataLoaded
              ? secondRow.map(camera =>
                  renderCameraItem(camera, selectedCamera === camera.id, () =>
                    handleCameraToggle(camera.id),
                  ),
                )
              : null}
          </View>
        </ScrollView>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomScrollContainer}
          style={{flexGrow: 0}}>
          <View style={[styles.circularButtons]}>
            {/* Accessory Icons - Shows filtered accessories based on current 2nd row filter selection */}
            {selectedAccessories && selectedAccessories.length > 0 ? (
              selectedAccessories
                .filter(accessory => {
                  const allowedAccessories = getAllowedAccessories();
                  return allowedAccessories.includes(accessory.id);
                })
                .slice(0, 6)
                .map((accessory, index) => (
                  <TouchableOpacity
                    key={accessory.id}
                    style={[
                      styles.circleButton,
                      styles.accessoryButton,
                      selectedCamera === accessory.id &&
                        styles.activeFilterButton,
                    ]}
                    onPress={() => handleFilterToggle(accessory.id)}>
                    <Image
                      source={accessory.icon}
                      style={styles.accessoryIcon}
                    />
                    {selectedCamera === accessory.id && (
                      <View style={styles.activeFilterIndicator} />
                    )}
                    {selectedCamera === accessory.id && (
                      <View style={styles.selectedCameraIndicator}>
                        <Text style={styles.selectedCameraText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))
            ) : (
              // Fallback empty buttons if no accessories selected
              <>
                <TouchableOpacity
                  style={[styles.circleButton, styles.circleButton1]}>
                  <View style={styles.circleInner} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.circleButton, styles.circleButton2]}>
                  <View style={styles.circleInner} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.circleButton, styles.circleButton4]}>
                  <View style={styles.circleInner} />
                </TouchableOpacity>
              </>
            )}

            {/* Only show divider if there are allowed accessories for current filter */}
            {getAllowedAccessories().length > 0 &&
              getAllowedFixedButtons().length > 0 && (
                <TouchableOpacity
                  style={[styles.circleDotDivider, {marginRight: 0}]}
                />
              )}

            {/* fixed 8 buttons after divider */}

            {/* Triple C Icon 1 */}
            {getAllowedFixedButtons().includes(1) && (
              <TouchableOpacity
                style={[
                  styles.circleButton,
                  styles.circleButton3,
                  {marginLeft: 10, marginRight: 0},
                ]}>
                <Image
                  source={require('../src/assets/icons/tripleC.png')}
                  style={styles.tripleCIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* FPS Icon 2 */}
          {getAllowedFixedButtons().includes(2) && (
            <TouchableOpacity style={[styles.fpsContainer, {marginLeft: 10}]}>
              <Text style={styles.fpsText}>FPS</Text>
              <Text style={styles.fpsNumber}>24</Text>
            </TouchableOpacity>
          )}

          {/* Overlapping Squares Icon 3 */}
          {getAllowedFixedButtons().includes(3) && (
            <TouchableOpacity
              onPress={() => {}}
              style={[styles.fpsContainer, {marginLeft: 10, width: 39}]}>
              <View style={styles.overlappingSquares}>
                <View style={styles.square1} />
                <View style={styles.square2} />
              </View>
            </TouchableOpacity>
          )}

          {/* FPS Icon 4 */}
          {getAllowedFixedButtons().includes(4) && (
            <TouchableOpacity
              style={{
                marginLeft: 10,
                borderRadius: 20,
                borderWidth: 1.25,
                borderColor: 'rgb(72, 72, 72)',
                width: 39,
                height: 39,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden', // Ensure gradient stays within bounds
              }}>
              <View
                style={{
                  position: 'absolute',
                  width: '78%',
                  height: '100%',
                  left: 0,
                  borderTopLeftRadius: 20,
                  borderBottomLeftRadius: 20,
                  overflow: 'hidden',
                }}>
                <LinearGradient
                  colors={[
                    'rgb(255, 165, 132)',
                    'rgb(255, 81, 17)',
                    'rgba(251, 97, 41, 0.69)',
                    'rgba(255, 107, 53, 0.3)',
                    '#000000',
                  ]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{
                    width: '90%',
                    height: '100%',
                    marginLeft: '-10%',
                  }}
                />
                {/* Black overlay to create the exact inverse curve effect */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: -6,
                    width: 16,
                    height: '100%',
                    backgroundColor: '#000000',
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: '#fff',
                  zIndex: 1,
                }}>
                10
              </Text>
            </TouchableOpacity>
          )}

          {/* Rainbow Square Outline Icon 5 */}
          {getAllowedFixedButtons().includes(5) && (
            <TouchableOpacity
              style={{
                marginLeft: 10,
                borderRadius: 20,
                borderWidth: 1.25,
                borderColor: 'rgb(72, 72, 72)',
                width: 39,
                height: 39,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                backgroundColor: '#000000',
                shadowColor: '#FFFFFF',
                shadowOpacity: 0.3,
                shadowOffset: {width: 0, height: 0},
                shadowRadius: 2,
                elevation: 2,
              }}>
              {/* Rainbow Square Outline */}
              <View
                style={{
                  width: 25,
                  height: 28,
                  borderWidth: 2.5,
                  borderRadius: 5,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                {/* Top edge - Red to Orange to Yellow */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    backgroundColor: 'rgba(255, 0, 0, 0.8)',
                  }}
                />
                <LinearGradient
                  colors={[
                    'rgba(255, 0, 0, 0.85)',
                    'rgba(255, 166, 0, 0.82)',
                    'rgba(255, 255, 0, 0.82)',
                  ]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                  }}
                />

                {/* Right edge - Yellow to Green to Blue */}
                <LinearGradient
                  colors={[
                    'rgba(255, 255, 0, 0.82)',
                    'rgba(0, 255, 0, 0.84)',
                    'rgba(0, 128, 255, 0.82)',
                  ]}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 2.5,
                  }}
                />

                {/* Bottom edge - Blue to Purple to Magenta */}
                <LinearGradient
                  colors={[
                    'rgba(0, 128, 255, 0.81)',
                    'rgba(128, 0, 255, 0.8)',
                    'rgba(255, 0, 255, 0.81)',
                  ]}
                  start={{x: 1, y: 0}}
                  end={{x: 0, y: 0}}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                  }}
                />

                {/* Left edge - Magenta to Red */}
                <LinearGradient
                  colors={['rgba(255, 0, 255, 0.83)', 'rgba(255, 0, 0, 0.8)']}
                  start={{x: 0, y: 1}}
                  end={{x: 0, y: 0}}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 2.5,
                  }}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Framing/Screen Selection Icon 6 */}
          {getAllowedFixedButtons().includes(6) && (
            <TouchableOpacity
              style={{
                marginLeft: 10,
                borderRadius: 20,
                borderWidth: 1.25,
                borderColor: 'rgb(72, 72, 72)',
                width: 39,
                height: 39,
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                backgroundColor: '#000000',
                shadowColor: '#FFFFFF',
                shadowOpacity: 0.3,
                shadowOffset: {width: 0, height: 0},
                shadowRadius: 2,
                elevation: 2,
              }}>
              {/* Framing/Screen Selection Icon */}
              <View
                style={{
                  width: 22,
                  height: 15,
                  borderWidth: 1.25,
                  borderColor: 'rgba(250, 250, 250, 0.9)',
                  borderRadius: 2,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  position: 'relative',
                }}>
                {/* Top-right corner bracket */}
                <View
                  style={{
                    position: 'absolute',
                    top: 1.75,
                    right: 1.75,
                    width: 4,
                    height: 4,
                    borderTopWidth: 1.25,
                    borderRightWidth: 1.25,
                    borderTopColor: 'rgba(250, 250, 250, 0.9)',
                    borderRightColor: 'rgba(255, 255, 255, 0.9)',
                  }}
                />
                {/* Bottom-left corner bracket */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 1.75,
                    left: 1.75,
                    width: 4,
                    height: 4,
                    borderBottomWidth: 1.25,
                    borderLeftWidth: 1.25,
                    borderBottomColor: 'rgba(255, 255, 255, 0.9)',
                    borderLeftColor: 'rgba(255, 255, 255, 0.9)',
                  }}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Frame Rate Icon 7 */}
          {getAllowedFixedButtons().includes(7) && (
            <TouchableOpacity
              style={{
                marginLeft: 10,
                borderRadius: 20,
                borderWidth: 1.25,
                borderColor: 'rgb(72, 72, 72)',
                width: 39,
                height: 39,
                justifyContent: 'center',
                paddingLeft: 2,
                alignItems: 'center',
                overflow: 'hidden',
                backgroundColor: '#000000',
                shadowColor: '#FFFFFF',
                shadowOpacity: 0.3,
                shadowOffset: {width: 0, height: 0},
                shadowRadius: 2,
                elevation: 2,
              }}>
              {/* Disabled "31" Frame Rate Icon */}
              <View
                style={{
                  position: 'relative',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {/* "31" Text */}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    fontFamily: 'Courier New',
                    letterSpacing: 1,
                  }}>
                  31
                </Text>
                {/* Diagonal Slash */}
                <View
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 19,
                    height: 2,
                    backgroundColor: '#FFFFFF',
                    transform: [
                      {rotate: '45deg'},
                      {translateX: -15},
                      {translateY: 13.75},
                    ],
                  }}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Halation Icon 8 */}
          {getAllowedFixedButtons().includes(8) && (
            <TouchableOpacity
              style={{
                marginLeft: 10,
                borderRadius: 20,
                borderWidth: 1.25,
                borderColor: 'rgb(72, 72, 72)',
                width: 39,
                height: 39,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: ' #000000',
                shadowColor: '#FFFFFF',
                shadowOpacity: 0.3,
                shadowOffset: {width: 0, height: 0},
                shadowRadius: 2,
                elevation: 2,
              }}>
              {/* Central White Circle */}
              <View
                style={{
                  width: 9.7,
                  height: 9.7,
                  borderRadius: 6,
                  backgroundColor: '#FFFFFF',
                  shadowColor: '#FFFFFF',
                  shadowOpacity: 0.3,
                  shadowOffset: {width: 0, height: 0},
                  shadowRadius: 2,
                  zIndex: 2,
                }}
              />
              {/* Red Glow Ring */}
              <View
                style={{
                  position: 'absolute',
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 0, 0, 0.3)',
                  shadowColor: '#FF0000',
                  shadowOpacity: 0.9,
                  shadowOffset: {width: 0, height: 0},
                  shadowRadius: 12,
                  elevation: 3,
                  zIndex: 1,
                }}
              />
            </TouchableOpacity>
          )}

          {/* speedometer Icon 9 */}
          {getAllowedFixedButtons().includes(9) && (
            <TouchableOpacity
              style={{
                marginLeft: 10,
                width: 39,
                height: 39,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 20,
                borderWidth: 1.25,
                borderColor: 'rgb(72, 72, 72)',
              }}>
              <Image
                source={require('../src/assets/icons/speedometer.png')}
                style={{width: 20, height: 20, tintColor: '#fff'}}
              />
            </TouchableOpacity>
          )}

          {/* background Icon 10 */}
          {getAllowedFixedButtons().includes(10) && (
            <TouchableOpacity
              style={{
                marginLeft: 10,
                width: 39,
                height: 39,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 20,
                borderWidth: 1.25,
                borderColor: 'rgb(72, 72, 72)',
              }}>
              <Image
                source={require('../src/assets/icons/background.png')}
                style={{width: 20, height: 20, tintColor: '#fff'}}
              />
            </TouchableOpacity>
          )}

          {/* zoom inspect icon 11 */}
          {getAllowedFixedButtons().includes(11) && (
            <TouchableOpacity
              style={{
                marginLeft: 10,
                width: 39,
                height: 39,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 20,
                borderWidth: 1.25,
                borderColor: 'rgb(72, 72, 72)',
              }}>
              <Image
                source={require('../src/assets/icons/zoom.png')}
                style={{width: 20, height: 20, tintColor: '#fff'}}
              />
            </TouchableOpacity>
          )}

          {/* Fixed Buttons Section End */}
        </ScrollView>
      </View>
      {/* Chevron Down */}
      <TouchableOpacity
        style={styles.chevronContainer}
        onPress={() => {
          navigation.goBack();
        }}>
        <Image
          style={styles.backButton}
          source={require('../src/assets/icons/arrow-down.png')}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  banner: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 60,
  },
  gradientBanner: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: 'contain',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  bannerText: {
    flexDirection: 'column',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  bannerArrow: {
    width: 30,
    height: 30,
    marginRight: -10,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  arrowText: {
    color: 'rgba(111, 111, 111, 0.8)',
    fontSize: 26,
    fontWeight: 'bold',
  },
  topIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginTop: 120,
  },
  sampleContainer: {
    flexDirection: 'row',
    marginLeft: 180,
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgb(53, 53, 53)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    marginRight: 15,
  },
  sampleIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  selectedCameraIconSample: {
    width: 16,
    height: 16,
    marginRight: 5,
    resizeMode: 'contain',
  },
  sampleText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '600',
  },
  menuIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    borderWidth: 1,
    borderColor: 'rgb(53, 53, 53)',
    marginRight: 15,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingTop: 2,
  },
  menuIconText: {
    color: '#fff',
    fontSize: 18,
  },
  backButton: {
    marginTop: 17,
    marginLeft: 0,
    width: 18,
    height: 18,
    zIndex: 1000,
    borderRadius: 50,
    tintColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartIcon: {
    marginRight: 5,
  },
  liitIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: 'rgb(53, 53, 53)',
  },
  cameraGrid: {
    minHeight: 220,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  cameraRow: {
    height: 90,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  cameraRowScrollContainer: {
    paddingHorizontal: 20,
    paddingLeft: -40,
    paddingRight: -40,
  },
  cameraItem: {
    alignItems: 'center',
    width: 80,
    marginHorizontal: 0,
    paddingBottom: 0,
  },
  selectedCameraItem: {
    opacity: 0.8,
  },
  cameraIcon: {
    width: 30,
    height: 60,
    //backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  selectedCameraIcon: {
    //backgroundColor: '#007AFF',
  },
  circleDotDivider: {
    width: 3,
    height: 3,
    backgroundColor: 'rgb(53, 53, 53)',
    borderRadius: 30,
    marginLeft: 0,
    marginRight: 0,
  },
  cameraIconImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  cameraIconText: {
    fontSize: 40,
  },
  cameraName: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCameraName: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginBottom: 25,
    marginLeft: -12,
  },
  bottomScrollContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 20,
    minWidth: '100%',
  },
  circularButtons: {
    marginTop: 0,
    marginLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 0, // Remove extra margin for consistent spacing
    zIndex: 1000,
    // minWidth will be set dynamically based on accessory count
    paddingRight: 0, // Remove extra padding for consistent spacing
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButton1: {
    backgroundColor: '#333',
  },
  circleButton2: {
    backgroundColor: '#FF3B30',
  },
  circleButton3: {
    backgroundColor: 'transparent',
  },
  circleButton4: {
    backgroundColor: '#333',
  },
  accessoryButton: {
    backgroundColor: 'transparent',
  },
  accessoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    resizeMode: 'contain',
  },
  activeFilterButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  activeFilterIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  selectedCameraIndicator: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00FF00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  selectedCameraText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  circleInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tripleCIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  fpsContainer: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginRight: 0,
    borderRadius: 50,
    borderWidth: 1.25,
    borderColor: 'rgb(72, 72, 72)',
    alignItems: 'center',
  },
  fpsText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '700',
  },
  fpsNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  overlappingSquares: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: 25,
    height: 25,
  },
  square1: {
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
    width: 21,
    height: 21,
    borderRadius: 2,
    top: 2,
    left: 2,
  },
  square2: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 2,
    top: 5,
    left: 5,
  },
  chevronContainer: {
    backgroundColor: 'rgb(29, 29, 29)',
    width: 50,
    height: 50,
    marginLeft: 312,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 17,
    marginBottom: 60,
    marginTop: -22,
    borderRadius: 50,
  },
  chevronText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
    marginTop: -5,
  },
  cameraNameContainer: {
    borderWidth: 1,
    borderColor: 'rgb(53, 53, 53)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    marginTop: -19,
  },
});

export default FilterControl;
