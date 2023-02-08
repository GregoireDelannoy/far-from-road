import { useState } from 'react';
import { Browser, latLngBounds, latLng } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay } from 'react-leaflet'
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

import EditControlFC from './EditControl';


interface ImageOverlayProps {
    url: string;
    topLeftCorner: number[];
    bottomRightCorner: number[];
}

interface MapMarkerProps {
    position: number[];
    content: string;
}

interface MapProps {
    onFeaturesChange: (features: FeatureCollection<Geometry, GeoJsonProperties>) => void;
    imageOverlay: ImageOverlayProps;
    mapMarker: MapMarkerProps;
}

function Map({ onFeaturesChange, imageOverlay, mapMarker }: MapProps) {
    const [geojson, setGeojson] = useState<FeatureCollection>({
        type: 'FeatureCollection',
        features: [],
    });

    function onGeoJsonChange(features: FeatureCollection<Geometry, GeoJsonProperties>) {
        onFeaturesChange(features);
        setGeojson(features);
    }

    let overlay = <span />;
    if (imageOverlay.url) {
        overlay = <ImageOverlay url={imageOverlay.url} bounds={latLngBounds(latLng(imageOverlay.topLeftCorner[0], imageOverlay.topLeftCorner[1]), latLng(imageOverlay.bottomRightCorner[0], imageOverlay.bottomRightCorner[1]))} />
    }

    let marker = <span />;
    if (mapMarker.content) {
        marker = <Marker position={latLng(mapMarker.position[1], mapMarker.position[0])}>
            <Popup>
                <span>{mapMarker.content}</span>
            </Popup>
        </Marker>
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
            {marker}
            <EditControlFC geojson={geojson} setGeojson={onGeoJsonChange} />
        </MapContainer>
    );
}

export type {ImageOverlayProps, MapMarkerProps};
export {Map};
