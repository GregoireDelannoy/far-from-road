import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { useState, useRef } from 'react';
import { BarLoader } from 'react-spinners';

import logo from './img/logo.svg';
import { WorkerToMainMessage } from './WorkerMessages';
import { Map } from './Map';
import type { MapMarkerProps, ImageOverlayProps } from './Map';
import { geometryToBbox, geometryToEnlargedBbox, isValidHttpUrl } from './helpers';
import ButtonSection from './ButtonSection';

enum AppState {
  SelectShapes, // Nothing is selected on map, user has to click in leaflet to draw
  LoadFeatures, // A polygon is drawn, enable button to download features
  WaitFeatures, // Features are being downloaded. Only user action = remove polygon
  Search, // Features are downloaded, search button is enabled
  WaitSearch, // Search and flood fill display are ongoing. Only user action = remove polygon
}

function AppHeader() {
  return (
    <div className='flex w-screen'>
      <div className='m-auto grid grid-cols-2 gap-4 max-w-3xl'>
        <img className='max-h-[4rem] max-w-[30vw]' src={logo} alt='Logo' />
        <div className='flex justify-center items-center'>
          <span className='font-bold text-l'>Escape the crowd</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.SelectShapes);
  const [loading, setLoading] = useState(false);
  const selectedShape = useRef<Geometry>();
  const roads = useRef<Geometry[]>([]);
  const waters = useRef<Geometry[]>([]);
  const [mapMarker, setMapMarker] = useState<MapMarkerProps>({ position: [], content: '' });
  const [imageOverlay, setImageOverlay] = useState<ImageOverlayProps>({ url: '', topLeftCorner: [], bottomRightCorner: [] });
  const API_URL = process.env.REACT_APP_API_URL;

  if (!API_URL || !isValidHttpUrl(API_URL)) {
    console.error('false API_URL environnement variable');
  }

  function stateSelectShapes() {
    setAppState(AppState.SelectShapes);
    setMapMarker({ position: [], content: '' });
    waters.current = [];
    roads.current = [];
  }

  function stateLoadFeatures() {
    setAppState(AppState.LoadFeatures);
    waters.current = [];
    roads.current = [];
  }

  function stateWaitFeatures() {
    setAppState(AppState.WaitFeatures);
    waters.current = [];
    roads.current = [];
    setLoading(true);
  }

  function stateSearch() {
    setAppState(AppState.Search);
    setLoading(false);
  }

  function stateSearching() {
    setAppState(AppState.WaitSearch);
    setLoading(true);
  }

  function onMapFeaturesChange(features: FeatureCollection<Geometry, GeoJsonProperties>) {
    if (features.features.length) {
      selectedShape.current = features.features[0].geometry;
      stateLoadFeatures();
    } else {
      selectedShape.current = undefined;
      stateSelectShapes();
    }
  }

  function onClickLoadFeatures() {
    if (selectedShape.current && selectedShape.current.type === 'Polygon') {
      stateWaitFeatures();
      const roadQueryParameters = Object.entries(geometryToEnlargedBbox(selectedShape.current))
        .map(kv => `${kv[0]}=${kv[1]}`)
        .reduce((a, b) => a + '&' + b);
      const watersQueryParameters = Object.entries(geometryToBbox(selectedShape.current))
        .map(kv => `${kv[0]}=${kv[1]}`)
        .reduce((a, b) => a + '&' + b);

      Promise.all([
        fetch(`${API_URL}/roads?${roadQueryParameters}`)
          .then(res => res.json())
          .then((res) => {
            roads.current = res;
          },
            (error) => {
              console.error(error);
              alert('There has been an error downloading roads. Check console.');
            }),
        fetch(`${API_URL}/waters?${watersQueryParameters}`)
          .then(res => res.json())
          .then((res) => {
            waters.current = res;
          },
            (error) => {
              console.error(error);
              alert('There has been an error downloading waters. Check console.');
            })
      ]).then(() => {
        stateSearch();
      });
    }
  }

  function onClickSearch() {
    if (selectedShape.current && selectedShape.current.type === 'Polygon') {
      stateSearching();
      const bbox = geometryToEnlargedBbox(selectedShape.current);
      const worker = new Worker(new URL('./searchFarthestPoint.worker.ts', import.meta.url));
      worker.onmessage = (e: MessageEvent<WorkerToMainMessage>) => {
        if (e.data.isFinalResult) {
          setImageOverlay({
            url: '',
            topLeftCorner: [],
            bottomRightCorner: [],
          });
          setMapMarker({
            position: e.data.coordinates,
            content: `${e.data.coordinates[1]}, ${e.data.coordinates[0]}`,
          });
          stateSearch();
        } else {
          setImageOverlay({
            url: URL.createObjectURL(e.data.img),
            topLeftCorner: [bbox.latMin, bbox.longMin],
            bottomRightCorner: [bbox.latMax, bbox.longMax],
          });
        }
      };
      worker.postMessage({
        bbox: bbox,
        selectedArea: selectedShape.current,
        roads: roads.current,
        waters: waters.current,
      });
    }
  }

  return (
    <>
      <AppHeader />
      <div className='flex w-screen'>
        <div className='flex m-auto my-0.5'>
          <BarLoader className='display-block' loading={loading} width={'50vw'} aria-label='Loading Spinner' />
        </div>
      </div>
      <div className='h-[80vh] mx-[0.25rem]'>
        <Map onFeaturesChange={onMapFeaturesChange} imageOverlay={imageOverlay} mapMarker={mapMarker} waters={waters.current} />
      </div>
      <div className='flex w-screen'>
        <div className='flex m-auto my-2 gap-2 flex-wrap'>
          <ButtonSection onClickLoadFeatures={onClickLoadFeatures} onClickSearch={onClickSearch} appState={appState} />
        </div>
      </div>
    </>
  );
}

export { AppState };
export default App;
