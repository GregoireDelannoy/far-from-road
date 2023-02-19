import { Polygon } from "geojson";

import { BoundingBox } from "./WorkerMessages";

function geometryToBbox(geom: Polygon): BoundingBox {
    const long = geom.coordinates[0].map(x => x[0]);
    const lat = geom.coordinates[0].map(x => x[1]);
    return {
        latMin: Math.min(...lat),
        latMax: Math.max(...lat),
        longMin: Math.min(...long),
        longMax: Math.max(...long),
    };
}

function geometryToEnlargedBbox(geom: Polygon): BoundingBox {
    const bounds = geometryToBbox(geom);
    const width = bounds.longMax - bounds.longMin;
    const height = bounds.latMax - bounds.latMin;

    return {
        latMin: bounds.latMin - height / 2,
        latMax: bounds.latMax + height / 2,
        longMin: bounds.longMin - width / 2,
        longMax: bounds.longMax + width / 2,
    };
}

function isValidHttpUrl(s: string): boolean {
    let url;
    try {
      url = new URL(s);
    } catch (_) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

export { geometryToBbox, geometryToEnlargedBbox, isValidHttpUrl };