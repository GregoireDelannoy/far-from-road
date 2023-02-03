/* eslint-disable no-restricted-globals */
import { BoundingBox, MainToWorkerMessage } from './WorkerMessages';
import { gridToPng } from './drawGrid';
import { Grid } from './WorkerInternalsInterface';
import proj4 from 'proj4';

const GRID_MAX_RESOLUTION = 1024.0
const DENSITY_STEP = 0.1 // Output one image every % of density

function dimensions(bbox: BoundingBox) {
  var largestDimension = Math.max(
    bbox.latMax - bbox.latMin,
    bbox.longMax - bbox.longMin
  )
  var increment = largestDimension / GRID_MAX_RESOLUTION
  // console.debug(`Going from latitude ${bbox.latMin} to ${bbox.latMax} with a ${increment} increment`);
  return {
    //TODO: Check that x and y are always positive. What if bbox cross -180/+180°?
    x: Math.round((bbox.longMax - bbox.longMin) / increment),
    y: Math.round((bbox.latMax - bbox.latMin) / increment),
    increment: increment,
  }
}

function gridElement() {
  return {
    hasRoad: 0,
    isLand: true, // TODO: implement land detection with OSM polygons!
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
  return {
    long: grid.bbox.longMin + (point.x + 0.5) * grid.dimensions.increment,
    lat: grid.bbox.latMin + (0.5 + grid.dimensions.y - point.y) * grid.dimensions.increment,
  }
}

function setRoad(grid: Grid, i: number, j: number, iteration: number) {
  if (i < 0 || i >= grid.dimensions.x || j < 0 || j >= grid.dimensions.y) {
    return
  } else {
    if (grid.data[i][j].hasRoad === 0) {
      grid.data[i][j].hasRoad = iteration + 1
      grid.countRoadElements++
      // Last point colorized?
      if (grid.countRoadElements === grid.dimensions.x * grid.dimensions.y) {
        grid.furthestAway = {
          x: i,
          y: j
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

function generateGrid(bbox: BoundingBox): Grid {
  let res = {
    bbox: bbox,
    dimensions: dimensions(bbox),
    // eslint-disable-next-line @typescript-eslint/no-array-constructor
    data: Array(),
    countRoadElements: 0,
    furthestAway: null,
  }
  for (var i = 0; i < res.dimensions.x; i++) {
    var long = []
    for (var j = 0; j < res.dimensions.y; j++) {
      var e = gridElement()
      /* Paint outer edges as having roads. Avoid finds at edges that might be fakes.
      TODO: Find a better solution! Expand grid compared to bbox and load actual roads? */
      if (i === 0 || j === 0 || i === res.dimensions.x - 1 || j === res.dimensions.y - 1) {
        res.countRoadElements++
        e.hasRoad = 1
      }
      long.push(e)
    }
    res.data.push(long)
  }
  return res
}

function fillRoads(grid: Grid, roads: any[]) {
  roads.forEach((r: {geom: {coordinates: number [][]} }) => {
    for (let i = 0; i < r.geom.coordinates.length - 1; i++) {
      const currPoint = proj4('EPSG:3857', 'EPSG:4326', r.geom.coordinates[i]);
      const nextPoint = proj4('EPSG:3857', 'EPSG:4326',r.geom.coordinates[i + 1])
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
          grid.data[position.x][position.y].hasRoad = 1
          grid.countRoadElements++
        }
      }
    }
  })
  return grid
}

function findFurthestAway(grid: Grid) {
  
}



self.onmessage = (e: MessageEvent<MainToWorkerMessage>) => {
  let grid = generateGrid(e.data.bbox);
  const gridPointsTotal = grid.dimensions.x * grid.dimensions.y
  let iteration = 0;
  let sentImages = 0
  fillRoads(grid, e.data.roads);

  while (gridPointsTotal > grid.countRoadElements && iteration < GRID_MAX_RESOLUTION) {
    iteration++;
    grid = growRoads(grid, iteration)
    var density = grid.countRoadElements / gridPointsTotal;
    if (density > sentImages * DENSITY_STEP) {
      self.postMessage({
        isFinalResult: false,
        img: new Blob([gridToPng(grid)], {type: 'image/png'}),
        coordinates: [],
      });
    }
    console.debug(`iteration #${iteration}, roadElements: ${grid.countRoadElements} / ${gridPointsTotal}`)
  }
  if (!grid.furthestAway) {
    alert("Did not find last colorized point within iteration limit. Error!")
    return null
  } else {
    console.debug(`Found point @${grid.furthestAway.x},${grid.furthestAway.y}`)
    self.postMessage({
      isFinalResult: true,
      img: new Blob([gridToPng(grid)], {type: 'image/png'}),
      coordinates: gridToUtm(grid, grid.furthestAway),
    });
  }
};

export { };