/* jshint esnext:true */
const topics = require('./topics');
const def = (x, y) => x !== undefined ? x : y;
var d3 = require('d3');
var mapboxgl = require('mapbox-gl');
mapboxgl.accessToken = 'pk.eyJ1Ijoib3BlbmNvdW5jaWxkYXRhIiwiYSI6ImNpd2ZzenhyYzAwbzAydGtpM2duazY5a3IifQ.PY_k9Uatmkim9wRheztCag';

/*
  Create a map preview element, constructing and styling a Mapbox map.
*/
module.exports = function (topic, mapid) {
    function layerFilter(layerType, filter) {
        var typeFilter = ['==', '$type', layerType];
        return filter ? ['all', filter, typeFilter] : typeFilter;
    }
    function mapLayer(id, layerType, filter) {
        return {
            layout: {
                visibility: 'visible'
            },
            source: topic,
            id: id,
            filter: layerFilter(layerType, filter),
            'source-layer': (topics[topic].layerid ? topics[topic].layerid : topic) // hopefully we never need this.
        };
    }
    // create a polygon based layer for a given datasource id.
    function mapPolygonLayer(id, hue, filter) {
        var layer = mapLayer(id, 'Polygon', filter);
        layer.type = 'fill';
        layer.paint = {
            'fill-color': `hsl(${hue}, 50%, 50%)`,
            'fill-opacity': 0.9, // 1 for overlay layers?
            'fill-outline-color': `hsl(${hue}, 85%, 65%)`
        };
        return layer;
    }

    // create a line based layer for a given datasource id.
    function mapLineLayer(id, hue, filter) {
        var layer = mapLayer(id, 'LineString', filter);
        layer.type = 'line';
        layer.paint = {
            'line-color': `hsl(${hue}, 50%, 40%)`,
            'line-opacity': 0.9, // 1 for overlay layers?
            'line-width': 3
        };
        return layer;
    }

    // create a symbol based layer for a given datasource id.
    function mapPointLayer(id, icon, textColor, maxzoom, filter) {
        var layer = mapLayer(id, 'Point', filter);
        layer.type = 'symbol';
        layer.layout = {
            'visibility': 'visible',
            'text-field': '{name}',
            'text-size':  12,
            'text-anchor': 'left',
            'text-offset': [0.7, 0],
            'icon-image': icon,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-optional': true,
            'icon-size': { stops: [[8, 0.5], [11, 1]]}
        };
        if (icon)
            layer.layout['icon-image'] = icon;
        if (maxzoom)
            layer.maxzoom = maxzoom;
        layer.paint = { 
            'text-color': textColor ,
            'text-halo-color': 'hsl(0,0%,20%)',
            'text-halo-width': 2,
            'text-opacity': {
                stops: [
                    [8, 0],
                    [10, 1]
                ]
            }

        };
        return layer;
    }
    /*
        Turn the set of available properties for a feature into an HTML description that highlights the level of compliance
        with the standard.
    */
    function propsToFeatureDesc(props, topic) {
        var missingValue = '&nbsp;'; //'&lt;MISSING&gt;';
        var hiddenFields = [
            'opencouncildatatopic', 'sourcecouncilid', 'sourceurl', // fields created by us, we should clean these up - _prefixed?
            'x','y','lat','lon','long','lng','latitude','longitude', 'easting','northing', 
            'shapestarea','shapestlength'];


        function getPropLevel(prop) {
            var ret = 'non-standard';
            ['required','recommended','optional'].forEach(level => {
                if (topics[topic][level].indexOf(prop) >= 0) {
                    ret = level;
                }
            });
            return ret;
        }

        // Add a placeholder value for missing property values, so the omission is visible.
        function addMissingProps(props) {
            topics[topic].required.forEach(function (key) {
                if (props[key] === undefined) {
                    props[key] = missingValue; // possible gotcha: polluting source data
                }
            });
            return props;
        }

        var desc = `<div class="featureInfo__sourceCouncilId">${props.sourceCouncilId}</div>`;
        //desc += '<div class="featureInfo__sourceUrl"><a href="' + props.sourceUrl + '">Source</a></div>';
        desc += '<span class="mdl-chip">';
        desc += `<span class="mdl-chip__text"><a target="_blank" href="${props.sourceUrl}">Source</a></span>`;
        desc += '</span>';
        props = addMissingProps(props);

        ['Required','Recommended','Optional','Non-standard'].forEach(level => {
            var levelProps = Object.keys(props)
                .filter(prop => getPropLevel(prop) === level.toLowerCase() && hiddenFields.indexOf(prop.toLowerCase()) < 0);

            if (!levelProps.length)
                return;

            desc += '<h4 class="featureInfo__propLevelHeading featureInfo__propLevelHeading_' + level + '">' + level + ' fields</h4>';
            desc += '<table>' +
                levelProps.map(prop =>
                    '<tr><td class="' + 'prop-key prop-key-' + getPropLevel(prop) + '">' + prop + '</td>' +
                    '<td class="prop-value' + (props[prop] === missingValue ? ' prop-value-missing' : '') + '">' + props[prop] + '</td></tr> '
                ).join`` +
            '</table>';
        
        });
        return desc;
    }
    

    // uh, how do we remove an event handler?
    if (!d3.select(`#${topic}-map`).classed('not-loaded'))
        return;
    // that's the basemap

    var styleUrl = 'https://api.mapbox.com/styles/v1/opencouncildata/ciwlmjw2y00db2ppa9tmclv7x?access_token=' + mapboxgl.accessToken + '&updated=1';
    d3.json(styleUrl, style => {
        d3.select(`#${topic}-map`).classed('not-loaded', false);
        d3.select(`#${topic}-map .preview-map-placeholder`).remove();
        if (topics[topic].mapid !== undefined) {
            style = 'mapbox://styles/opencouncildata/' + topics[topic].mapid;
        } else {
            style.sources[topic] = { 
                type: 'vector', 
                // some tilesets have funky names. can't rename them
                url: 'mapbox://opencouncildata.' + (topics[topic].tilesetid ? topics[topic].tilesetid : topic) + '?fresh=3'
            };
            // console.log(style.sources);
            // Currently we naively create all types of layers for all topics.
            style.layers.push(mapPolygonLayer('data-polygons', 10));
            style.layers.push(mapPolygonLayer('data-polygons-good', 95, ['has', 'rub_day']));
            style.layers.push(mapPointLayer('data-points', def(topics[topic].icon, 'star-15'), 'hsl(100,80%,70%)'));
            style.layers.push(mapLineLayer('data-lines', 180));
            if (topics[topic].polygons && topics[topic].polygons.points) {
                var pp = topics[topic].polygons.points;
                var layer = mapPointLayer('data-polygon-points', def(pp.icon, 'roadblock-15'), 'hsl(240,80%,70%)', def(pp.maxzoom, 12));
                delete(layer.filter);
                //layer.filter = undefined;
                style.layers.push(layer);
            }
        }
        var map = new mapboxgl.Map({
            container: topic + '-map',
            //style: 'mapbox://styles/opencouncildata/' + mapid + '?update=' + Math.round(Math.random()*100000),
            style: style,//'mapbox://styles/opencouncildata/ciwlmjw2y00db2ppa9tmclv7x', 
            minZoom: def(topics[topic].minZoom, 6), // uploaded Geojsons get converted into vector tiles with minzoom 6
            center: [145,-37]
        });

        map.on('mousemove', e => {
            // TODO get layers list first so we don't query non-existent layers (causes console log spam)
            var features = map.queryRenderedFeatures(e.point, { layers: ['data-points'] }); // TODO finalise layer names (data-poly, data-points?)
            if (!features || features.length === 0)
                features = map.queryRenderedFeatures(e.point, { layers: ['data-lines'] }); 
            if (!features || features.length === 0)
                features = map.queryRenderedFeatures(e.point, { layers: ['data-polygons'] }); 
            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = (features && features.length) ? 'pointer' : '';
            if (features && features.length) {
                var featureDesc = propsToFeatureDesc(features[0].properties, topic);
                //$('#' + topic + '-featureinfo').html(featureDesc);
                d3.select('#' + topic + '-featureinfo').html(featureDesc);
                //console.log(features);
            }
        });
    });
}