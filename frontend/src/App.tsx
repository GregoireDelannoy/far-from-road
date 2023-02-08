import type { FeatureCollection, GeoJsonProperties, Geometry, Polygon } from 'geojson';
import { useState, useRef } from 'react';

import logo from './img/logo.svg';
import { BoundingBox, WorkerToMainMessage } from './WorkerMessages';
import {Map} from './Map';
import type { MapMarkerProps, ImageOverlayProps } from './Map';
import { StepButton } from './StepButton';

function AppHeader() {
  return (
    <div className="flex w-screen">
      <div className='m-auto grid grid-cols-2 gap-4 max-w-3xl'>
        <img className='max-h-[6rem]' src={logo} alt='Logo' />
        <div className='flex justify-center items-center'>
          <span className='font-bold text-xl'>Escape the crowd</span>
        </div>
      </div>
    </div>
  );
}

function geometryToEnlargedBounds(geom: Polygon): BoundingBox {
  const long = geom.coordinates[0].map(x => x[0])
  const lat = geom.coordinates[0].map(x => x[1])
  return {
    latMin: Math.min(...lat),
    latMax: Math.max(...lat),
    longMin: Math.min(...long),
    longMax: Math.max(...long),
  }
}

function App() {
  const [shapesButtonState, setShapesButtonState] = useState({ actionable: false, isDone: false, current: true, text: '1 Draw shape on map', onClick: () => { } })
  const [loadButtonState, setLoadButtonState] = useState({ actionable: false, isDone: false, current: false, text: '2 Load geo-features', onClick: onClickLoadFeatures })
  const [searchButtonState, setSearchButtonState] = useState({ actionable: false, isDone: false, current: false, text: '3 Search!', onClick: onClickSearch })
  const selectedShape = useRef<Geometry>();
  const geoFeatures = useRef<Geometry[]>();
  const [mapMarker, setMapMarker] = useState<MapMarkerProps>({
    position: [],
    content: '',
  });
  const [imageOverlay, setImageOverlay] = useState<ImageOverlayProps>({
    url: '',
    topLeftCorner: [],
    bottomRightCorner: [],
  });

  function stateSelectShapes() {
    setShapesButtonState({ ...shapesButtonState, actionable: false, isDone: false, current: true });
    setLoadButtonState({ ...loadButtonState, actionable: false, isDone: false, current: false });
    setSearchButtonState({ ...searchButtonState, actionable: false, isDone: false, current: false });
    setMapMarker({ position: [], content: '' });
  }

  function stateLoadFeatures() {
    setShapesButtonState({ ...shapesButtonState, actionable: false, isDone: true, current: false });
    setLoadButtonState({ ...loadButtonState, actionable: true, isDone: false, current: true });
    setSearchButtonState({ ...searchButtonState, actionable: false, isDone: false, current: false });
  }

  function stateWaitFeatures() {
    setShapesButtonState({ ...shapesButtonState, actionable: false, isDone: true, current: false });
    setLoadButtonState({ ...loadButtonState, actionable: false, isDone: false, current: true });
    setSearchButtonState({ ...searchButtonState, actionable: false, isDone: false, current: false });
  }

  function stateSearch() {
    setShapesButtonState({ ...shapesButtonState, actionable: false, isDone: true, current: false });
    setLoadButtonState({ ...loadButtonState, actionable: false, isDone: true, current: false });
    setSearchButtonState({ ...searchButtonState, actionable: true, isDone: false, current: true });
  }

  function stateSearching() {
    setShapesButtonState({ ...shapesButtonState, actionable: false, isDone: true, current: false });
    setLoadButtonState({ ...loadButtonState, actionable: false, isDone: true, current: false });
    setSearchButtonState({ ...searchButtonState, actionable: false, isDone: false, current: true });
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
      const bounds = geometryToEnlargedBounds(selectedShape.current);
      const queryParameters = Object.entries(bounds)
        .map(kv => `${kv[0]}=${kv[1]}`)
        .reduce((a, b) => a + '&' + b);
      fetch(`http://127.0.0.1:4000/roads?${queryParameters}`)
        .then(res => res.json())
        .then((res) => {
          geoFeatures.current = res;
          stateSearch();
        },
          (error) => {
            console.error(error);
            alert('There has been an error downloading geoFeatures. Check console.')
          })
    }
  }

  function onClickSearch() {
    if (selectedShape.current && selectedShape.current.type === 'Polygon') {
      stateSearching();
      const bbox = geometryToEnlargedBounds(selectedShape.current);
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
            content: `Coordinates: "${e.data.coordinates[1]}, ${e.data.coordinates[0]}"`,
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
        roads: geoFeatures.current,
      });
    }
  }

  return (
    <>
      <AppHeader />
      <div className='h-[80vh] mx-[0.25rem]'>
        <Map onFeaturesChange={onMapFeaturesChange} imageOverlay={imageOverlay} mapMarker={mapMarker} />
      </div>
      <div className="flex w-screen">
        <div className='flex m-auto my-2 gap-2 flex-wrap'>
          <StepButton {...shapesButtonState} />
          <StepButton {...loadButtonState} />
          <StepButton {...searchButtonState} />
        </div>
      </div>
    </>
  )
}

export default App;
