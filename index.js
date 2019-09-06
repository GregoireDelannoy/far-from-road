const Grid = require('./geoGrid.js')
const Draw = require('./drawGrid.js')
const Model = require('./model.js')

const STATIC_BBOX = {
  lat: {
    min: 45,
    max: 45.5
  },
  long: {
    min: 6,
    max: 6.5
  }
}

var grid = Grid.generate(STATIC_BBOX)

Model.get(STATIC_BBOX, function(res){
  grid = Grid.fillRoads(grid, res)
  Draw.toPng(grid, "test.png")
})