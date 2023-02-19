import { ReactElement, useState } from 'react';
import { Browser, latLngBounds, latLng } from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay, LayerGroup, Polygon } from 'react-leaflet';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import proj4 from 'proj4';

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
    waters: Geometry[];
}

function Map({ onFeaturesChange, imageOverlay, mapMarker, waters }: MapProps) {
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
        overlay = <ImageOverlay url={imageOverlay.url} bounds={latLngBounds(latLng(imageOverlay.topLeftCorner[0], imageOverlay.topLeftCorner[1]), latLng(imageOverlay.bottomRightCorner[0], imageOverlay.bottomRightCorner[1]))} />;
    }

    let marker = <span />;
    if (mapMarker.content) {
        marker = <Marker position={latLng(mapMarker.position[1], mapMarker.position[0])}>
            <Popup>
                <span>{mapMarker.content}</span>
            </Popup>
        </Marker>;
    }

    let watersPolygons: ReactElement[] = [];

    waters.forEach(w => {
        if (w.type === 'Polygon') {
            watersPolygons.push(<Polygon
                pathOptions={{ fillColor: 'blue', color: 'blue' }}
                positions={w.coordinates[0].map(c => {
                    let pos = proj4('EPSG:3857', 'EPSG:4326', c);
                    return latLng(pos[1], pos[0]);
                })}
            />);
        }
    });

    return (
        <MapContainer
            center={[44.911518, 6.36352]} // Somewhere in the french alps
            zoom={9}
            zoomControl={true}
            dragging={!Browser.mobile} // Disable one finger dragging on map for mobile devices.
            maxBounds={latLngBounds(latLng(52, -5), latLng(40, 11))} // Bounds should match DB known features
            minZoom={6}
            maxZoom={13}
        >
            <TileLayer
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                noWrap={true}
            />
            <LayerGroup>
                {watersPolygons}
            </LayerGroup>
            {overlay}
            {marker}
            <EditControlFC geojson={geojson} setGeojson={onGeoJsonChange} />
        </MapContainer>
    );
}

export type { ImageOverlayProps, MapMarkerProps };
export { Map };
