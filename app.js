var RssCreator = require('./rss.grabber');
var util = require('util');
var db = require("mongojs").connect("ubuntu-vmware/gemeindedb");
var gemeindeMetaData = db.collection("gemeinde.metadata");

function collectUrls(callback) {
	var result = {};
	gemeindeMetaData.find().forEach(function(err, doc) {
		if (doc) {
			var feed = doc.feed;
			if (feed.indexOf('untergruppenbach') != -1 || feed.indexOf('no_cache') != -1)
				result[doc.feed] = doc._id;
		} else {
			callback(result);
		}
	});
}

collectUrls(function(urlMap) {
	var urls = [];

	console.log("Collecting URLs to process");
	for ( var key in urlMap) {
		urls.push(key);
		console.log(key);
	}

	var grabber = new RssCreator(urls);

	var gemeindeNewsItem = db.collection("gemeinde.newsitem");
	gemeindeNewsItem.ensureIndex("link", {
		unique : true
	});

	function saveNewsItems(newsItems) {
		var newsItemsSaved = 0;
		var duplicates = 0;
		for ( var x = 0; x < newsItems.length; x++) {
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

	grabber.grab(function(result) {
		var newsItems = [];
		for ( var url in result) {
			var res = result[url];
			var id = urlMap[url];
			if (util.isArray(res)) {
				for ( var x = 0; x < res.length; x++) {
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
		saveNewsItems(newsItems);
	});
});
