import { useState, useRef } from 'react';
import logo from './logo.svg';
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay } from 'react-leaflet'
import type { FeatureCollection, GeoJsonProperties, Geometry, Polygon } from 'geojson';
import EditControlFC from './EditControl';
import { Browser, latLngBounds, latLng } from 'leaflet';
import {BoundingBox, WorkerToMainMessage} from './WorkerMessages';

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

interface ImageOverlayProps {
    url: string;
    topLeftCorner: number[];
    bottomRightCorner: number[];
}

interface MapProps {
  onFeaturesChange: (features: FeatureCollection<Geometry, GeoJsonProperties>) => void;
  imageOverlay: ImageOverlayProps
}

function Map({ onFeaturesChange, imageOverlay }: MapProps) {
  const [geojson, setGeojson] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });

  function onGeoJsonChange(features: FeatureCollection<Geometry, GeoJsonProperties>) {
    onFeaturesChange(features);
    setGeojson(features);
  }

  let overlay = <span />
  if (imageOverlay.url) {
     overlay = <ImageOverlay url = {imageOverlay.url} bounds={latLngBounds(latLng(imageOverlay.topLeftCorner[0], imageOverlay.topLeftCorner[1]), latLng(imageOverlay.bottomRightCorner[0], imageOverlay.bottomRightCorner[1]))}/>
  }

  return (
    <MapContainer
      center={[44.911518, 6.36352]} // Somewhere in the french alps
      zoom={9}
      zoomControl={true}
      dragging={!Browser.mobile} // Disable one finger dragging on map for mobile devices. TODO: test on real device
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
      />
      {overlay}
      <EditControlFC geojson={geojson} setGeojson={onGeoJsonChange} />
    </MapContainer>
  );
}

interface StepButtonProps {
  actionable: boolean;
  isDone: boolean;
  current: boolean;
  text: string;
  onClick: (ev: any) => void;
}

function StepButton({ actionable, isDone, current, text, onClick }: StepButtonProps) {
  let classes = ['text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'min-w-[128px]', 'min-h-[56px]', 'border'];
  let disabled = null;

  if (isDone) {
    // Disabled + green
    classes.push('bg-[#50a060]');
    disabled = true;
  } else if (actionable) {
    // Enabled + blue
    classes.push('border-blue-700', 'bg-blue-500', 'hover:bg-blue-700');
    disabled = false;
  } else {
    // Disabled + blue
    classes.push('border-blue-700', 'bg-blue-500', 'cursor-not-allowed');
    disabled = true;
  }

  if (!current) {
    classes.push('opacity-70');
  }

  return (
    <button onClick={onClick} className={classes.join(' ')} disabled={disabled}>
      {text}
    </button>
  )
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
  const [imageOverlay, setImageOverlay] = useState<ImageOverlayProps>({
    url: '',
    topLeftCorner: [],
    bottomRightCorner: [],
  });

  function stateSelectShapes() {
    setShapesButtonState({ ...shapesButtonState, actionable: false, isDone: false, current: true });
    setLoadButtonState({ ...loadButtonState, actionable: false, isDone: false, current: false });
    setSearchButtonState({ ...searchButtonState, actionable: false, isDone: false, current: false });
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
        .reduce((a,b) => a + '&' + b);
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

  function onClickSearch(){
    if (selectedShape.current && selectedShape.current.type === 'Polygon') {
      stateSearching();
      const bbox = geometryToEnlargedBounds(selectedShape.current);
      const worker = new Worker(new URL('./searchFarthestPoint.worker.ts', import.meta.url));
      worker.onmessage = (e: MessageEvent<WorkerToMainMessage>) => {
          console.log('Received from worker:', e.data);
          setImageOverlay({
            url: URL.createObjectURL(e.data.img),
            topLeftCorner: [bbox.latMin, bbox.longMin],
            bottomRightCorner: [bbox.latMax, bbox.longMax],
          });
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
        <Map onFeaturesChange={onMapFeaturesChange} imageOverlay={imageOverlay}/>
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
