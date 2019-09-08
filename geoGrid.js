const GRID_MAX_RESOLUTION = 1024.0

function dimensions(bbox) {
  var largestDimension = Math.max(
    bbox.lat.max - bbox.lat.min,
    bbox.long.max - bbox.long.min
  )
  var increment = largestDimension / GRID_MAX_RESOLUTION
  console.debug(`Going from latitude ${bbox.lat.min} to ${bbox.lat.max} with a ${increment} increment`)
  return {
    //TODO: Check that x and y are always positive. What if bbox cross -180/+180°?
    x: Math.round((bbox.long.max - bbox.long.min) / increment),
    y: Math.round((bbox.lat.max - bbox.lat.min) / increment),
    increment: increment,
  }
}

function element() {
  return {
    hasRoad: 0,
    isLand: true, // TODO: implement land detection with OSM polygons!
  }
}

function utmToGrid(grid, point) {
  if (
    point.lat < grid.bbox.lat.min ||
    point.lat > grid.bbox.lat.max ||
    point.long < grid.bbox.long.min ||
    point.long > grid.bbox.long.max
  ) {
    //console.error(`Point (${point.long},${point.lat}) is out of bbox bounds, cannot be found in grid`)
    return null
  } else {
    var x = Math.min(Math.floor((point.long - grid.bbox.long.min) / grid.dimensions.increment), grid.dimensions.x - 1)
      // y-axis is top to bottom in figure but top to ceiling in utm; invert coordinate
    var y = Math.min(grid.dimensions.y - Math.floor((point.lat - grid.bbox.lat.min) / grid.dimensions.increment), grid.dimensions.y - 1)
      //console.debug(`Point (${point.lat},${point.long}) => (${x}, ${y})`)
    return {
      x: x,
      y: y
    }
  }
}

function gridToUtm(grid, point) {
  // Aim for the middle of pixel
  return {
    long: grid.bbox.long.min + (point.x + 0.5) * grid.dimensions.increment,
    lat: grid.bbox.lat.min + (0.5 + grid.dimensions.y - point.y) * grid.dimensions.increment,
  }
}

function setRoad(grid, i, j, iteration) {
  if (i < 0 || i >= grid.dimensions.x || j < 0 || j >= grid.dimensions.y) {
    return
  } else {
    if (grid.data[i][j].hasRoad == 0) {
      grid.data[i][j].hasRoad = iteration + 1
      grid.countRoadElements++
        // Last point colorized?
        if (grid.countRoadElements == grid.dimensions.x * grid.dimensions.y) {
          grid.furthestAway = {
            x: i,
            y: j
          }
        }
    }
  }
}

function growRoads(grid, iteration) {
  for (var i = 0; i < grid.dimensions.x; i++) {
    for (var j = 0; j < grid.dimensions.y; j++) {
      if (grid.data[i][j].hasRoad == iteration) {
        setRoad(grid, i - 1, j, iteration)
        setRoad(grid, i + 1, j, iteration)
        setRoad(grid, i, j - 1, iteration)
        setRoad(grid, i, j + 1, iteration)
      }
    }
  }
  return grid
}

module.exports = {
  generate: function(bbox) {
    var ret = {
      bbox: bbox,
      dimensions: dimensions(bbox),
      data: [],
      countRoadElements: 0,
      furthestAway: null,
    }
    for (var i = 0; i < ret.dimensions.x; i++) {
      var long = []
      for (var j = 0; j < ret.dimensions.y; j++) {
        var e = element()
        /* Paint outer edges as having roads. Avoid finds at edges that might be fakes.
        TODO: Find a better solution! Expand grid compared to bbox and load actual roads? */
        if (i == 0 || j == 0 || i == ret.dimensions.x - 1 || j == ret.dimensions.y - 1) {
          ret.countRoadElements++
            e.hasRoad = 1
        }
        long.push(e)
      }
      ret.data.push(long)
    }
    return ret
  },

  fillRoads: function(grid, roads) {
    roads.forEach(r => {
      for (var i = 0; i < r.coordinates.length - 1; i++) {
        var currPoint = r.coordinates[i]
        var nextPoint = r.coordinates[i + 1]
        var vector = [nextPoint[0] - currPoint[0], nextPoint[1] - currPoint[1]]
        var vectorLength = Math.sqrt(Math.pow(vector[0], 2) + Math.pow(vector[1], 2))
        console.log(`vector length between (${currPoint[0]},${currPoint[1]}) and (${nextPoint[0]},${nextPoint[1]}) is ${vectorLength}`)

        // Paint 1 pixel in between each line point: Go along computed vector and paint every #
        for (var j = 0.0; j < vectorLength; j += grid.dimensions.increment) {
          var element = {
            long: currPoint[0] + j * vector[0]/vectorLength,
            lat: currPoint[1] + j * vector[1]/vectorLength
          }
          console.dir(element)
          var position = utmToGrid(grid, element)
          console.dir(position)
          if (position != null && grid.data[position.x][position.y].hasRoad == 0) { // Point from road might not be within boundaries, as road does not stop at bbox
            grid.data[position.x][position.y].hasRoad = 1
            grid.countRoadElements++
          }
        }
      }
    })
    return grid
  },

  findFurthestAway: function(grid) {
    var gridPointsTotal = grid.dimensions.x * grid.dimensions.y
    var iteration = 1
    while (gridPointsTotal > grid.countRoadElements && iteration < Math.floor(GRID_MAX_RESOLUTION)) {
      grid = growRoads(grid, iteration)
      iteration++
      // debug:
      //console.log(`iteration #${iteration}, roadElements: ${grid.countRoadElements} / ${gridPointsTotal}`)
      //Draw.toPng(grid, `test${("0000" + iteration).slice(-4)}.png`)
    }
    if (!grid.furthestAway) {
      console.log("Did not find last colorized point within iteration limit. Error!")
      return null
    } else {
      console.log(`Found point @${grid.furthestAway.x},${grid.furthestAway.y}`)
      return gridToUtm(grid, grid.furthestAway)
    }
  },
}