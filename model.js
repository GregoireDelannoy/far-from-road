const {
  Pool
} = require('pg')

module.exports = {
  get: function(bbox, cb) {
    // TODO: actually use the connection pool instead of re-opening for every request
    const pool = new Pool()
    pool.query(`
      SELECT st_asgeojson(st_transform(way, 4326))
      FROM planet_osm_line
      WHERE ST_Intersects(
        ST_Transform(
            ST_MakeEnvelope(${bbox.long.min}, ${bbox.lat.min}, ${bbox.long.max}, ${bbox.lat.max}, 
            4326),3857),way)`,
      (err, res) => {
        if (err) {
          throw 'Error getting data from db: ' + err
        } else {
          cb(res.rows.map(r => {
            return JSON.parse(r.st_asgeojson)
          }))
        }

        pool.end()
      })
  }
}