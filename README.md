## What is inside the Shapefile?

```bash
ogrinfo -so FIR_UIR.shp -sql "SELECT * FROM FIR_UIR"

INFO: Open of `FIR_UIR.shp'
      using driver `ESRI Shapefile' successful.

Layer name: FIR_UIR
Geometry: Polygon
Feature Count: 336
Extent: (-168.973333, -90.000000) - (230.025806, 90.000000)
Layer SRS WKT:
GEOGCS["GCS_WGS_1984",
    DATUM["WGS_1984",
        SPHEROID["WGS_84",6378137.0,298.257223563]],
    PRIMEM["Greenwich",0.0],
    UNIT["Degree",0.0174532925199433],
    VERTCS["WGS_1984",
        DATUM["WGS_1984",
            SPHEROID["WGS_84",6378137.0,298.257223563]],
        PARAMETER["Vertical_Shift",0.0],
        PARAMETER["Direction",1.0],
        UNIT["Meter",1.0]]]
Geometry Column = _ogr_geometry_
ICAO: String (4.0)
IDENT: String (6.0)
NAME: String (52.0)
TYPE: String (3.0)
UPPERLIMIT: String (10.0)
UPPERUNIT: String (2.0)
LOWERLIMIT: String (10.0)
LOWERUNIT: String (2.0)
EFFECTDATE: String (20.0)
```

## Get the FIRs in Eurocontrol's area, i.e. Member States (+ Kosovo if present)

Save Eurocontrol Member States FIR/UIR's in GeoJSON `ectrlfirs.json` file

So take `L` and `E` region plus Ukraine (`UK`), Georgia (`UD`), Armenia (`UD`) and Kosovo (`BK`) [Even if not a member]
and the Canary Islands (`GC`)

```bash
ogr2ogr -f GeoJSON \
   -where "TYPE = 'FIR' AND (SUBSTR(ICAO, 1, 1) = 'E' or SUBSTR(ICAO, 1, 1) = 'L' or SUBSTR(ICAO, 1, 2) in ('UK', 'UG', 'UD', 'BK', 'GC'))" \
   topo/firs.json shp/FIR_UIR.shp
```

Transform to Topojson format and rename some of the properties, output all in `eur_fir.json`

```bash
topojson -o topo/ectrlfirs.json \
   --id-property IDENT --properties \
   name=NAME,type=TYPE,region=ICAO,lowerfl=LOWERLIMIT,upperfl=UPPERLIMIT,WEF=EFFECTDATE \
   -- topo/firs.json
```


## Get the Neighbouring Countries

Could use `ogr2ogr -spat` to limit to bounding box.

> -spat xmin ymin xmax ymax:
> spatial query extents, in the SRS of the source layer(s) (or the one specified with -spat_srs).
> Only features whose geometry intersects the extents will be selected.
> The geometries will not be clipped unless -clipsrc is specified

So from my [earlier experiment](http://bl.ocks.org/espinielli/10587361) we could use

```bash
ogr2ogr -f GeoJSON \
    -where "SCALERANK = 0" \
    -spat -31.266001 27.636311 39.869301 81.008797 \
    topo/europe.json \
    data/ne_10m_admin_0_countries/ne_10m_admin_0_countries.shp
```

