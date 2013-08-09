var http = require('http');
var url = require('url');

var RssCreator = function(dataHandler, options) {
	var result = {};
	var userCallback = null;

	function readFullResponse(response, callback) {
		var encoding = 'utf8';
		if (response.headers['content-type']) {
			var contentType = response.headers['content-type'];
			var matchResult = contentType.match(/charset=(.*)/i);
			if (matchResult) {
				encoding = matchResult[1];
			} else {
				encoding = "";
			}
		}
		if (encoding.toLowerCase() != "utf8") {
			response.setEncoding('binary');
		}
		var data = "";
		response.on('readable', function() {
			data += response.read();
		});
		response.on('end', function() {
			callback(data);
		});
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
	function scrape(urls) {
		if (urls.length > 0) {
			var feedUrl = urls.pop();
			http.get(feedUrl, function(res) {
				readFullResponse(res, function(data) {
					var feed = dataHandler(data, createBaseUrl(feedUrl));
					if (feed) {
						result[feedUrl] = feed;
					}
					scrape(urls);
				});
			}).on('error', function(e) {
				result[feedUrl] = e;
				scrape(urls);
			});
		} else {
			userCallback(result);
		}
	}

	this.grab = function(urls, callback) {
		userCallback = callback;
		scrape(urls);
	};
};

module.exports = RssCreator;
