TOPOJSON = node_modules/.bin/topojson
TOPOMERGE = node_modules/.bin/topojson-merge
# http://www.naturalearthdata.com/downloads/
NATURAL_EARTH_CDN = http://naciscdn.org/naturalearth
GISCO_CDN = http://ec.europa.eu/eurostat/cache/GISCO/geodatafiles

.PHONY: all nm nm_info
all:
	@echo "The general target is 'nm', otherwise 'nm_info' provides details about the NM shapefile."

.SECONDARY:

nuts: shp/NUTS_2013_01M_SH

nm: topo/FIRs_NM.json

nm_info: shp/FirUir_NM.shp
	ogrinfo -so $< -sql "SELECT * FROM FirUir_NM"

zip/NUTS_2013_01M_SH.zip:
	mkdir -p $(dir $@)
	curl "$(GISCO_CDN)/NUTS_2013_01M_SH.zip" -o $@.download
	mv $@.download $@

# generic scale. valid values are: 01, 03, 10, 20 and 60
zip/NUTS_2013_%M_SH.zip:
	mkdir -p $(dir $@)
	curl "$(GISCO_CDN)/NUTS_2013_$*M_SH.zip" -o $@.download
	mv $@.download $@

#
shp/NUTS_2013_%M_SH: zip/NUTS_2013_%M_SH.zip
	mkdir -p $(dir $@)
	unzip -d shp $<
	touch $@


# target can be: NM or EAD
shp/FirUir_%.shp:
	mkdir -p $(dir $@)
	unzip -d shp zip/FirUir_$*.zip
	touch $@

shp/FirUir_NM.shp:
	mkdir -p $(dir $@)
	unzip -d shp zip/FirUir_NM.zip
	touch $@

# select all european ('E' and 'F') FIRs
geo/FIRs_NM.json: shp/FirUir_NM.shp
	mkdir -p $(dir $@)
	ogr2ogr -f GeoJSON \
		-where "(SUBSTR(AV_AIRSPAC,-3) = 'FIR') AND (SUBSTR(AV_ICAO_ST, 1, 1) = 'E' or SUBSTR(AV_ICAO_ST, 1, 1) = 'L' or AV_ICAO_ST in ('UK', 'UG', 'UD', 'BK', 'GC'))" \
		$@ $<
	touch $@

# simplification (-s) is essential to remove topological issues from originale shapefile
# the value used does not compromise details at all.
# Better understanding from http://stackoverflow.com/a/18921214/963575
#
# The external properties file (argument to '-e') defines which FIRs belong to which FAB
topo/FIRs_NM.json: geo/FIRs_NM.json
	mkdir -p $(dir $@)
	$(TOPOJSON) \
		--force-clockwise \
		-q 1e7 \
		-s 1e-18 \
		-o $@ \
		--id-property AV_AIRSPAC \
		-e data/fabfirs.rp2.csv \
		--properties id=AV_AIRSPAC,icao=AV_ICAO_ST,name=AV_NAME,minfl=MIN_FLIGHT,maxfl=MAX_FLIGHT,fab \
		-- $<

