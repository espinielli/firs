/*jslint browser: true, devel: true */
var d3, queue, vis, params, topojson;
(function () {
    "use strict";
    vis = {};
    var width, height,
        chart, svg, g, active, background,
        path,
        defs, style,
        slider, step, maxStep, running, sv, timer,
        button,

        countryfirs = {
            "EB": ["EBBUFIR", "EBURUIR"],
            "ED": ["EDGGFIR", "EDMMFIR", "EDUUUIR", "EDVVUIR", "EDWWFIR"],
            "EH": ["EHAAFIR"],
            "LF": ["LFBBFIR", "LFEEFIR", "LFFFFIR", "LFFFUIR", "LFMMFIR", "LFRRFIR"],
            "LS": ["LSASFIR", "LSASUIR"],
            "EP": ["EPWWFIR"],
            "EY": ["EYVLFIR", "EYVLUIR"],
            "LC": ["LCCCFIR", "LCCCUIR"],
            "LG": ["LGGGFIR", "LGGGUIR"],
            "LI": ["LIBBFIR", "LIBBUIR", "LIMMFIR", "LIMMUIR", "LIRRFIR", "LIRRUIR"],
            "LM": ["LMMMFIR", "LMMMUIR"],
            "LB": ["LBSRFIR"],
            "LR": ["LRBBFIR"],
            "EK": ["EKDKFIR"],
            "ES": ["ESAAFIR"],
            "LD": ["LDZOFIR"],
            "LH": ["LHCCFIR"],
            "LJ": ["LJLAFIR"],
            "LK": ["LKAAFIR"],
            "LO": ["LOVVFIR"],
            "LQ": ["LQSBFIR", "LQSBUIR"],
            "LZ": ["LZBBFIR"],
            "EE": ["EETTFIR"],
            "EF": ["EFINFIR", "EFINUIR"],
            "EN": ["ENOBFIR", "ENORFIR"],
            "EV": ["EVRRFIR"],
            "GC": ["GCCCFIR", "GCCCUIR"],
            "LE": ["LECBFIR", "LECBUIR", "LECMFIR", "LECMUIR"],
            "LP": ["LPPCFIR"],
            "EG": ["EGPXFIR", "EGPXUIR", "EGTTFIR", "EGTTUIR"],
            "EI": ["EISNFIR", "EISNUIR"]
        },
        fabfirs = [
            {
                "name": "BALTIC FAB",
                "id": "BALTICFAB",
                "countryfirs": ["EPWW", "EYVL"]
            },
            {
                "name": "BLU MED FAB",
                "id": "BLUMEDFAB",
                "countryfirs": [
                    "LGGG",
                    "LIBB", "LIMM", "LIRR",
                    "LMMM",
                    "LCCC"
                ]
            },
            {
                "name": "DANUBE FAB",
                "id": "DANUBEFAB",
                "countryfirs": ["LBSR", "LRBB"]
            },
            {
                "name": "DK-SE FAB",
                "id": "DKSEFAB",
                "countryfirs": ["EKDK", "ESAA"]
            },
            {
                "name": "FABEC",
                "id": "FABEC",
                "countryfirs": [
                    "EDGG", "EDMM", "EDWW",
                    "LFBB", "LFEE", "LFFF", "LFMM", "LFRR",
                    "EBBU",
                    "EHAA",
                    "LSAS"
                ]
            },
            {
                "name": "FAB CE",
                "id": "FABCE",
                "countryfirs": [
                    "LDZO",
                    "LHCC",
                    "LJLA",
                    "LKAA",
                    "LOVV",
                    "LQSB",
                    "LZBB"
                ]
            },
            // {
            //     "name": "FAB CE (RP1)",
            //     "id": "FABCE1",
            //     "countryfirs": ["LHCCFIR", "LJLAFIR", "LKAAFIR", "LOVVFIR", "LZBBFIR"]
            // },
            // {
            //     "name": "FABCE (RP2)",
            //     "id": "FABCE2",
            //     "countryfirs": ["LDZOFIR", "LHCCFIR", "LJLAFIR", "LKAAFIR", "LOVVFIR", "LZBBFIR"]
            // },
            {
                "name": "NEFAB",
                "id": "NEFAB",
                "countryfirs": [
                    "EETT",
                    "EFIN",
                    "ENOB", "ENOR",
                     "EVRR"
                 ]
            },
            {
                "name": "SW FAB",
                "id": "SWFAB",
                "countryfirs": [
                    "LECM", "LECB",
                    "LPPC",
                    "GCCC"
                ]
            },
            {
                "name": "UK-Ireland FAB",
                "id": "UKIRELANDFAB",
                "countryfirs": [
                    "EGPX", "EGTT",
                    "EISN"
                ]
            }
        ];


    // general design from
    // http://www.jeromecukier.net/blog/2013/11/20/getting-beyond-hello-world-with-d3/
    vis.init = function (params) {
        console.log("in init, params: " + JSON.stringify(params));
        var pars = params || {};

        chart = d3.select(pars.chart || "#chart"); // placeholder div for svg
        width = pars.width || 960;
        height = pars.height || 500;
        active = d3.select(null);

        svg = chart.selectAll("svg")
            .data([{width: width, height: height}]).enter()
            .append("svg");
        svg.attr({
            width:  function (d) { return d.width; },
            height: function (d) { return d.height; }
        });

        background = svg.selectAll("rect.background")
            .data([{}]).enter()
            .append("rect")
            .classed("background", true);


        g = svg.selectAll("g.all")
            .data([{}]).enter()
            .append("g")
            .classed("all", true);

        // vis.init can be re-ran to pass different height/width values
        // to the svg. this doesn't create new svg elements.

        style = svg.selectAll("style")
            .data([{}]).enter()
            .append("style")
            .attr("type", "text/css");
        // this is where we can insert style that will affect the svg directly.

        defs = svg.selectAll("defs").data([{}]).enter()
            .append("defs");
        // this is used if it's necessary to define gradients, patterns etc.

        // the following will implement interaction around a slider and a
        // button. repeat/remove as needed.
        // note that this code won't cause errors if the corresponding elements
        // do not exist in the HTML.
        slider = d3.select(params.slider || ".slider");

        if (slider[0][0]) {
            maxStep = slider.property("max");
            step = slider.property("value");
            slider.on("change", function () {
                vis.stop();
                step = this.value;
                vis.draw(pars);
            });
            running = pars.running || 0; // autorunning off or manually set on
        } else {
            running = -1; // never attempt auto-running
        }
        button = d3.select(pars.button || ".button");
        if (button[0][0] && running > -1) {
            button.on("click", function () {
                if (running) {
                    vis.stop();
                } else {
                    vis.start();
                }
            });
        }

        vis.loaddata(pars);
    };

    function ready(error, firs, world, wnames) {
        if (error) {
            console.error(error);
        }

        vis.firs = firs;
        vis.world = world;
        vis.wnames = wnames;
        if (running > 0) {
            vis.start();
        } else {
            vis.draw(params);
        }
    }

    vis.loaddata = function (params) {
        console.log("in loaddata, params: " + JSON.stringify(params));
        if (!params) { params = {}; }

        // if `params.refresh` is set/true forces the browser to reload the file
        // and not use the cached version due to URL being different (but the filename is the same)
        var topo = (params.topo || "ectrlfirs.json") + (params.refresh ? ("#" + Math.random()) : "");
        var world = (params.world || "world-50m.json") + (params.refresh ? ("#" + Math.random()) : "");
        var names = (params.worldnames || "world-country-names.tsv") + (params.refresh ? ("#" + Math.random()) : "");

        queue()
            .defer(d3.json, topo)
            .defer(d3.json, world)
            .defer(d3.tsv, names)
            .await(ready);
    };

    vis.play = function () {
        if (i === maxStep && !running) {
            step = -1;
            vis.stop();
        }

        if (i < maxStep) {
            step = step + 1;
            running = 1;
            d3.select(".stop").html("Pause").on("click", vis.stop(params));
            slider.property("value", sv);
            vis.draw(params);
        } else {
            vis.stop();
        }
    };

    vis.start = function (params) {
        timer = setInterval(function () { vis.play(params); }, 50);
    };

    vis.stop = function (params) {
        clearInterval(timer);
        running = 0;
        d3.select(".stop").html("Play").on("click", vis.start(params));
    };

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 8000])
        .on("zoom", zoomed);

    function zoomed() {
        g.style("stroke-width", 1.5 / d3.event.scale + "px");
        g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    // If the drag behavior prevents the default click,
    // also stop propagation so we don’t click-to-zoom.
    function stopped() {
      if (d3.event.defaultPrevented) d3.event.stopPropagation();
    }

    function reset() {
        active.classed("active", false);
        active = d3.select(null);
        svg.transition()
            .duration(750)
            .call(zoom.translate([0, 0]).scale(1).event);
    }

    function clicked(d) {
        if (active.node() === this) {
            return reset();
        }
        active.classed("active", false);
        active = d3.select(this).classed("active", true);

        var bounds = path.bounds(d),
            dx = bounds[1][0] - bounds[0][0],
            dy = bounds[1][1] - bounds[0][1],
            x = (bounds[0][0] + bounds[1][0]) / 2,
            y = (bounds[0][1] + bounds[1][1]) / 2,
            scale = .9 / Math.max(dx / width, dy / height),
            translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
            .duration(750)
            .call(zoom.translate(translate).scale(scale).event);
    }

    vis.draw = function (params) {
        // make stuff here!
        console.log("in draw, params: " + JSON.stringify(params));
        var pars = params || {},
            scale = pars.scale || 600,
            projection = d3.geo.albers()
                .center([0, 55.4])
                .rotate([4.4, 0])
                .parallels([50, 60])
                .scale(scale)
                .translate([width / 2, height / 2]),
            fff = vis.firs.objects.FIRs_NM,
            firs = topojson.feature(vis.firs, fff),

            tooltip = d3.select("#tooltip").classed("hidden", true),
            countryname = d3.select("#countryname"),
            graticule = d3.geo.graticule(),

            land = topojson.feature(vis.world, vis.world.objects.land),
            countries = topojson.feature(vis.world, vis.world.objects.countries).features,
            borders = topojson.mesh(vis.world, vis.world.objects.countries, function (a, b) { return a.id !== b.id; }),
            country,
            fir,
            uir;

        path = d3.geo.path()
            .projection(projection);

        countries.forEach(function (d) {
            vis.wnames.some(function (n) {
                if (+d.id === +n.id) {
                    d.name = n.name;
                    return d.name;
                }
            });
        });

        svg.on("click", stopped, true);
        background.on("click", reset);
        g.style("stroke-width", "0.5px");

        svg
            .call(zoom) // delete this line to disable free zooming
            .call(zoom.event);

        svg.on("mousemove", function () {
            // update tooltip position
            tooltip.style("top", (event.pageY + 16) + "px").style("left", (event.pageX + 10) + "px");
            return true;
        });


        svg.selectAll(".path.graticule")
            .data([graticule]).enter()
            .append("path")
            .classed("graticule", true)
            .attr("d", path);


        country = g.selectAll(".country")
            .data(countries)
            .enter().insert("path", ".graticule")
            .attr("class", function (d) {return "country country" + d.id; })
            .attr("d", path)
            .text(function (d) { return d.id; })
            .on("mouseover", function (d, i) {
                d3.select(this).style({'stroke-opacity': 1, 'stroke': '#F00'});
                // http://stackoverflow.com/questions/17917072/#answer-17917341
                // d3.select(this.parentNode.appendChild(this)).style({'stroke-opacity':1,'stroke':'#F00'});
                if (d.id) {
                    tooltip.classed("hidden", false);
                    countryname.text(d.name);
                }
            })
            .on("mouseout", function () {
                this.style.stroke = "none";
                tooltip.classed("hidden", true);
            })
            .on("mousedown.log", function (d) {
                console.log("id=" + d.id + "; name=" + d.name + "; centroid=[" + path.centroid(d) + "] px.");
            });

        //  FIRs
        fir = g.selectAll(".fir")
                .data(firs.features)
            .enter().insert("path", ".graticule")
                .attr("class", function (d) { return "fir " + d.id; })
                .attr("d", path)
            .on("click", clicked)
            .on("mouseover", function (d) {
                d3.select(this).style("fill", "red");
                tooltip.classed("hidden", false);
                countryname.text(d.id + "; " + d.properties.name);
            })
            .on("mouseleave", function () {
                d3.select(this).style("fill", "#ddc");
                tooltip.classed("hidden", true);
            });

        // intra FIR borders
        g.selectAll(".fir-boundary")
            .data([topojson.mesh(vis.firs, fff, function (a, b) {
                return a !== b;
            })])
            .enter().insert("path", ".graticule")
            .attr("d", path)
            .attr("class", "fir-boundary");

        // // // external borders
        g.selectAll("fir-boundary ECTRL")
            .data([topojson.mesh(vis.firs, fff, function (a, b) {
                return a === b;
            })])
            .enter().insert("path", ".graticule")
            .attr("d", path)
            .attr("class", "fir-boundary ECTRL");


        fabfirs.forEach(function (fab) {
            g.insert("path", ".graticule")
                .datum(topojson.merge(vis.firs, fff.geometries.filter(function (d) {
                    if (fab.id === "FABEC") {
                        console.log("id: " + d.id);
                        console.log(d.id + (_.includes(fab.countryfirs, d.id) ? " " : " not ") + "included");
                    }
                    return _.includes(fab.countryfirs, d.id);
                })))
                .attr("class", "fab " + fab.id)
                .attr("d", path)
                .on("mouseover", function (d) {
                    d3.select(this).style("fill", "red");
                    tooltip.classed("hidden", false);
                    countryname.text(fab.name);
                })
                .on("mouseleave", function () {
                    d3.select(this).style("fill", "#ddc");
                    tooltip.classed("hidden", true);
                });
        });
    };

}());
