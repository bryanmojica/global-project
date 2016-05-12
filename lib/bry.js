
// create function to make numbers "pretty", adding commas every 3 digits
function makePrettyNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// create select dropdown, which pulls desired information for selected country (from countries.js)
var select = document.getElementById("CountryList");

var options = [];

for (var i = 0; i < countries.features.length; i++) {
    var countryProperties = countries.features[i].properties;
    var option = document.createElement('option');
    var valueAttr = document.createAttribute('value');

    valueAttr.value = countryProperties.postal;
    option.setAttributeNode(valueAttr);
    option.innerHTML = countryProperties.sovereignt;

    select.appendChild(option);
}

function onSelectChange(selectedProperties){
    var div = document.getElementById("PropertiesDiv");


    // calculate GDP per Capita, for highlighted country. first put GDP in proper terms (multiply by 1 million)
    var GDPcap = (1000000 * selectedProperties.gdp_md_est / selectedProperties.pop_est);

    // reduce decimal points to 2 places + add commas
    GDPcap = makePrettyNumber(GDPcap.toFixed(2));

    var GDP = makePrettyNumber(selectedProperties.gdp_md_est);
    var pop = makePrettyNumber(selectedProperties.pop_est);

    // check sorted GDP array and return ranking for selected country
    var GDPrank = (GDPsorted.indexOf(selectedProperties.gdp_md_est) + 1);

    div.innerHTML = '<table><tr>' + '<td class="country-name" colspan="2">'+ selectedProperties.sovereignt +'</td></tr>'
        + '<tr>' + '<td>Global GDP Ranking</td>' + '<td> #' + GDPrank + '</td></tr>'
        + '<tr>' + '<td>GDP, in millions</td>' + '<td>'+ '$' + GDP +'</td></tr>'
        + '<tr>' + '<td>Population</td>' + '<td>'+ pop +'</td></tr>'
        + '<tr>' + '<td>GDP per Capita</td>' + '<td>' + '$' + GDPcap +'</td></tr>'
        + '<tr>' + '<td>Income GRP (#1-5)</td>' + '<td>'+ selectedProperties.income_grp +'</td></tr>'
        + '<tr>' + '<td>Economy</td>' + '<td>'+ selectedProperties.economy +'</td></tr>'
        + '<tr>' + '<td>Subregion</td>' + '<td>'+ selectedProperties.subregion +'</td></tr></table>';
}

// create event listener to handle selection of new country / display of new data
select.addEventListener('change', function(event) {
    // log to test event handler is functioning

    var selectedCountry = countries.features.filter(function (country) {
        return country.properties.postal === event.target.value;
    })[0];
    console.log(event.target.value, selectedCountry);

    onSelectChange(selectedCountry.properties);
    zoomToBounds(selectedCountry.geometry.coordinates);

    var selectedCountryLayer = countriesLayer.getLayers().filter(function (layer) {
        return layer.feature.properties.postal === event.target.value;
    })[0];
});


// calculate Total Global Population
var totalpop = 0;

for(var i = 0; i < countries.features.length; i++) {
    totalpop += countries.features[i].properties.pop_est;
}

var prettypop = makePrettyNumber(totalpop);

document.getElementById("global-pop").innerHTML = 'Total Population: ' + prettypop;


// create sorted list of countries, by annual GDP (to later be used in determining ranking)
// sort will do so alphabetically; create numberSort to handle number
function numberHandler(a,b) {
    return a - b;
}

// create new array of country GDP, to be sorted

var GDParray = [];
for (var i = 0; i < countries.features.length; i++) {
    GDParray.push(countries.features[i].properties.gdp_md_est);
}

// sort numbers, ascending
var GDPsorted = GDParray.sort(numberHandler);

// reverse to ensure descending order (where first entry will have most GDP)
GDPsorted.reverse();



// calculate Total Global GDP
var globalGDP = 0;

for(var i = 0; i < countries.features.length; i++) {
    globalGDP += countries.features[i].properties.gdp_md_est;
}

// clean up number appearance
globalGDP = (globalGDP * 1000000);

var prettyGlobal = makePrettyNumber(globalGDP);

globalCap = (globalGDP / totalpop);
globalCap = makePrettyNumber(globalCap.toFixed(2));;

// output in divs on page
document.getElementById("total-global-gdp").innerHTML = 'Total Global GDP: $' + prettyGlobal;

document.getElementById("global-cap").innerHTML = 'Global GDP per Capita : $' + globalCap;


// Leaflet customization: country hover status effect
var countriesLayer;

function highlightFeature(e){
    var layer = e.target;
    layer.setStyle(
        {
            weight : 5,
            color : 'black',
            fillColor : 'white',
            fillOpacity : 0.2
        }
    );
    if(!L.Browser.ie && !L.Browser.opera){
        layer.bringToFront();
    }
}

function resetHighlight(e){
    countriesLayer.resetStyle(e.target);
}

function zoomToBounds(bounds){
    map.fitBounds(bounds);
}

function countriesOnEachFeature(feature, layer){

    // check sorted GDP array and return ranking
    var GDPrank = (GDPsorted.indexOf(feature.properties.gdp_md_est) + 1);


    // calculate GDP per Capita, for highlighted country. put GDP in proper terms (multiply by 1 million)
    var GDPpercap = (1000000 * feature.properties.gdp_md_est / feature.properties.pop_est);

    // make numbers look nice for output (commas + # decimals, where appropriate)
    GDPpercap = makePrettyNumber(GDPpercap.toFixed(2));

    var indivGDP = (makePrettyNumber(feature.properties.gdp_md_est));

    var indivPop = (makePrettyNumber(feature.properties.pop_est));

    layer.bindLabel(feature.properties.name + '<br /> Global Ranking: #' + GDPrank + '<br /> Annual GDP:' + ' $' + indivGDP + '<br /> Population: ' + indivPop + '<br /> GDP per Capita: $' + GDPpercap,{noHide:true});
    layer.on(
        {
            mouseover : highlightFeature,
            mouseout : resetHighlight,
            click : function (e) {
                console.log(e.target, e.target === layer);
                zoomToBounds(e.target.getBounds());
                select.value = feature.properties.postal;
                onSelectChange(feature.properties);
            }
        }
    );
}

// conditional style logic: return hex color based on country's GDP. set threshold tiers.
function getCountryColor(gdp_md_est){
    if (gdp_md_est > 15000000){
        return '#103910';
    }
    else if (gdp_md_est > 7000000){
        return '#184A18';
    }
    else if (gdp_md_est > 2000000){
        return '#186321';
    }
    else if (gdp_md_est > 1000000){
        return '#218429';
    }
    else if (gdp_md_est > 50000){
        return '#299C39';
    }
    else if (gdp_md_est > 25000){
        return '#52B552';
    }
    else if (gdp_md_est > 10000){
        return '#7BC66B';
    }
    else{
        return '#CEEFBD';
    }
}

// fill and color
function countriesStyle(feature){
    return {
        fillColor : getCountryColor(feature.properties.gdp_md_est),
        weight : 2,
        opacity : 1,
        color : '#cfcfcf',
        dashArray : 3,
        fillOpacity : 1
    }
}

// initial view, zoom, and disable scrollwheel (for better page nav)
var map = L.map('map', {
    center: [43.8476, 18.3564],
    zoom: 16,
    scrollWheelZoom: false
});

var googleLayer = new L.Google();
map.addLayer(googleLayer);


countriesLayer = L.geoJson(
    countries,
    {
        style : countriesStyle,
        onEachFeature : countriesOnEachFeature
    }
).addTo(map);

map.fitBounds(countriesLayer.getBounds());

// create map legend and layers
var legend = L.control({position : 'bottomright'});
legend.onAdd = function(map){
    var div = L.DomUtil.create('div', 'legend');
    var labels = [
        "GDP greater than $15 Billion",
        "GDP greater than $7 Billion",
        "GDP greater than $2 Billion",
        "GDP greater than $1 Billion",
        "GDP greater than $500 Million",
        "GDP greater than $250 Million",
        "GDP greater than $100 Million",
        "GDP less than $100 Million"
    ];

    // legend thresholds
    var grades = [15000001, 7000001, 2000001, 1000001, 50001, 25001, 10001, 1];
    for(var i = 0; i < grades.length; i++){
        div.innerHTML += '<i style="background:'
            + getCountryColor(grades[i]) + '">&nbsp;&nbsp;</i>&nbsp;&nbsp;'
            + labels[i] + '<br />';
    }
    return div;
}
legend.addTo(map);