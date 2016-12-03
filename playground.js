var http = require('http');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var gemeindeIndex = 0;
var gemeinden = [ "http://www.abstatt.de/", "http://www.bad-friedrichshall.de/",
		"http://bad-rappenau.de/", "http://badwimpfen.de/", "http://beilstein.de",
		"http://www.brackenheim.de/", "http://www.cleebronn.de/website/",
		"http://www.eberstadt.de/", "http://www.ellhofen.de", "http://www.eppingen.de",
		"http://www.erlenbach-hn.de/", "http://www.flein.de/", "http://www.gemmingen.eu/",
		"http://www.gundelsheim.de/", "http://www.gueglingen.de/website/deu",
		"http://www.hardthausen.de/", "http://www.ilsfeld.de/", "http://www.ittlingen.de/",
		"http://www.jagsthausen.de/", "http://www.kirchardt.de/", "http://www.langenbrettach.de/",
		"http://www.lauffen.de", "http://www.lehrensteinsfeld.de/", "http://www.leingarten.de/",
		"http://www.stadt-loewenstein.de/start/", "http://www.massenbachhausen.de/",
		"http://www.moeckmuehl.de/", "http://www.neckarsulm.de/", "http://www.neckarwestheim.de",
		"http://www.neudenau.de", "http://www.neuenstadt.de/", "http://www.nordheim.de/website/",
		"http://www.obersulm.de/", "http://www.oedheim.de/", "http://www.offenau.de/",
		"http://www.pfaffenhofen-wuertt.de/website/de/", "http://www.roigheim.de",
		"http://www.schwaigern.de/", "http://www.siegelsbach.de/", "http://www.talheim.de",
		"http://www.untereisesheim.de/", "http://www.untergruppenbach.de",
		"http://www.weinsberg.de", "http://www.widdern.de/", "http://www.gemeinde-wuestenrot.de/",
		"http://www.zaberfeld.de/" ];

function handleData(data) {
	var $ = cheerio.load(data);
	$('#contentbereich').find('li').each(function(index, element) {
		var link = $(this).find('div.aktuellbereichText a').first();
		var title = link.text();
		var href = link.attr('href');
		var date = new Date();

		console.log(title + ", " + href + " => " + date);
	});

}

function extractPublisher(data) {
	var $ = cheerio.load(data);

	var generator = $('meta[name=generator]').attr('content');
	var publisher = $('meta[name=publisher]').attr('content');
	var author = $('meta[name=author]').attr('content');

	console.log('META: ' + generator + '\t' + publisher + '\t' + author);
	scrapeGemeinde(gemeindeIndex++);
}

function readFromFile() {
	fs.readFile('ittlingen.html', function(err, data) {
		if (err)
			throw err;
		handleData(data);
	});
}

function handleResponse(res) {
	res.on('readable', function() {
		var data = res.read();
		extractPublisher(data);
	});
}
function handleError(e) {
	console.log("Got error: " + e.message);
}

function getLive() {
	console.log("Getting data...");
	for ( var page = 1; page < 7; page++) {
		var url = "http://www.untergruppenbach.de/index.php?id=7&publish[p]=7&publish[start]="
				+ page;
		console.log("Loading " + url);
		http.get(url, handleResponse).on('error', handleError);
	}
}

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

scrapeGemeinde(0);
