const { Pool, Client } = require('pg')

module.exports = {
  get: function(bbox, cb) {
    const pool = new Pool()
    pool.query('select st_asgeojson(st_transform(way, 4326)) from planet_osm_line', (err, res) => {
      if(err){
        throw 'Error getting data from db: ' + err
      } else {
        cb(res.rows.map(r => {return JSON.parse(r.st_asgeojson)}))
      }

      pool.end()
    })
  }
}