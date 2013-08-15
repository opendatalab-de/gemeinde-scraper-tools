var RssCreator = require('./rss.grabber');
var cheerio = require('cheerio');
var util = require('util');
var db = require("mongojs").connect("ubuntu-vmware/gemeindedb");

function androidGrabber(data, baseUrl) {
	var feed = [];
	var $ = cheerio.load(data);
	$('#body-content div.card-list div.card').each(function(index, element) {
		var aTitle = $(this).find('a.title');
		var authorTag = $(this).find('a.subtitle');
		var title = aTitle.text().trim();
		var href = aTitle.attr('href');
		var date = new Date();
		var author = authorTag.text().trim();

		var url = baseUrl.host + href;
		feed.push({
			title : title,
			description : '',
			link : url,
			author : author,
			guid : url,
			pubDate : date
		});
		// console.log('Titel: ' + title + ", Author: " + author + " => " +
		// url);

	});
	return feed;
}

var urls = [ 'https://play.google.com/store/search?q=hochzeit&c=apps',
		'https://play.google.com/store/search?q=wedding&c=apps' ];

function saveNewsItems(newsItems) {
	var newsItemsSaved = 0;
	var duplicates = 0;
	var appAndroid = db.collection("app.android");
	appAndroid.ensureIndex({
		link : 1
	}, {
		unique : true,
		safe : true
	}, function(err) {
		if (!err) {
			for ( var x = 0; x < newsItems.length; x++) {
				appAndroid.save(newsItems[x], {
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
	});
}

function processConfigs() {
	var grabber = new RssCreator(androidGrabber);
	grabber.grab(urls, function(result) {
		var newsItems = [];
		for ( var url in result) {
			var res = result[url];
			if (util.isArray(res)) {
				for ( var x = 0; x < res.length; x++) {
					var newsItem = res[x];
					if (newsItem.title) {
						newsItems.push(newsItem);
					}
				}
			} else {
				console.log(res);
			}
		}
		saveNewsItems(newsItems);
	});
}

processConfigs();
