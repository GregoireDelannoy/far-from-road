const assert = require('assert')
const Grid = require('../geoGrid.js')
const Draw = require('../drawGrid.js')

const BOUNDING_BOX = {
  long: {
    min: 50,
    max: 150
  },
  lat: {
    min: -50,
    max: 50
  }
}

const ROADS = [{
  coordinates: [
    [50, 0],
    [75, 0],
    [100, 0]
  ]
},
 {
  coordinates: [
    [50, 50],
    [150, -50]
  ]
}
]

const DEGREES_ERROR_THRESHOLD = 1
const KNOW_FURTHEST_AWAY_POINT = {
  long: 116.674,
  lat: 16.674
}

describe('Grid generate and compute interface', function() {
  var grid = Grid.generate(BOUNDING_BOX)
  describe('#generate()', function() {
    it('generated grid matches expected prototype', function() {
      assert.deepStrictEqual(grid.bbox, BOUNDING_BOX)
      assert.ok(grid.dimensions.x > 0)
      assert.ok(grid.dimensions.y > 0)
      assert.ok(grid.data.length == grid.dimensions.x)
      grid.data.forEach(d => {
        assert.ok(d.length == grid.dimensions.y)
        d.forEach(e => {
          assert.ok(e.hasRoad >= 0)
        })
      })
    })

    it('point in the middle should not have roads', function() {
      assert.ok(grid.data[
        Math.floor(grid.dimensions.x / 2)][
        Math.floor(grid.dimensions.y / 2)
        ].hasRoad == 0)
    })
  })


  describe('#fillRoads()', function() {
    it('fill with example roads', function() {
      Grid.fillRoads(grid, ROADS)
    })

    it('points where roads should be', function(){
      assert.ok(grid.data[
        0][
        Math.floor(grid.dimensions.y / 2)
        ].hasRoad > 0)
      assert.ok(grid.data[
        Math.floor(grid.dimensions.x / 4)][
        Math.floor(grid.dimensions.y / 2)
        ].hasRoad > 0)
      assert.ok(grid.data[
        Math.floor(-1 + grid.dimensions.x / 4)][
        Math.floor(grid.dimensions.y / 4)
        ].hasRoad > 0)
    })
  })

  describe('#findFurthestAway()', function() {
    it('finds furthest point given example roads', function(){
      var furthestPoint = Grid.findFurthestAway(grid)
      assert.ok(Math.abs(furthestPoint.coordinates.long - KNOW_FURTHEST_AWAY_POINT.long) < DEGREES_ERROR_THRESHOLD)
      assert.ok(Math.abs(furthestPoint.coordinates.lat - KNOW_FURTHEST_AWAY_POINT.lat) < DEGREES_ERROR_THRESHOLD)
    })
  })
})