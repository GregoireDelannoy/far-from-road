const fs = require('fs')
const PNG = require('pngjs').PNG

function paintPoint(data, x, i, j, color){
  var idx = (j * x + i) << 2
  data[idx] = color
  data[idx + 1] = color
  data[idx + 2] = color
  data[idx + 3] = 255
}

function paintRoadsContext(grid, png) {
  for (var i = 0; i < grid.dimensions.x; i++) {
    for (var j = 0; j < grid.dimensions.y; j++) {
      if (grid.data[i][j].hasRoad > 0) {
        paintPoint(png.data, grid.dimensions.x, i, j, 0)
      }

      if(grid.furthestAway && grid.furthestAway.x == i && grid.furthestAway.y == j){
        paintPoint(png.data, grid.dimensions.x, i, j, 255)
        paintPoint(png.data, grid.dimensions.x, i, j+1, 255)
        paintPoint(png.data, grid.dimensions.x, i, j-1, 255)
        paintPoint(png.data, grid.dimensions.x, i+1, j, 255)
        paintPoint(png.data, grid.dimensions.x, i-1, j, 255)
      }
    }
  }
}

function toStream(grid) {
  var png = new PNG({
    colorType: 0,
    width: grid.dimensions.x,
    height: grid.dimensions.y,
    filterType: -1
  })

  paintRoadsContext(grid, png)
  return png.pack()
}

module.exports = {
  toPngFile: function(grid, filename) {
    var out = fs.createWriteStream(filename)
    toStream(grid).pipe(out)
    out.on('finish', () => console.log(`PNG ${filename} was written.`))
  },
  toPngBase64: function(grid) {
    return new Promise(function(resolve, reject){
      var stream = toStream(grid)
      var chunks = []
      stream.on('data', d => chunks.push(d))
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('base64')))
    })
  }
}