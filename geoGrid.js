const GRID_MAX_RESOLUTION = 4096.0

function dimensions(bbox){
  var largestDimension = Math.max(
    bbox.lat.max - bbox.lat.min,
    bbox.long.max - bbox.long.min
    )
  var increment = largestDimension / GRID_MAX_RESOLUTION
  console.debug(`Going from latitude ${bbox.lat.min} to ${bbox.lat.max} with a ${increment} increment`)
  return {
    //TODO: Check that x and y are always positive. What if bbox cross -180/+180°?
    x: Math.round((bbox.lat.max - bbox.lat.min) / increment),
    y: Math.round((bbox.long.max - bbox.long.min) / increment),
    increment: increment,
  }
}

function element(){
  return {
    hasRoad: false,
    isLand: true, // TODO: implement land detection with OSM polygons!
    closeToRoad: false
  }
}

function distance(p1, p2){
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}

function pointToCoordinates(grid, point){
  if (
    point.lat < grid.bbox.lat.min ||
    point.lat > grid.bbox.lat.max ||
    point.long < grid.bbox.long.min ||
    point.long > grid.bbox.long.max
    ){
    console.error(`Point (${point.lat},${point.long}) is out of bbox bounds, cannot be found in grid`)
    return null
  } else {
    var x = Math.floor((point.lat - grid.bbox.lat.min) / grid.dimensions.increment)
    var y = Math.floor((point.long - grid.bbox.long.min) / grid.dimensions.increment)
    //console.debug(`Point (${point.lat},${point.long}) => (${x}, ${y})`)
    return {
      x: x,
      y: y
    }
  }
}

module.exports = {
  generate: function(bbox){
    var ret = {
      bbox: bbox,
      dimensions: dimensions(bbox),
      data: [],
    }
    for (var i = 0; i < ret.dimensions.x; i++) {
      var long = []
      for (var j = 0; j < ret.dimensions.y; j++) {
        long.push(element())
      }
      ret.data.push(long)
    }
    return ret
  },
  fillRoads: function(grid, roads){
    roads.forEach(r => {
      for (var i = 0; i < r.coordinates.length - 1; i++) {
        var currPoint = r.coordinates[i]
        var nextPoint = r.coordinates[i+1]
        var vector = [nextPoint[0] - currPoint[0], nextPoint[1] - currPoint[1]]
        var vectorLength = Math.sqrt(Math.pow(vector[0], 2), Math.pow(vector[1], 2))

        // Paint 1 pixel in between each line point: Go along computed vector and paint every #
        for (var j = 0; j < vectorLength; j += grid.dimensions.increment) {
          var element = {
            lat: currPoint[0] + j * vector[0],
            long: currPoint[1] + j * vector[1]
          }

          var position = pointToCoordinates(grid, element)
          if(position != null){ // Point from road might not be within boundaries, as road does not stop at bbox
            grid.data[position.x][position.y].hasRoad = true
          }
        }
      }
    })
    return grid
  },
}