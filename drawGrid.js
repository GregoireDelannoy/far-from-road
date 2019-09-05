const fs = require('fs')
const {createCanvas} = require('canvas')

module.exports = {
  toPng: function(grid, filename){
    var out = fs.createWriteStream(filename)
    var canvas = createCanvas(grid.dimensions.x, grid.dimensions.y)
    var ctx = canvas.getContext('2d')

    // Fill background with white
    ctx.fillStyle = "rgba(255,255,255,1)"
    ctx.fillRect(0, 0, grid.dimensions.x, grid.dimensions.y)

    // Paint roads in black
    ctx.fillStyle = "rgba(0,0,0,1)"
    for (var i = 0; i < grid.dimensions.x; i++) {
      for (var j = 0; j < grid.dimensions.y; j++) {
        if(grid.data[i][j].hasRoad){
          ctx.fillRect(i, j, 1, 1)
        }
      }
    }

    const stream = canvas.createPNGStream()
    stream.pipe(out)
    out.on('finish', () =>  console.log(`PNG ${filename} was written.`))
  }
}