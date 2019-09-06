const fs = require('fs')
const PNG = require('pngjs').PNG

const geogrid = require('./geoGrid.js')

function paintRoadsContext(grid, png){
  for (var i = 0; i < grid.dimensions.x; i++) {
    for (var j = 0; j < grid.dimensions.y; j++) {
      if(grid.data[i][j].hasRoad > 0){
        var idx = (j*grid.dimensions.y + i)<<2
        png.data[idx] = 0
        png.data[idx+1] = 0
        png.data[idx+2] = 0
        png.data[idx+3] = 255
      }
    }
  }
}

function toPngStream(grid){
  var png = new PNG({colorType:0, width: grid.dimensions.x, height: grid.dimensions.y, filterType: -1})
  
  paintRoadsContext(grid, png)
  return png.pack()
}

function toPng(grid, filename){
  var out = fs.createWriteStream(filename)
  toPngStream(grid).pipe(out)
  out.on('finish', () =>  console.log(`PNG ${filename} was written.`))
}

module.exports = {
  toGif: function(grid, filename){
    var iteration = 1
    var gridPointsTotal = grid.dimensions.x * grid.dimensions.y
    while(gridPointsTotal - grid.countRoadElements > 4 && iteration < 20){
      grid = geogrid.growRoads(grid, iteration)
      toPng(grid, `test${("0000" + iteration).slice(-4)}.png`)
      console.log(`iteration #${iteration++}, roadElements: ${grid.countRoadElements} / ${gridPointsTotal}`)
    }
  },

  toPng: toPng,
}