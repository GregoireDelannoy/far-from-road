import { Geometry, Polygon } from 'geojson';

interface BoundingBox {
    latMin: number
    latMax: number
    longMin: number
    longMax: number
};

interface MainToWorkerMessage {
    bbox: BoundingBox
    selectedArea: Polygon,
    roads: Geometry[]
    waters: Geometry[]
};

interface WorkerToMainMessage {
    isFinalResult: boolean
    img: Blob
    coordinates: number[]
}

export {BoundingBox, MainToWorkerMessage, WorkerToMainMessage};