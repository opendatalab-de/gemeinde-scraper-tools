var RssCreator = require('./rss.grabber');
var util = require('util');
var db = require("mongojs").connect("ubuntu-vmware/gemeindedb");
var gemeindeMetaData = db.collection("gemeinde.metadata");

function collectUrls(callback) {
	var result = {};

	gemeindeMetaData.find().forEach(function(err, doc) {
		if (doc) {
			var feed = doc.feed;
			if (feed.indexOf('no_cache') != -1 || feed.indexOf('untergruppenbach') != -1)
				result[doc.feed] = doc._id;
		} else {
			callback(result);
		}
	});
}

collectUrls(function(urlMap) {
	var urls = [];

	for ( var key in urlMap) {
		urls.push(key);
		console.log(key);
	}

	var grabber = new RssCreator(urls);

	var gemeindeRssFeed = db.collection("gemeinde.rssfeed");
	grabber.grab(function(result) {
		for ( var url in result) {
			console.log(url);
			var res = result[url];

			var id = urlMap[url];

			if (util.isArray(res)) {
				for ( var x = 0; x < res.length; x++) {
					var feed = res[x];
					if (feed.title) {
						feed.metaDataId = id;
						gemeindeRssFeed.save(feed, {
							safe : true
						}, function(err, doc) {
							if (err)
								console.error(err);
						});
					}
				}

			} else {
				console.log(res);
			}
		}
	});
});

console.log("ok");
