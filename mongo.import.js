var db = require("mongojs").connect("ubuntu-vmware/gemeindedb");
var gemeindeMetaData = db.collection("gemeinde.metadata");

var gemdb = require("./gemeinden_simplify200");
var gemeinden = gemdb.gemeinden;
var feeds = gemdb.feeds;

function findRssData(name) {
	for ( var x = 0; x < feeds.length; x++) {
		if (name == feeds[x].name) {
			return feeds[x];
		}
	}
	console.error("no data for " + name);
}

for ( var x = 0; x < gemeinden.features.length; x++) {
	var prop = gemeinden.features[x].properties;
	var name = prop.GEN;
	var feedData = findRssData(name);
	if (feedData) {
		var doc = {};
		doc.name = feedData.name;
		doc.url = feedData.url;
		doc.feed = feedData.feed;
		doc.rss = feedData.rss;
		doc.email = feedData.email;
		doc.rs = prop.RS;
		doc.des = prop.DES;
		doc.ewzM = prop.EWZ_M;
		doc.ewzW = prop.EWZ_W;
		doc.shapeArea = prop.SHAPE_AREA;

		console.log("saving " + doc.name);
		gemeindeMetaData.save(doc, {
			safe : true
		}, function(err, doc) {
			if (err)
				console.error(err);
			console.log("saved: " + doc.name);
			console.dir(doc);
		});
	}
}

console.log("done");