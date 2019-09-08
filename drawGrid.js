const fs = require('fs')
const PNG = require('pngjs').PNG

function paintRoadsContext(grid, png) {
  for (var i = 0; i < grid.dimensions.x; i++) {
    for (var j = 0; j < grid.dimensions.y; j++) {
      if (grid.data[i][j].hasRoad > 0) {
        var idx = (j * grid.dimensions.x + i) << 2
        png.data[idx] = 0
        png.data[idx + 1] = 0
        png.data[idx + 2] = 0
        png.data[idx + 3] = 255
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
  toPngBase64: function(grid, callback) {
    var stream = toStream(grid)
    var chunks = []
    stream.on('data', d => chunks.push(d))
    stream.on('end', () => callback(Buffer.concat(chunks).toString('base64')))
  }
}