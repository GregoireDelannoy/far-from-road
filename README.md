# far-from-road
Find the furthest away spot from any paved road in a geographic area. Hobby project to get back to NodeJS dev.

Demo at https://gregoiredelannoy.fr/farfromroad/
To use:
 * Select area (might fail on too very large areas, check console/network logs).
 * Click button to load geographical features (roads and water bodies) from backend.
 * Click the search button to launch client search and display.

Be cautious, as for now only roads in France where loaded into my database. I'll import the others at some point, but OSM raw data is HUUUUGE.


## Install
*Tested on Ubuntu 22.04*

### Database
Install psql with gis extensions:
`apt install postgresql postgis`

Create DB with extensions:
```
CREATE USER <GIS_USER> WITH PASSWORD '<GIS_PASSWORD>';
CREATE DATABASE <GIS_DB> WITH OWNER <GIS_USER>;
\connect <GIS_DB>
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

Download a PBF file from [Geofabrik](https://download.geofabrik.de), install OSM2PGSQL `apt install osm2pgsql`.

Load the PBF into DB using the provided LUA script:

`osm2pgsql -H 127.0.0.1 -d <GIS_DB> -U <GIS_USER> -W -O flex -S <PROJECT_PATH>/osm2pgsql_config.lua <PATH_TO_PBF>`


### Frontend
In `frontend/` folder:
 * Fill `.env` file with corresponding value:
```
REACT_APP_API_URL = http://127.0.0.1:4000
```

 * Dev Server: `npm run start`

 * Build: `npm run build`

### Backend
 * Fill `.env` file with corresponding value:
```
DB_HOST='127.0.0.1'
DB_PORT='5432'
DB_USERNAME='******'
DB_PASSWORD='******'
DB_NAME='******'
```

 * Dev Server: `npm run start`

 * Build: `npm run build`

Then, everything can be served with a simple `node dist/main.js`.