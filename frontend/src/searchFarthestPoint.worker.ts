/* eslint-disable no-restricted-globals */
import { BBox, Geometry, Polygon } from 'geojson';
import proj4 from 'proj4';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import bbox from '@turf/bbox';

import { BoundingBox, MainToWorkerMessage } from './WorkerMessages';
import { gridToPng } from './drawGrid';

const GRID_MAX_RESOLUTION = 512.0
const DENSITY_STEP = 0.05 // Output one image every % of density


class GridElement {
  hasRoad: number = 0;
  isLand: boolean = true;
  withinBounds: boolean = false;
  excluded: boolean = false;
}

class Grid {
  dimensions: {
    x: number;
    y: number;
    increment: number;
  } = { x: 0, y: 0, increment: 0 };
  data: GridElement[][] = [];
  furthestAway: null | { x: number; y: number; } = null;
  bbox: BoundingBox = { latMin: 0, latMax: 0, longMin: 0, longMax: 0 }
  countExcludedElements: number = 0;
};


function dimensions(bbox: BoundingBox) {
  var largestDimension = Math.max(
    bbox.latMax - bbox.latMin,
    bbox.longMax - bbox.longMin
  )
  var increment = largestDimension / GRID_MAX_RESOLUTION
  return {
    //TODO: Check that x and y are always positive. What if bbox cross -180/+180°?
    x: Math.round((bbox.longMax - bbox.longMin) / increment),
    y: Math.round((bbox.latMax - bbox.latMin) / increment),
    increment: increment,
  }
}

function utmToGrid(grid: Grid, point: { long: any; lat: any; }) {
  if (
    point.lat < grid.bbox.latMin ||
    point.lat > grid.bbox.latMax ||
    point.long < grid.bbox.longMin ||
    point.long > grid.bbox.longMax
  ) {
    //console.error(`Point (${point.long},${point.lat}) is out of bbox bounds, cannot be found in grid`)
    return null
  } else {
    var x = Math.min(Math.floor((point.long - grid.bbox.longMin) / grid.dimensions.increment), grid.dimensions.x - 1)
    // y-axis is top to bottom in figure but top to ceiling in utm; invert coordinate
    var y = Math.min(grid.dimensions.y - Math.floor((point.lat - grid.bbox.latMin) / grid.dimensions.increment), grid.dimensions.y - 1)
    //console.debug(`Point (${point.lat},${point.long}) => (${x}, ${y})`)
    return {
      x: x,
      y: y
    }
  }
}

function gridToUtm(grid: Grid, point: { x: number; y: number; }) {
  // Aim for the middle of pixel
  return [
    grid.bbox.longMin + (point.x + 0.5) * grid.dimensions.increment,
    grid.bbox.latMin + (0.5 + grid.dimensions.y - point.y) * grid.dimensions.increment,
  ];
}

function setRoad(grid: Grid, i: number, j: number, iteration: number) {
  if (i < 0 || i >= grid.dimensions.x || j < 0 || j >= grid.dimensions.y) {
    return
  } else {
    if (grid.data[i][j].hasRoad === 0) {
      grid.data[i][j].hasRoad = iteration + 1
      if (grid.data[i][j].isLand && grid.data[i][j].withinBounds) {
        grid.countExcludedElements++;
        // Last point colorized?
        if (!grid.furthestAway && grid.countExcludedElements === grid.dimensions.x * grid.dimensions.y) {
          grid.furthestAway = {
            x: i,
            y: j
          }
        }
      }
    }
  }
}

function growRoads(grid: Grid, iteration: number) {
  for (var i = 0; i < grid.dimensions.x; i++) {
    for (var j = 0; j < grid.dimensions.y; j++) {
      if (grid.data[i][j].hasRoad === iteration) {
        setRoad(grid, i - 1, j, iteration)
        setRoad(grid, i + 1, j, iteration)
        setRoad(grid, i, j - 1, iteration)
        setRoad(grid, i, j + 1, iteration)
      }
    }
  }
  return grid
}

function pointInBbox(point: number[], bbox: BBox){
  return point[0] > bbox[0] && point[0] < bbox[2] && point[1] > bbox[1] && point[1] < bbox[3];
}

function generateGrid(bbox: BoundingBox, selectedArea: Polygon, waters: Geometry[]): Grid {
  let res = new Grid();
  res.bbox = bbox
  res.dimensions = dimensions(bbox)
  for (var i = 0; i < res.dimensions.x; i++) {
    var long = []
    for (var j = 0; j < res.dimensions.y; j++) {
      const e = new GridElement();
      const point = gridToUtm(res, { x: i, y: j });
      e.withinBounds = booleanPointInPolygon(point, selectedArea);
      if (e.withinBounds) {
        const point3857 = proj4('EPSG:4326', 'EPSG:3857', point)
        e.isLand = waters.every(w => {
          if (w.type === 'Polygon' && w.bbox && pointInBbox(point3857, w.bbox) && booleanPointInPolygon(point3857, w)) {
            return false;
          }
          return true;
        });
      }
      if (!e.withinBounds || !e.isLand) {
        res.countExcludedElements++;
        e.excluded = true;
      }
      long.push(e);
    }
    res.data.push(long)
  }
  return res
}

function fillRoads(grid: Grid, roads: any[]) {
  roads.forEach((r: { coordinates: number[][] }) => {
    for (let i = 0; i < r.coordinates.length - 1; i++) {
      const currPoint = proj4('EPSG:3857', 'EPSG:4326', r.coordinates[i]);
      const nextPoint = proj4('EPSG:3857', 'EPSG:4326', r.coordinates[i + 1])
      const vector = [nextPoint[0] - currPoint[0], nextPoint[1] - currPoint[1]]
      const vectorLength = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2))

      // Paint 1 pixel in between each line point: Go along computed vector and paint every #
      for (let j = 0.0; j < vectorLength; j += grid.dimensions.increment) {
        const element = {
          long: currPoint[0] + j * vector[0] / vectorLength,
          lat: currPoint[1] + j * vector[1] / vectorLength
        }
        const position = utmToGrid(grid, element)
        if (position != null && grid.data[position.x][position.y].hasRoad === 0) { // Point from road might not be within boundaries, as road does not stop at bbox
          grid.data[position.x][position.y].hasRoad = 1;
          if (grid.data[position.x][position.y].isLand && grid.data[position.x][position.y].withinBounds) {
            grid.countExcludedElements++
            grid.data[position.x][position.y].excluded = true;
          }
        }
      }
    }
  })
  return grid
}

self.onmessage = async (e: MessageEvent<MainToWorkerMessage>) => {
  e.data.waters.forEach(w => {
    w.bbox = bbox(w);
  });
  let grid = generateGrid(e.data.bbox, e.data.selectedArea, e.data.waters);
  const gridPointsTotal = grid.dimensions.x * grid.dimensions.y
  let iteration = 0;
  let sentImages = 0;
  let lastImageSent = 0;
  fillRoads(grid, e.data.roads);

  while (gridPointsTotal > grid.countExcludedElements && iteration < GRID_MAX_RESOLUTION) {
    iteration++;
    grid = growRoads(grid, iteration)
    var density = grid.countExcludedElements / gridPointsTotal;
    if (density > sentImages * DENSITY_STEP) {
      // Send one image every 500ms minimum, so that the animation is visible
      const waitTime = Math.max(0, 500 + lastImageSent - Date.now());
      await new Promise(r => setTimeout(r, waitTime));
      self.postMessage({
        isFinalResult: false,
        img: new Blob([gridToPng(grid)], { type: 'image/png' }),
        coordinates: [],
      });
      lastImageSent = Date.now();
      sentImages++;
    }
    console.debug(`iteration #${iteration}, roadElements: ${grid.countExcludedElements} / ${gridPointsTotal}`)
  }
  if (!grid.furthestAway) {
    console.error("Did not find last colorized point within iteration limit. Error!")
    return null
  } else {
    console.debug(`Found point @${grid.furthestAway.x},${grid.furthestAway.y}`)
    self.postMessage({
      isFinalResult: true,
      img: new Blob([gridToPng(grid)], { type: 'image/png' }),
      coordinates: gridToUtm(grid, grid.furthestAway),
    });
  }
};

export { Grid };