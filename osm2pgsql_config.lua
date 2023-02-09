-- Runnable with "osm2pgsql --slim -H 127.0.0.1 -d gis2 -U gis2 -W -O flex -S ~/code/far-from-road/osm2pgsql_config.lua /media/gregoire/Storage/france.pbf"

local roads = osm2pgsql.define_way_table('roads', {
    { column = 'id', sql_type = 'serial', create_only = true },
    { column = 'geom',    type = 'linestring' },
})

local waters = osm2pgsql.define_area_table('waters', {
    { column = 'id', sql_type = 'serial', create_only = true },
    { column = 'geom', type = 'polygon' },
})

local get_highway_value = osm2pgsql.make_check_values_func({
    'motorway', 'trunk', 'primary', 'secondary', 'tertiary',
    'motorway_link', 'trunk_link', 'primary_link', 'secondary_link', 'tertiary_link',
    'unclassified', 'residential'
})

local get_water = osm2pgsql.make_check_values_func({
    'water', 'lake', 'coastline', 'bay', 
})

function osm2pgsql.process_way(object)
    local highway_type = get_highway_value(object.tags.highway)
    local is_water = get_water(object.tags.natural)

    -- Get drivable roads
    if highway_type then
        roads:add_row({
            geom = { create = 'line' }
        })
    end

    if is_water or object.tags.water then
        waters:add_row({
            geom = { create = 'area' }
        })
    end
end

function osm2pgsql.process_relation(object)
    local is_water = get_water(object.tags.natural)
    if object.tags.type == 'multipolygon' and (is_water or object.tags.water) then
        waters:add_row({
            -- The 'split_at' setting tells osm2pgsql to split up MultiPolygons
            -- into several Polygon geometries.
            geom = { create = 'area', split_at = 'multi' }
        })
    end
end