var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var gemeinden = [];

var results = [];

function scrapeGemeinde(index) {
    if (index < gemeinden.length) { // gemeinden.length
        var gemeinde = gemeinden[index];
        console.log(index+"/"+gemeinden.length + " Getting data for " + gemeinde.url);
        request(gemeinde.website, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                fs.writeFileSync("data/" + gemeinde.ags + ".html", body);
                fs.writeFileSync("data/" + gemeinde.ags + "-headers.json", JSON.stringify(response.headers));
                var $ = cheerio.load(body);
                var generator = $('meta[name=generator]').attr('content');
                var publisher = $('meta[name=publisher]').attr('content');
                var author = $('meta[name=author]').attr('content');
                var viewport = $('meta[name=viewport]').attr('content');
                var alternateUrls = [];
                $('link[rel=alternate]').each(function() {
                    alternateUrls.push({title: $(this).attr("title"), url: $(this).attr("href")});
                });
                console.log('META: ' + generator + '\t' + publisher + '\t' + author);
                results.push({
                    generator: generator, publisher: publisher,
                    author: author,
                    ags: gemeinde.ags,
                    name: gemeinde.name,
                    viewport: viewport,
                    alternate : alternateUrls
                });
                scrapeGemeinde(++index);
            } else {
                console.log("Got error: " + error);
                scrapeGemeinde(++index);
            }
        });
    } else {
        fs.writeFileSync("gemeinde-result-list.json", JSON.stringify(results));
    }
}

var wikidata = JSON.parse(fs.readFileSync('wikidata.json', 'utf8'));
wikidata.results.bindings.forEach(function (element) {
    // console.log(element.name.value + " => " + element._official_website.value);
    gemeinden.push({
        name: element.name.value,
        website: element._official_website.value,
        ags: element.AGS.value
    });
});

fs.writeFileSync("gemeinde-list.json", JSON.stringify(gemeinden));

scrapeGemeinde(0);