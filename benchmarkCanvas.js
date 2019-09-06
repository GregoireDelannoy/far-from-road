const drawgrid = require('./drawGridBench.js')

const DIMENSIONS = {
  x: 1024,
  y: 1024
}
const THRESHOLD = 0.95


function timer(name, f){
  var start = Date.now()
  f()
  console.log(`${name} took ${Date.now() - start}ms to execute`)
}


function fillGridBooleans(){
  var c = 0
  var grid = []
  for (var i = 0; i < DIMENSIONS.x; i++) {
    var col = []
    for (var j = 0; j < DIMENSIONS.y; j++) {
      var hasRoad = false
      if(Math.random() > THRESHOLD){
        hasRoad = true
        c++
      }
      col.push({
        hasRoad: hasRoad ? 1 : 0,
        isLand: true,
        closeToRoad: false
      })
    }
    grid.push(col)
  }
  return {
    dimensions: DIMENSIONS,
    data: grid,
    countRoadElements: c
  }
}

var grid = null
timer('grid creation', (f => {grid = fillGridBooleans()}))
timer('PNG creation', (f => {drawgrid.toPng(grid, 'test.png')}))
timer('GIF creation', (f => {drawgrid.toGif(grid, 'test.gif')}))