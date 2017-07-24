var d3 = require('d3');
var mdl = require('material-design-lite'); // not sure if this is doing anything
var previewMap = require('./previewMap');
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
    (topics[topic].standard ? `  <div class="standardlink">Standard: <a target="_blank" href="${topics[topic].standard}">${topics[topic].standard}</a></div>`: 'NAW')+

/*    '  <div class="mdl-card__actions">' + 
    '    <a href="#" class="mdl-button">Map preview</a>' + 
    '  </div>' + */
    // extra div so that features sit alongside map
    `<div>
    <div id="${topic}-map" class="preview-map not-loaded">
        <div class="preview-map-placeholder">Click for preview map</div>
        <div class="preview-map-legend">
        <span class="preview-map-legend__good">&nbsp;</span>Good<br>
        <span class="preview-map-legend__noncompliant">&nbsp;</span>Non-compliant<br>
        </div>
    </div>
    <div id="${topic}-featureinfo" class="feature-info"></div>
    </div>
    <div class="${topic} feature-count">
        <table class="-mdl-data-table -mdl-js-data-table mdl-shadow--2dp">
        <thead>
            <tr><th class="-mdl-data-table__cell--non-numeric">Council</th><th>Number of features</th></tr>
        </thead>
        <tbody></tbody>
        </table>
    </div>`;
}

/*
Construct a page section for each topic, with a placeholder for a preview map.
*/
function addTopicSections() {

    // Add main sections to body
    d3.select('#overview')
    .selectAll('.topic-section')
    .data(Object.keys(topics))
    .enter()
    .append('section')
    .html(topicHtml);


    Object.keys(topics).forEach(topic => {
        d3.select(`#${topic}-map`).on('click', () => previewMap(topic/*, topics[topic].mapid*/));
    });

    // Create the map preview in each newly created section
    //  Object.keys(topics).forEach(topic => { makeMap(topic/*, topics[topic].mapid*/); });

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






//topics = [['garbage-collection-zones', 'Garbage collection zones', 'ciwhgji33009f2ql7j52uo0ui']];
    //topics = [['dog-walking-zones', 'Dog-walking Zones', 'ciwfubtet00582qqouh3szxd4']];

/*
Construct list of topic links. If council data is available (fetched from Cloudant), then also show the number of councils with data for each topic.
*/

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
                count = `&nbsp;&nbsp;<span class="topic-council-count mdl-color-text--blue" title="${topics[topic]._councilCount} councils publish data on this topic.">${topics[topic]._councilCount}</span>`;
            }
            //var count = topics[topic]._councilCount ? (` (${topics[topic]._councilCount})`) : '';
            return '<a class="mdl-navigation__link" href="#' + topic + '">' + topics[topic].title + count + '</a>';
            //return '<a class="mdl-navigation__link" href="#' + topic + '">' + topics[topic].title + count + '</a>';
        });
}

// get counts of features per council, and hence display number of councils per topic (side bar) and feature counts (per topic)
function showFeatureCounts(featureData) {
    // group_level=2 is important here    
    featureData.rows.forEach(row => {
        var topic = row.key[0];
        var council = row.key[1];
        if (topics[topic] === undefined) {
            return; // Our database has a topic which isn't recognised by the front end. Just ignore it.
        }
        topics[topic]._councilCount = (topics[topic]._councilCount || 0) + 1;
        topics[topic]._councilCounts = def(topics[topic]._councilCounts, []);
        topics[topic]._councilCounts.push([council, row.value]); //[council] = row.value;

    });
    makeSidebarLinks();

    Object.keys(topics).forEach(function(topic) {
        d3.select(`.${topic}.feature-count tbody`)
        .selectAll('tr')
        .data(def(topics[topic]._councilCounts,[]))
        .enter()
        .append('tr')
        .html(d => '<td>' + d[0] + '</td><td>' + d[1] + '</td>');
    });
}

const topicCoverageURL = 'https://opencouncildata.cloudant.com/test1/_design/features/_view/topicCoverage?reduce=true&group_level=2&limit=5000';

addTopicSections();
makeSidebarLinks();
d3.json(topicCoverageURL, showFeatureCounts);