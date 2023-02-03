interface BoundingBox {
    latMin: number
    latMax: number
    longMin: number
    longMax: number
};

interface MainToWorkerMessage {
    bbox: BoundingBox
    roads: [Geometry]
};

interface WorkerToMainMessage {
    isFinalResult: boolean
    img: Blob
    coordinates: [number]
}

export {BoundingBox, MainToWorkerMessage, WorkerToMainMessage};