var RssCreator = require('./rss.grabber');
var cheerio = require('cheerio');
var util = require('util');
var db = require("mongojs").connect("ubuntu-vmware/gemeindedb");
var gemeindeMetaData = db.collection("gemeinde.metadata");

var configs = [ {
	urlPattern : "untergruppenbach|no_cache",
	handlerFunction : handleData1
}, {
	urlPattern : "brackenheim",
	handlerFunction : handleData2
}, {
	urlPattern : "flein|ittlingen|neuenstadt",
	handlerFunction : handleData3
} ];

function collectUrls(config, callback) {
	var result = {};
	var matcher = new RegExp(config.urlPattern);
	gemeindeMetaData.find().forEach(function(err, doc) {
		if (doc) {
			var feeds = doc.feed.split(",");
			for (var x = 0; x < feeds.length; x++) {
				if (matcher.exec(feeds[x])) {
					result[feeds[x]] = doc._id;
				}
			}
		} else {
			callback(config, result);
		}
	});
}

function handleData1(data, baseUrl) {
	var feed = [];
	var $ = cheerio.load(data);
	$('#dynamischeListe2').find('li').each(function(index, element) {
		var link = $(this).find('div.newsText a').first();
		var title = link.text();
		var href = link.attr('href');
		if (href.indexOf('http') == -1)
			href = baseUrl.baseUrl + href;
		var date = $(this).text();
		var datePattern = /(.*)Artikel vom (..)\.(..)\.(....)/;
		var parsedDate = null;
		var desc = null;
		var matched = datePattern.exec(date);
		if (matched) {
			desc = matched[1].trim();
			parsedDate = new Date(Date.UTC(matched[4], matched[3] - 1, matched[2]));
		} else {
			desc = "";
			parsedDate = new Date();
			parsedDate.setHours(0);
			parsedDate.setMinutes(0);
			parsedDate.setSeconds(0);
		}
		feed.push({
			title : title,
			description : desc,
			link : href,
			author : "",
			guid : href,
			pubDate : parsedDate
		});
	});
	return feed;
}

function handleData2(data, baseUrl) {
	var feed = [];
	var $ = cheerio.load(data);
	$('#contentbereich').find('li').each(function(index, element) {
		var link = $(this).find('div.aktuellTeaserUeberschrift a').first();
		var title = link.text();
		var href = link.attr('href');
		var date = new Date();
		if (href.indexOf('http') == -1)
			href = baseUrl.baseUrl + href;

		feed.push({
			title : title,
			description : '',
			link : href,
			author : '',
			guid : href,
			pubDate : date
		});
	});
	return feed;
}

function handleData3(data, baseUrl) {
	var feed = [];
	var $ = cheerio.load(data);
	$('#contentbereich').find('li').each(function(index, element) {
		var link = $(this).find('div.aktuellbereichText a').first();
		var title = link.text();
		var href = link.attr('href');
		var date = new Date();
		if (href.indexOf('http') == -1)
			href = baseUrl.baseUrl + href;

		feed.push({
			title : title,
			description : '',
			link : href,
			author : '',
			guid : href,
			pubDate : date
		});
	});
	return feed;

}

function saveNewsItems(newsItems) {
	var newsItemsSaved = 0;
	var duplicates = 0;
	var gemeindeNewsItem = db.collection("gemeinde.newsitem");
	gemeindeNewsItem.ensureIndex("link", {
		unique : true
	});

	for (var x = 0; x < newsItems.length; x++) {
		gemeindeNewsItem.save(newsItems[x], {
			safe : true
		}, function(err, doc) {
			newsItemsSaved++;
			if (err) {
				if (err.err && err.err.indexOf('duplicate key') != -1) {
					duplicates++;
				} else
					console.error(err);
			}
			if (newsItemsSaved >= newsItems.length) {
				db.close();
				console.log(newsItemsSaved + " items processed. " + duplicates
						+ " duplicates. Closing DB connection.");
			}
		});
	}
}
var newsItems = [];

function processConfigs() {
	if (configs.length > 0) {
		collectUrls(configs.pop(), function(config, urlMap) {
			var urls = [];

			console.log("Collecting URLs to process");
			for ( var key in urlMap) {
				urls.push(key);
				console.log(key);
			}

			var grabber = new RssCreator(config.handlerFunction);

			grabber.grab(urls, function(result) {
				for ( var url in result) {
					var res = result[url];
					var id = urlMap[url];
					if (util.isArray(res)) {
						for (var x = 0; x < res.length; x++) {
							var newsItem = res[x];
							if (newsItem.title) {
								newsItem.metaDataId = id;
								newsItems.push(newsItem);
							}
						}
					} else {
						console.log(res);
					}
				}
				processConfigs();
			});
		});
	} else {
		saveNewsItems(newsItems);
	}
}

processConfigs();
