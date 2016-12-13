(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

mapboxgl.accessToken = 'pk.eyJ1Ijoib3BlbmNvdW5jaWxkYXRhIiwiYSI6ImNpd2ZzenhyYzAwbzAydGtpM2duazY5a3IifQ.PY_k9Uatmkim9wRheztCag';

console.log('Did this work2?');

function makeMap(topic, mapid) {
    function mapLayer(id) {
        return {
            layout: {
                visibility: 'visible'
            },
            source: topic, //'composite',
            id: id,
            'source-layer': topic
        };
    }

    function mapPolygonLayer(id, hue, filter) {
        var layer = mapLayer(id);
        layer.type = 'fill';
        layer.paint = {
            'fill-color': 'hsl(' + hue + ', 50%, 40%)',
            'fill-opacity': 0.9, // 1 for overlay layers?
            'fill-outline-color': 'hsl(' + hue + ', 85%, 65%)'
        };
        if (filter) layer.filter = filter;
        return layer;
    }

    function mapPointLayer(id, icon, textColor, filter) {
        var layer = mapLayer(id);
        layer.type = 'symbol';
        layer.layout = {
            'visibility': 'visible',
            'text-field': '{name}',
            'text-size': 12,
            'text-anchor': 'left',
            'text-offset': [0.7, 0],
            'icon-image': icon,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'text-optional': true,
            'icon-size': { stops: [[8, 0.5], [11, 1]] }
        };
        if (topics[topic].icon) layer.layout['icon-image'] = topics[topic].icon;
        layer.filter = ['==', '$type', 'Point'];
        layer.paint = {
            'text-color': textColor,
            'text-halo-color': 'hsl(0,0%,20%)',
            'text-halo-width': 2,
            'text-opacity': {
                stops: [[8, 0], [10, 1]]
            }

        };
        return layer;
    }

    function propsToFeatureDesc(props, topic) {
        var missingValue = '&lt;MISSING&gt;';
        function keyClass(key) {
            var klass = 'prop-key';
            ['required', 'recommended', 'optional'].forEach(function (level) {
                if (topics[topic][level].indexOf(key) >= 0) {
                    klass += ' prop-key-' + level;
                }
            });
            return klass;
        }
        function sortKeys(keys) {
            var t = topics[topic];
            return keys.sort(function (a, b) {
                function v(x) {
                    return !!(t.required.indexOf(x) + 1) * 100 + !!(t.recommended.indexOf(x) + 1) * 10 + !!(t.optional.indexOf(x) + 1);
                }
                return v(b) - v(a) !== 0 ? v(b) - v(a) : a > b ? 1 : -1;
            });
        }

        function addMissingProps(props) {
            topics[topic].required.forEach(function (key) {
                if (props[key] === undefined) {
                    props[key] = missingValue; // possible gotcha: polluting source data
                }
            });
            return props;
        }

        var desc = '<div class="featureInfo__sourceCouncilId">' + props.sourceCouncilId + '</div>';
        //desc += '<div class="featureInfo__sourceUrl"><a href="' + props.sourceUrl + '">Source</a></div>';
        desc += '<span class="mdl-chip">';
        desc += '<span class="mdl-chip__text"><a target="_blank" href="' + props.sourceUrl + '">Source</a></span>';
        desc += '</span>';
        desc += '<table>';
        var hiddenFields = ['openCouncilDataTopic', 'sourceCouncilId', 'sourceUrl'];
        sortKeys(Object.keys(addMissingProps(props))).forEach(function (key) {
            if (hiddenFields.indexOf(key) < 0) {
                desc += '<tr><td class="' + keyClass(key) + '">' + key + '</td>';
                desc += '<td class="prop-value' + (props[key] === missingValue ? ' prop-value-missing' : '') + '">' + props[key] + '</td></tr> ';
            }
        });
        return desc + '</table>';
    }

    //if (!mapid)
    //    return;
    // that's the basemap
    var styleUrl = 'https://api.mapbox.com/styles/v1/opencouncildata/ciwlmjw2y00db2ppa9tmclv7x?access_token=' + mapboxgl.accessToken + '&updated=1';
    d3.json(styleUrl, function (style) {
        style.sources[topic] = { type: 'vector', url: 'mapbox://opencouncildata.' + topic };
        //style.sources.composite.url += ',opencouncildata.' + topic; // should we create a separate vector layer instead? dunno.
        style.layers.push(mapPolygonLayer('data', '240'));
        style.layers.push(mapPolygonLayer('data-good', '95', ['has', 'rub_day']));
        style.layers.push(mapPointLayer('data-points', 'veterinary-15', 'hsl(100,80%,70%)'));
        var map = new mapboxgl.Map({
            container: topic + '-map',
            //style: 'mapbox://styles/opencouncildata/' + mapid + '?update=' + Math.round(Math.random()*100000),
            style: style, //'mapbox://styles/opencouncildata/ciwlmjw2y00db2ppa9tmclv7x', 
            minZoom: 6, // uploaded Geojsons get converted into vector tiles with minzoom 6
            center: [145, -37]
        });

        map.on('mousemove', function (e) {
            // TODO get layers list first so we don't query non-existent layers (causes console log spam)
            var features = map.queryRenderedFeatures(e.point, { layers: ['data-points'] }); // TODO finalise layer names (data-poly, data-points?)
            if (!features || features.length === 0) features = map.queryRenderedFeatures(e.point, { layers: ['data'] });
            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = features && features.length ? 'pointer' : '';
            if (features && features.length) {
                var featureDesc = propsToFeatureDesc(features[0].properties, topic);
                $('#' + topic + '-featureinfo').html(featureDesc);
                //console.log(features);
            }
        });
    });
}
//Key:herearrytophatharmstrand
//Password:b0a2cba35d8ddad25ccf27ff0291086312407168


function topicHtml(topic) {
    return '<section class="mdl-grid mdl-grid--no-spacing mdl-shadow--2dp topic-section">' + '<div class="mdl-card mdl-cell mdl-cell--12-col">' + '  <div class="mdl-card__supporting-text">' + '    <a name="' + topic + '"><h4>' + topics[topic].title + '</h4></a>' + '  </div>' +
    /*    '  <div class="mdl-card__actions">' + 
        '    <a href="#" class="mdl-button">Map preview</a>' + 
        '  </div>' + */
    '<div>' + // so that features sit alongside map
    '<div id="' + topic + '-map" class="preview-map "></div>' + '<div id="' + topic + '-featureinfo" class="feature-info"></div>    ' + '</div>' + '<div class="' + topic + ' feature-count">' + '<table class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">' + '<thead>' + '<tr><th class="mdl-data-table__cell--non-numeric">Council</th><th>Number of features</th></tr>' + '</thead>' + '<tbody></tbody>' + '</table>' + '</div>';
}

var topics = {
    'garbage-collection-zones': {
        title: 'Garbage collection zones', mapid: 'ciwhgji33009f2ql7j52uo0ui',
        recommended: ['name'], // plus more, see below
        optional: ['info_url']
    },
    'public-toilets': { title: 'Public toilets', icon: 'toilet-15' }, // mapid: 'ciwhghnv300802qqoyubh8j3h', 
    'dog-walking-zones': { title: 'Dog-walking Zones', mapid: 'ciwfubtet00582qqouh3szxd4' },
    'parking-zones': { title: 'Parking zones', mapid: 'ciwgcmgzc007n2ppaegfuhf76/' },
    'footpaths': { title: 'Footpaths' },
    'customer-service-centres': { title: 'Customer service centres', icon: 'town-hall-15' } /*, mapid: 'ciwhs1gi7009g2qmt41ftdmmi' */
};

Object.keys(topics).forEach(function (topic) {
    if (topics[topic].required === undefined) topics[topic].required = [];
    if (topics[topic].recommended === undefined) topics[topic].recommended = [];
    if (topics[topic].optional === undefined) topics[topic].optional = [];
});

['rub', 'grn', 'rec', 'hw'].forEach(function (waste) {
    ['_day', '_weeks', '_start'].forEach(function (attr) {
        topics['garbage-collection-zones'].required.push(waste + attr);
    });
    ['_desc', '_ok', '_notok', '_url', '_name'].forEach(function (attr) {
        topics['garbage-collection-zones'].optional.push(waste + attr);
    });
});

//topics = [['garbage-collection-zones', 'Garbage collection zones', 'ciwhgji33009f2ql7j52uo0ui']];
//topics = [['dog-walking-zones', 'Dog-walking Zones', 'ciwfubtet00582qqouh3szxd4']];

function addTopicSections() {

    // Add main sections to body
    d3.select('#overview').selectAll('.topic-section').data(Object.keys(topics)).enter().append('section').html(topicHtml);

    // Create the map preview in each newly created section
    Object.keys(topics).forEach(function (topic) {
        makeMap(topic /*, topics[topic].mapid*/);
    });

    // Add links to left side bar
    d3.select('.mdl-layout__drawer .mdl-navigation').selectAll('span').data(Object.keys(topics)).enter().append('span').html(function (topic) {
        return '<a class="mdl-navigation__link" href="#' + topic + '">' + topics[topic].title + '</a>';
    });
}

addTopicSections();

d3.json('https://opencouncildata.cloudant.com/test1/_design/features/_view/topicCounts?reduce=true', function (data) {
    Object.keys(topics).forEach(function (topic) {
        var values = data.rows[0].value[topic];
        if (!values) return;
        var counts = [];
        Object.keys(values).forEach(function (key) {
            counts.push([key, values[key]]);
        });

        d3.select('.' + topic + '.feature-count tbody').selectAll('tr').data(counts).enter().append('tr').html(function (d) {
            return '<td>' + d[0] + '</td><td>' + d[1] + '</td>';
        });
    });
});

},{}]},{},[1]);
