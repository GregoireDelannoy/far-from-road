const Grid = require('./geoGrid.js')
const Draw = require('./drawGrid.js')
const Model = require('./model.js')
const express = require('express')

const app = express()
const port = 3000

app.get('/roads', (req, res) => {
  console.dir(req.query)
  if(!(req.query.latmin) || Math.abs(parseFloat(req.query.latmin)) > 90){
    debugger
    throw 'Required parameter: latmin [-90:90]'
  }
  var latmin = parseFloat(req.query.latmin)
  if(!(req.query.latmax) || Math.abs(parseFloat(req.query.latmax)) > 90){
    throw 'Required parameter: latmx [-90:90]'
  }
  var latmax = parseFloat(req.query.latmax)
  if(latmax <= latmin){
    throw 'latmax shall be > latmin'
  }

  if(!(req.query.longmin) || Math.abs(parseFloat(req.query.longmin)) > 180){
    throw 'Required parameter: latmin [-90:90]'
  }
  var longmin = parseFloat(req.query.longmin)
  if(!(req.query.longmax) || Math.abs(parseFloat(req.query.longmax)) > 180){
    throw 'Required parameter: latmx [-90:90]'
  }
  var longmax = parseFloat(req.query.longmax)
  if(longmax <= longmin){
    throw 'longmax shall be > longmin'
  }

  var bbox = {
    lat: {
      min: latmin,
      max: latmax
    },
    long: {
      min: longmin,
      max: longmax
    }
  }

  var grid = Grid.generate(bbox)

  Model.get(bbox, function(res){
    grid = Grid.fillRoads(grid, res)
    Draw.toPng(grid, "test.png")
    Draw.toGif(grid, "test.gif")
  })
  res.send('Hello World!')
})

app.use(express.static('public'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))