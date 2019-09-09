const Grid = require('./geoGrid.js')
const Model = require('./model.js')
const express = require('express')

const app = express()
const PORT = 80
const HOST = '0.0.0.0'

function parseBoundingBox(req) {
  if (!(req.query.latmin) || Math.abs(parseFloat(req.query.latmin)) > 90) {
    throw 'Required parameter: latmin [-90:90]'
  }
  var latmin = parseFloat(req.query.latmin)
  if (!(req.query.latmax) || Math.abs(parseFloat(req.query.latmax)) > 90) {
    throw 'Required parameter: latmx [-90:90]'
  }
  var latmax = parseFloat(req.query.latmax)
  if (latmax <= latmin) {
    throw 'latmax shall be > latmin'
  }

  if (!(req.query.longmin) || Math.abs(parseFloat(req.query.longmin)) > 180) {
    throw 'Required parameter: latmin [-90:90]'
  }
  var longmin = parseFloat(req.query.longmin)
  if (!(req.query.longmax) || Math.abs(parseFloat(req.query.longmax)) > 180) {
    throw 'Required parameter: latmx [-90:90]'
  }
  var longmax = parseFloat(req.query.longmax)
  if (longmax <= longmin) {
    throw 'longmax shall be > longmin'
  }

  return {
    lat: {
      min: latmin,
      max: latmax
    },
    long: {
      min: longmin,
      max: longmax
    }
  }
}

app.get('/roads', (req, res) => {
  var bbox = parseBoundingBox(req)
  var grid = Grid.generate(bbox)

  Model.get(bbox, function(dbData) {
    grid = Grid.fillRoads(grid, dbData)
    res.json(Grid.findFurthestAway(grid))
  })
})

app.use(express.static('public'))

app.listen(PORT, HOST, () => console.log(`App listening on port ${PORT}!`))