var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var gemeinden = [];

function scrapeGemeinde(index) {
    if (index < gemeinden.length) {
        console.log(index + " Getting data for " + gemeinden[index]);
        var url = gemeinden[index];
        request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(body);
                var generator = $('meta[name=generator]').attr('content');
                var publisher = $('meta[name=publisher]').attr('content');
                var author = $('meta[name=author]').attr('content');
                console.log('META: ' + generator + '\t' + publisher + '\t' + author);
                scrapeGemeinde(++index);
            } else {
                console.log("Got error: " + error);
                scrapeGemeinde(++index);
            }
        });
    }
}

var wikidata = JSON.parse(fs.readFileSync('wikidata.json', 'utf8'));
wikidata.results.bindings.forEach(function(element) {
    console.log(element.name.value+" => "+element._official_website.value);
    gemeinden.push({name: element.name.value, website: element._official_website.value });
});

fs.writeFileSync("gemeinde-list.json", JSON.stringify(gemeinden));

// scrapeGemeinde(0);
