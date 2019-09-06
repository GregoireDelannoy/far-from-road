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
  var streamArray = drawgrid.toArrayBuffer(grid)
  var arrayRes = []
  streamArray.forEach(s => {
    var chunks = []
    console.log("registering ondata")
    s.on('data', function(d){
      chunks.push(d)
    })
    s.on('end', function(){
      var res = Buffer.concat(chunks)
      arrayRes.push(res.toString('base64'))
      if(arrayRes.length == streamArray.length){
        res.json({
          pngData: arrayRes,
          farAwayLocation: {},
        })
      }
    })
  })
})