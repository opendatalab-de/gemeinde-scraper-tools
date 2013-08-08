var http = require('http');
var cheerio = require('cheerio');
var url = require('url');

var RssCreator = function(urls, options) {
	var result = {};
	var userCallback = null;

	function readFullResponse(response, callback) {
		var data = "";
		response.on('readable', function() {
			data += response.read();
		});
		response.on('end', function() {
			callback(data);
		});
	}

	function handleData(data, baseUrl) {
		var feed = [];
		var $ = cheerio.load(data);
		$('#dynamischeListe2').find('li').each(function(index, element) {
			var link = $(this).find('div.newsText a').first();
			var title = link.text();
			var href = baseUrl + link.attr('href');
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

	function createBaseUrl(feedUrl) {
		if (feedUrl.lastIndexOf('/') == feedUrl.length)
			return feedUrl;

		var parsedUrl = url.parse(feedUrl);

		var lastSlash = parsedUrl.path.lastIndexOf('/');
		if (lastSlash != -1) {
			var baseUrl = parsedUrl.path.substring(0, lastSlash);
			return parsedUrl.protocol + '//' + parsedUrl.host + baseUrl + '/';

		} else {
			return feedUrl + '/';
		}

	}

	function scrape(index) {
		if (index < urls.length) {
			var feedUrl = urls[index];
			http.get(feedUrl, function(res) {
				readFullResponse(res, function(data) {
					var feed = handleData(data, createBaseUrl(feedUrl));
					if (feed) {
						result[feedUrl] = feed;
					}
					scrape(++index);
				});
			}).on('error', function(e) {
				result[feedUrl] = e;
				scrape(++index);
			});
		} else {
			userCallback(result);
		}
	}

	this.grab = function(callback) {
		userCallback = callback;
		scrape(0);
	};
};

module.exports = RssCreator;
