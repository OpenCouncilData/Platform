var d3 = require('d3');
var mapboxgl = require('mapbox-gl');
mapboxgl.accessToken = 'pk.eyJ1Ijoib3BlbmNvdW5jaWxkYXRhIiwiYSI6ImNpd2ZzenhyYzAwbzAydGtpM2duazY5a3IifQ.PY_k9Uatmkim9wRheztCag';
var mdl = require('material-design-lite'); // not sure if this is doing anything
/* jshint esnext:true */

/*
TODO: 
- Fix `npm start` so it actually writes static/bundle.js to disk.
-- (currently you need `npm run build`)
- consider escaping GeoJSON property values (breaking embedded HTML)
✓ add to each topic link in the left side bar the number of councils publishing that topic.
- 'Show preview' button on each map, instead of loading the whole map automatically.
 */

const def = (x, y) => x !== undefined ? x : y;
const topics = require('./topics');

var hiddenFields = [
    'opencouncildatatopic', 'sourcecouncilid', 'sourceurl', // fields created by us, we should clean these up - _prefixed?
    'x','y','lat','lon','long','lng','latitude','longitude', 'easting','northing', 
    'shapestarea','shapestlength'
    ];


function makeMap(topic, mapid) {
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
    function mapPolygonLayer(id, hue, filter) {
        var layer = mapLayer(id, 'Polygon', filter);
        layer.type = 'fill';
        layer.paint = {
            'fill-color': 'hsl(' + hue + ', 50%, 50%)',
            'fill-opacity': 0.9, // 1 for overlay layers?
            'fill-outline-color': 'hsl(' + hue + ', 85%, 65%)'
        };
        return layer;
    }

    function mapLineLayer(id, hue, filter) {
        var layer = mapLayer(id, 'LineString', filter);
        layer.type = 'line';
        layer.paint = {
            'line-color': 'hsl(' + hue + ', 50%, 40%)',
            'line-opacity': 0.9, // 1 for overlay layers?
            'line-width': 3
        };
        return layer;
    }


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
            'icon-size': { stops: [ [ 8, 0.5], [ 11, 1 ] ] }
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

    function propsToFeatureDesc(props, topic) {
        var missingValue = '&nbsp;'//'&lt;MISSING&gt;';

        function getPropLevel(prop) {
            var ret = 'non-standard';
            ['required','recommended','optional'].forEach(level => {
                if (topics[topic][level].indexOf(prop) >= 0) {
                    ret = level;
                }
            });
            return ret;
        }

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

            if (levelProps.length) {
                desc += '<h4 class="featureInfo__propLevelHeading featureInfo__propLevelHeading_' + level + '">' + level + ' fields</h4>';
                desc += '<table>';

                //sortKeys(Object.keys(props)).
                levelProps.forEach(prop => {            
                    desc += '<tr><td class="' + 'prop-key prop-key-' + getPropLevel(prop) + '">' + prop + '</td>';
                    desc += '<td class="prop-value' + (props[prop] === missingValue ? ' prop-value-missing' : '') + '">' + props[prop] + '</td></tr> ';
                    
                });
                desc += '</table>';
            }
        });
        return desc + '</table>';
    }
    

    //if (!mapid)
    //    return;

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
            style.layers.push(mapPolygonLayer('data-polygons', '240'));
            style.layers.push(mapPolygonLayer('data-polygons-good', '95', ['has', 'rub_day']));
            style.layers.push(mapPointLayer('data-points', def(topics[topic].icon, 'star-15'), 'hsl(100,80%,70%)'));
            style.layers.push(mapLineLayer('data-lines', '180'));
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
//Key:herearrytophatharmstrand
//Password:b0a2cba35d8ddad25ccf27ff0291086312407168


function topicHtml(topic) {
    return  `\
    <section class="mdl-grid mdl-grid--no-spacing mdl-shadow--2dp topic-section">\
    <div class="mdl-card mdl-cell mdl-cell--12-col">\
      <div class="mdl-card__supporting-text">\ 
        <a name="${topic}"><h4>${topics[topic].title}</h4></a>\
      </div>` +
    //`  <div class="standardlink"><a href="${topics[topic].standard}">Open Council Data standard</a></div>` +
    //
    (topics[topic.standard] ? `  <div class="standardlink">Standard: <a target="_blank" href="${topics[topic].standard}">${topics[topic].standard}</a></div>`: '')+

/*    '  <div class="mdl-card__actions">' + 
    '    <a href="#" class="mdl-button">Map preview</a>' + 
    '  </div>' + */
    // extra div so that features sit alongside map
    `<div>\
    <div id="${topic}-map" class="preview-map not-loaded">\
        <div class="preview-map-placeholder">Click for preview map</div>\
    </div>\
    <div id="${topic}-featureinfo" class="feature-info"></div>\
    </div>\
    <div class="${topic} feature-count">\
        <table class="-mdl-data-table -mdl-js-data-table mdl-shadow--2dp">\
        <thead>\
            <tr><th class="-mdl-data-table__cell--non-numeric">Council</th><th>Number of features</th></tr>\
        </thead>\
        <tbody></tbody>\
        </table>\
    </div>`;
}




Object.keys(topics).forEach(topic => {
    if (topics[topic].required === undefined) topics[topic].required = [];
    if (topics[topic].recommended === undefined) topics[topic].recommended = [];
    if (topics[topic].optional === undefined) topics[topic].optional = [];
});



['rub', 'grn', 'rec', 'hw'].forEach(waste => { 
    ['_day', '_weeks', '_start'].forEach(attr => {
        if (waste === 'rub')
            topics['garbage-collection-zones'].required.push(waste + attr);
        else
            topics['garbage-collection-zones'].recommended.push(waste + attr);
    });
    ['_desc', '_ok', '_notok', '_url', '_name'].forEach(attr => {
        topics['garbage-collection-zones'].optional.push(waste + attr);
    });
});


//topics = [['garbage-collection-zones', 'Garbage collection zones', 'ciwhgji33009f2ql7j52uo0ui']];
    //topics = [['dog-walking-zones', 'Dog-walking Zones', 'ciwfubtet00582qqouh3szxd4']];

function makeSidebarLinks() {
   // Add links to left side bar
    var links = d3.select('.mdl-layout__drawer .mdl-navigation')
        .selectAll('span.sidebar-link')
        .data(Object.keys(topics));

    links.enter()
        .append('span')
        .merge(links)
        .classed('sidebar-link', true)
        //.classed('mdl-badge', topic => topics[topic]._councilCount )
        //.attr('data-badge', topic => topics[topic]._councilCount)
        .html(topic => {
            var count='';
            if (topics[topic]._councilCount) {
                //count = '33';
                count = `&nbsp;&nbsp;<span class="topic-council-count mdl-color-text--blue">${topics[topic]._councilCount}</span>`;
            }
            //var count = topics[topic]._councilCount ? (` (${topics[topic]._councilCount})`) : '';
            return '<a class="mdl-navigation__link" href="#' + topic + '">' + topics[topic].title + count + '</a>';
            //return '<a class="mdl-navigation__link" href="#' + topic + '">' + topics[topic].title + count + '</a>';
        });
}

function addTopicSections() {

    // Add main sections to body
    d3.select('#overview')
    .selectAll('.topic-section')
    .data(Object.keys(topics))
    .enter()
    .append('section')
    .html(topicHtml);


    Object.keys(topics).forEach(topic => {
        d3.select(`#${topic}-map`).on('click', () => makeMap(topic/*, topics[topic].mapid*/));
    });

    // Create the map preview in each newly created section
    //  Object.keys(topics).forEach(topic => { makeMap(topic/*, topics[topic].mapid*/); });
    //  
    //  
    /* Not yet ready.
    d3.select('main')
    .append('section')
    .classed('mdl-grid mdl-grid--no-spacing mdl-shadow--2dp topic-section', true)
    .html('<div class="mdl-card mdl-cell mdl-cell--12-col">' + 
        '  <div class="mdl-card__supporting-text">' + 
        '    <a name="Developers"><h4>Developers</h4></a>' + 
        '  </div>' +
        require('./developers.md') + 
        '</div>');
    */
}

// get counts of features per council, and hence display topic coverage (side bar) and feature counts (per topic)
function showFeatureCounts() {
    // group_level=2 is important here
    d3.json('https://opencouncildata.cloudant.com/test1/_design/features/_view/topicCoverage?reduce=true&group_level=2&limit=5000', function(data) {
        
        data.rows.forEach(row => {
            var topic = row.key[0];
            var council = row.key[1];
            topics[topic]._councilCount = (topics[topic]._councilCount || 0) + 1;
            topics[topic]._councilCounts = def(topics[topic]._councilCounts, []);
            topics[topic]._councilCounts.push([council, row.value]); //[council] = row.value;

        });
        makeSidebarLinks();

        Object.keys(topics).forEach(function(topic) {
            d3.select('.' + topic + '.feature-count tbody')
            .selectAll('tr')
            .data(def(topics[topic]._councilCounts,[]))
            .enter()
            .append('tr')
            .html(d => '<td>' + d[0] + '</td><td>' + d[1] + '</td>');
        });

    });
}

addTopicSections();
makeSidebarLinks();
showFeatureCounts();