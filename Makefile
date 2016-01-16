TOPOJSON = node_modules/.bin/topojson
TOPOMERGE = node_modules/.bin/topojson-merge
# http://www.naturalearthdata.com/downloads/
NATURAL_EARTH_CDN = http://naciscdn.org/naturalearth
GISCO_CDN = http://ec.europa.eu/eurostat/cache/GISCO/geodatafiles

all:

.PHONY: nm_info

.SECONDARY:

nuts: shp/NUTS_2013_01M_SH

nm: shp/FirUir_NM/FirUir_NM.shp

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

topo/FIRs_NM.json: geo/FIRs_NM.json
	mkdir -p $(dir $@)
	$(TOPOJSON) \
		-o $@ \
		--id-property AV_AIRSPAC \
		--properties id=AV_AIRSPAC,icao2=AV_ICAO_ST,name=AV_NAME,minfl=MIN_FLIGHT,maxfl=MAX_FLIGHT \
		-- $<



# from mbostok's World Atlas
zip/ne_10m_land.zip:
	mkdir -p $(dir $@)
	curl "$(NATURAL_EARTH_CDN)/10m/physical/ne_10m_land.zip" -o $@.download
	mv $@.download $@

zip/ne_10m_%.zip:
	mkdir -p $(dir $@)
	curl "$(NATURAL_EARTH_CDN)/10m/cultural/ne_10m_$*.zip" -o $@.download
	mv $@.download $@

zip/ne_50m_land.zip:
	mkdir -p $(dir $@)
	curl "$(NATURAL_EARTH_CDN)/50m/physical/ne_50m_land.zip" -o $@.download
	mv $@.download $@

zip/ne_50m_%.zip:
	mkdir -p $(dir $@)
	curl "$(NATURAL_EARTH_CDN)/50m/cultural/ne_50m_$*.zip" -o $@.download
	mv $@.download $@

zip/ne_110m_land.zip:
	mkdir -p $(dir $@)
	curl "$(NATURAL_EARTH_CDN)/110m/physical/ne_110m_land.zip" -o $@.download
	mv $@.download $@

zip/ne_110m_%.zip:
	mkdir -p $(dir $@)
	curl "$(NATURAL_EARTH_CDN)/110m/cultural/ne_110m_$*.zip" -o $@.download
	mv $@.download $@

# Admin 0 – land (3.17M)
shp/ne_%_land.shp: zip/ne_%_land.zip
	mkdir -p $(dir $@)
	unzip -d shp $<
	touch $@

# Admin 0 – countries (5.08M)
shp/ne_%_admin_0_countries.shp: zip/ne_%_admin_0_countries.zip
	mkdir -p $(dir $@)
	unzip -d shp $<
	touch $@

# Admin 0 – countries without boundary lakes (5.26M)
shp/ne_%_admin_0_countries_lakes.shp: zip/ne_%_admin_0_countries_lakes.zip
	mkdir -p $(dir $@)
	unzip -d shp $<
	touch $@

# Admin 1 - states, provinces (13.97M)
# - removes the redundant _shp suffix for consistency
shp/ne_%_admin_1_states_provinces.shp: zip/ne_%_admin_1_states_provinces_shp.zip
	mkdir -p $(dir $@)
	unzip -d shp $<
	for file in shp/ne_$*_admin_1_states_provinces_shp.*; do mv $$file shp/ne_$*_admin_1_states_provinces"$${file#*_shp}"; done
	touch $@

# Admin 1 - states, provinces without large lakes (14.11M)
# - removes the redundant _shp suffix for consistency
shp/ne_%_admin_1_states_provinces_lakes.shp: zip/ne_%_admin_1_states_provinces_lakes_shp.zip
	mkdir -p $(dir $@)
	unzip -d shp $<
	for file in shp/ne_$*_admin_1_states_provinces_lakes_shp.*; do mv $$file shp/ne_$*_admin_1_states_provinces_lakes"$${file#*_shp}"; done
	touch $@

topo/world-%.json: shp/ne_%_admin_0_countries.shp
	mkdir -p $(dir $@)
	$(TOPOJSON) \
		--quantization 1e5 \
		--id-property=+iso_n3 \
		-- countries=shp/ne_$*_admin_0_countries.shp \
		| $(TOPOMERGE) \
			-o $@ \
			--io=countries \
			--oo=land \
			--no-key
