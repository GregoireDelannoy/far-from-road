const assert = require('assert')
const Draw = require('../drawGrid.js')
const fs = require('fs')
const os = require('os')
const md5file = require('md5-file')

function exampleGrid() {
  return {
    dimensions: {
      x: 3,
      y: 3
    },
    data: [
      [{
        hasRoad: 1
      }, {
        hasRoad: 0
      }, {
        hasRoad: 0
      }],
      [{
        hasRoad: 0
      }, {
        hasRoad: 1
      }, {
        hasRoad: 0
      }],
      [{
        hasRoad: 0
      }, {
        hasRoad: 0
      }, {
        hasRoad: 1
      }]
    ]
  }
}

describe('Grid drawing interface', function() {
  describe('#toPngFile()', function() {
    it('fail when missing arguments', function() {
      assert.throws(() => Draw.toPngFile())
    })

    it('writes 3x3 PNG file to location', function() {
      var grid = exampleGrid()
      var filename = `${os.tmpdir()}/test${Math.random().toString().substring(2,6)}.png`

      assert.throws(() => fs.accessSync(filename))
      Draw.toPngFile(grid, filename)
      assert.equal(md5file.sync(filename), 'd41d8cd98f00b204e9800998ecf8427e')
      fs.unlinkSync(filename)
    })
  })

  describe('#toPngBase64()', function() {
    it('returns the correct base64 string for 3x3 grid', function(done) {
      var grid = exampleGrid()
      Draw.toPngBase64(grid).then(ret => {
        assert.equal(ret, 'iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAAAAABzQ+pjAAAAAklEQVR4AewaftIAAAASSURBVGNk+M/A8J/hP8P//wwAGv0E/T4EYvUAAAAASUVORK5CYII=')
        done()
      })
    })
  })
})