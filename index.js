mapboxgl.accessToken = 'pk.eyJ1Ijoib3BlbmNvdW5jaWxkYXRhIiwiYSI6ImNpd2ZzenhyYzAwbzAydGtpM2duazY5a3IifQ.PY_k9Uatmkim9wRheztCag';

function makeMap(topic, mapid) {
    if (!mapid)
        return;
    var map = new mapboxgl.Map({
        container: topic + '-map',
        style: 'mapbox://styles/opencouncildata/' + mapid // ##update
    });

    function propsToFeatureDesc(props) {
        var desc ='';
        Object.keys(props).forEach(function(key) {
            desc += '<span class="prop-key">' + key + '</span>';
            desc += '<span class="prop-value">' + props[key] + '</span> ';
        });
        return desc;
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
    '  <div class="mdl-card__actions">' + 
    '    <a href="#" class="mdl-button">Map preview</a>' + 
    '  </div>' + 
    '  <div id="' + topic + '-map" style="width: 100%; height: 300px;"></div>' + 
    '<div id="' + topic + '-featureinfo" class="featureinfo"></div>    ' + 
    '<div class="' + topic + ' feature-count">' +
    '<table>' +
    '</table>' +
    '</div>';
}

var topics = [
    ['garbage-collection-zones', 'Garbage collection zones', 'ciwfthqur00572qqo069j224c'], 
    ['dog-walking-zones', 'Dog-walking Zones', 'ciwfubtet00582qqouh3szxd4'],
    ['parking-zones', 'Parking zones', 'ciwgcmgzc007n2ppaegfuhf76/'],
    ['footpaths', 'Footpaths']];


function addTopicSections() {


    d3.select('#overview')
    .selectAll('.topic-section')
    .data(topics)
    .enter()
    .append('section')
    .html(topicHtml);

    topics.forEach(function(topic) { makeMap(topic[0], topic[2]) });
}

addTopicSections();

d3.json('https://opencouncildata.cloudant.com/test1/_design/features/_view/topicCounts?reduce=true', function(data) {
    topics.forEach(function(topicInfo) {
        var topic = topicInfo[0];
        var values = data.rows[0].value[topic];
        var counts = [];
        Object.keys(values).forEach(function(key) {
            counts.push([key, values[key]]);
        });

        d3.select('.' + topic + '.feature-count table')
        .selectAll('tr')
        .data(counts)
        .enter()
        .append('tr')
        .html(function(d) { return '<td>' + d[0] + '</td><td>' + d[1] + '</td>'; });
    });

});