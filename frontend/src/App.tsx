import { ReactElement, useState } from 'react';
import logo from './logo.svg';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import type { FeatureCollection } from 'geojson';
import EditControlFC from './EditControl';

function Map() {
  const [geojson, setGeojson] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });

  return (
    <MapContainer
      center={[44.911518, 6.36352]}
      zoom={9}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
      />
      <EditControlFC geojson={geojson} setGeojson={setGeojson} />
    </MapContainer>
  );
}

function App(): ReactElement {
  return (
    <>
      <div className='grid grid-cols-2 gap-4'>
        <img className='max-h-[10rem]' src={logo} alt='Logo' />
        <div className='flex justify-center items-center'>
          <span className='font-bold text-xl'>Escape the crowd</span>
        </div>
      </div>
      <div className='h-[60vh] mx-[0.25rem]'>
        <Map />
      </div>
    </>
  )
}

export default App;
