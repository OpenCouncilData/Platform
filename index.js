mapboxgl.accessToken = 'pk.eyJ1Ijoib3BlbmNvdW5jaWxkYXRhIiwiYSI6ImNpd2ZzenhyYzAwbzAydGtpM2duazY5a3IifQ.PY_k9Uatmkim9wRheztCag';

function makeMap(topic, mapid) {
    //return;
    if (!mapid)
        return;
    var map = new mapboxgl.Map({
        container: topic + '-map',
        style: 'mapbox://styles/opencouncildata/' + mapid + '?update=' + Math.round(Math.random()*100000),
        minZoom: 6, // uploaded Geojsons get converted into vector tiles with minzoom 6
        center: [145,-37]
    });

    function propsToFeatureDesc(props) {
        var desc ='<table>';
        Object.keys(props).forEach(function(key) {
            if (key !== 'openCouncilDataTopic') {
                desc += '<tr><td class="prop-key">' + key + '</td>';
                desc += '<td class="prop-value">' + props[key] + '</td></tr> ';
            }
        });
        return desc + '</table>';
    }

    map.on('mousemove', function(e) {
        var features = map.queryRenderedFeatures(e.point, { layers: ['data'] }); // change original to data? what called now?
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = (features && features.length) ? 'pointer' : '';
        if (features && features.length) {
            var featureDesc = propsToFeatureDesc(features[0].properties);
            $('#' + topic + '-featureinfo').html(featureDesc);
            //console.log(features);
        }
    });
}
//Key:herearrytophatharmstrand
//Password:b0a2cba35d8ddad25ccf27ff0291086312407168


function topicHtml(topicname) {
    var topic = topicname[0];
    var name = topicname[1];
    return  '<section class="mdl-grid mdl-grid--no-spacing mdl-shadow--2dp topic-section">' + 
    '<div class="mdl-card mdl-cell mdl-cell--12-col">' + 
    '  <div class="mdl-card__supporting-text">' + 
    '    <a name="' + topic + '"><h4>' + name + '</h4></a>' + 
    '  </div>' + 
/*    '  <div class="mdl-card__actions">' + 
    '    <a href="#" class="mdl-button">Map preview</a>' + 
    '  </div>' + */
    '<div>' + // so that features sit alongside map
    '<div id="' + topic + '-map" class="preview-map "></div>' + 
    '<div id="' + topic + '-featureinfo" class="featureinfo"></div>    ' + 
    '</div>' +
    '<div class="' + topic + ' feature-count">' +
    '<table class="mdl-data-table mdl-js-data-table mdl-shadow--2dp">' +
    '<thead>' +
    '<tr><th class="mdl-data-table__cell--non-numeric">Council</th><th>Number of features</th></tr>' +
    '</thead>' +
    '<tbody></tbody>' +
    '</table>' +
    '</div>';
}

var topics = [
    ['garbage-collection-zones', 'Garbage collection zones', 'ciwhgji33009f2ql7j52uo0ui'],
    ['public-toilets', 'Public toilets', 'ciwhghnv300802qqoyubh8j3h'], 
    ['dog-walking-zones', 'Dog-walking Zones', 'ciwfubtet00582qqouh3szxd4'],
    ['parking-zones', 'Parking zones', 'ciwgcmgzc007n2ppaegfuhf76/'],
    ['footpaths', 'Footpaths'],
    ['customer-service-centres', 'Customer service centres', 'ciwhs1gi7009g2qmt41ftdmmi']];


function addTopicSections() {

    // Add main sections to body
    d3.select('#overview')
    .selectAll('.topic-section')
    .data(topics)
    .enter()
    .append('section')
    .html(topicHtml);

    // Create the map preview in each newly created section
    topics.forEach(function(topic) { makeMap(topic[0], topic[2]); });

    // Add links to left side bar
    d3.select('.mdl-layout__drawer .mdl-navigation')
    .selectAll('span')
    .data(topics)
    .enter()
    .append('span')
    .html(function(tn) {
        return '<a class="mdl-navigation__link" href="#' + tn[0] + '">' + tn[1] + '</a>';
    });

    

}

addTopicSections();

d3.json('https://opencouncildata.cloudant.com/test1/_design/features/_view/topicCounts?reduce=true', function(data) {
    topics.forEach(function(topicInfo) {
        var topic = topicInfo[0];
        var values = data.rows[0].value[topic];
        if (!values)
            return;
        var counts = [];
        Object.keys(values).forEach(function(key) {
            counts.push([key, values[key]]);
        });

        d3.select('.' + topic + '.feature-count tbody')
        .selectAll('tr')
        .data(counts)
        .enter()
        .append('tr')
        .html(function(d) { return '<td>' + d[0] + '</td><td>' + d[1] + '</td>'; });
    });

});