const Grid = require('./geoGrid.js')
const Draw = require('./drawGrid.js')
const Model = require('./model.js')

const STATIC_BBOX = {
  lat: {
    min: 5.95,
    max: 6.4
  },
  long: {
    min: 45.15,
    max: 45.4
  }
}

var grid = Grid.generate(STATIC_BBOX)

Model.get(STATIC_BBOX, function(res){
  grid = Grid.fillRoads(grid, res)
  Draw.toPng(grid, "test.png")
})