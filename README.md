## Prerequisites

You need [`jq`](https://stedolan.github.io/jq/) for some of the JSON files processing.
See the *Download* page for how to install it on your platform.


## What is inside the Shapefile?

```bash
$ make info
```


## Get the FIRs in Eurocontrol's area, i.e. Member States (+ Kosovo if present)

Generate the topojson file for European FIRs

```bash
$ make topo/FIRs_NM.json
```
