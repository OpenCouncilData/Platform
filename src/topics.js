module.exports= {
        // title: Shown in interface
        // tilesetid: If the tileset ID in mapbox isn't opencouncildata.[topic]
        // mapid: Show a pre-canned map instead of generating a style
        // recommended, optional, optional: lists of property keys
        // icon: a maki icon name to use for the point dataset
        // minZoom: if we know we can zoom further out than the default 6
        // standard: URL of appropriate Open Council Data standard


    'garbage-collection-zones': { 
        title: 'Garbage collection zones', 
        //tilesetid: 'dqpcmlth',
        //mapid: 'ciwhgji33009f2ql7j52uo0ui',
        recommended: ['name'], // plus more, see below
        optional: ['info_url'],
        standard: 'http://standards.opencouncildata.org/#/garbage-collection-zones'
    },
    'public-toilets': { 
        title: 'Public toilets',  
        icon: 'toilet-15',
        recommended: ['name','female','male','wheelchair','trsfr_side','week_open','week_close','sat_open','sat_close','sun_open','sun_close'],
        optional: ['comment','access_cmt','needle_bin','operator','drink_tap'],
        standard: 'http://standards.opencouncildata.org/#/toilets'
    } , // mapid: 'ciwhghnv300802qqoyubh8j3h', 
    'dog-walking-zones': { 
        title: 'Dog-walking Zones', 
        //mapid: 'ciwfubtet00582qqouh3szxd4',
        required: [ 'status' ],
        recommended: [ 'name', 'regulation', 'comment', 'off_rules' ],
        icon: 'dog-park-15',
        standard: 'http://standards.opencouncildata.org/#/dogzones'

    }, 
    'parking-zones': { 
        title: 'Parking zones', 
        tilesetid: '1qthtzh7',
        required: [ 'mode' ],
        recommended: [ 'updated', 'ref'],
        optional: [ 'start', 'end', 'days', 'minsmax', 'hourlyfee','onlyfor', 'notfor' ],
        standard: 'http://standards.opencouncildata.org/#/parkingzones'
        //mapid: 'ciwpknpc200jn2ppaix6pozuc'
     },
    //'footpaths': { title: 'Footpaths' },
    'customer-service-centres': { 
        title: 'Customer service centres', 
        recommended: ['name','services','address','languages','access','monday','tuesday','wednesday','thursday','friday','saturday','sunday','holiday'],
        icon: 'town-hall-15',
        standard: 'http://standards.opencouncildata.org/#/customer_service_centres'
    },  /*, mapid: 'ciwhs1gi7009g2qmt41ftdmmi' */    
    'facilities': {
        title: 'Facilities',
        recommended: ['name'],
        icon: 'star-15',
        standard: 'http://standards.opencouncildata.org/#/facilities'
    },
    'childcare-centres': {
        title: 'Childcare centres',
        recommended: ['name'],
        icon: 'star-15',
        standard: 'http://standards.opencouncildata.org/#/childcare_centres'
    },
    'venues-for-hire': {
        title: 'Venues for hire',
        required: ['name','type'],
        recommended: ['address','capacity','accessible','access','image','url','description','fee_desc','facilities'],
        optional: ['notes','alcohol','phone','email','form_url','dimensions','ref'],
        icon: 'triangle-stroked-15',
        standard: 'http://standards.opencouncildata.org/#/wards'
    },
    'wards': {
        title: 'Voting wards',
        recommended: ['name'],
        standard: 'http://standards.opencouncildata.org/#/wards'        
    },
    'parks': {
        title: 'Parks and open spaces',
        tilesetid: 'cco2avfu',
        minZoom: 3,
        required: ['name'],
        recommended: ['amenities','description','url','image','address'],
        standard: 'http://standards.opencouncildata.org/#/parks'
    },
    'drainpipes': {
        title: 'Drainpipes',
        tilesetid: '4d92w2vu',
        minZoom: 3,
        recommended: ['carrying','material'],
        optional: ['mat_desc','form','height_mm','width_mm','built','ref','comment','operator'],
        standard: 'http://standards.opencouncildata.org/#/drainpipes'
    },
    'footpaths': {
        title: 'Footpaths',
        tilesetid: '3g5a81ox',
        minZoom: 3,
        recommended: ['paved','surf','width','wheelchair'],
        optional: ['surf_desc','operator','ref','bicycle'],
        standard: 'http://standards.opencouncildata.org/#/footpaths'
    },
    'road-closures': {
        title:'Road closures',
        standard: 'http://standards.opencouncildata.org/#/road-closures',
        required: ['status','start_date','start_time'],
        recommended:['end_date','end_time','reason','status_desc','direction','updated'],
        polygons: {
            points: {
                maxzoom: 12,
                icon: 'roadblock-15'
            }
        }
    }
    
};
