;(function( $, window, document, undefined ) {

	var online = true,
		base = {

		checkOnlineStatus: function() {
			$.ajax({
				dataType: 'script',
				url: '//ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js',
				success: base.queryLatLong, // yeah, we're online
				error: base.setOffline // boo, we're offline
			});
		},

		setOffline: function() {
			online = !online;

			base.getLatLong();
			base.getWeather();
		},

		queryLatLong: function() {
			if (typeof geoip2 !== 'undefined') geoip2.city(base.getLatLong, base.getLatLong);
			else base.getLatLong();

			// for a situation where geoip is defined but our request was rejected (status 401) go on as if nothing happened
			var t = setTimeout(base.getLatLong, 7000);
		},

		getLatLong: function(data) {
			// if we're missing our expected data object, throw in a dummy obj
			if (typeof(data) === 'undefined') {
				var data = {};
				if (typeof(data.location) === 'undefined') data.location = {};
				if (typeof(data.city) === 'undefined' || typeof(data.city.names) === 'undefined') data.city = { names: {} };
			}

			// do this only once
			if (typeof(base.lat) === 'undefined') {
				// if I can't get lat/long use the coords from my apt. yes, that's where I live, right down there.
				base.lat = data.location.latitude || 40.7235,
				base.long = data.location.longitude || -73.8612;
				base.city = data.city.names.en || 'Williamsburg';

				if (online) base.queryWeather();
			}
		},

		queryWeather: function() {
			$.ajax({
				dataType: 'jsonp',
				url: 'https://api.forecast.io/forecast/84a181affa36ad15a04a60a792b3122a/' + base.lat + ',' + base.long,
				data: {
					exclude: 'minutely,hourly,daily,alerts,flags'
				},
				success: base.getWeather,
				error: base.getWeather
			});
		},

		getWeather: function(data) {
			// if we're missing our expected data.currently object, throw in a dummy obj
			if (typeof(data) === 'undefined' || typeof(data.currently) === 'undefined') var data = { currently: {} };

			// if I can't get weather info, use the values from the day I made this
			base.temperature = data.currently.temperature || 64.43,
			base.cloudCover = data.currently.cloudCover || 0.17,
			base.humidity = data.currently.humidity || 0.42,
			base.windSpeed = data.currently.windSpeed || 6.31,
			base.windBearing = data.currently.windBearing || 166;
			base.currentInfo = !(typeof(data.offset) === 'undefined');

			base.logWeatherInfo();

			// make sure no circles exist before building any
			if (!$('#circleContainer .circle').length) base.makeCircles();
		},

		makeCircles: function() {

			// save wind and nozzle position and grow speed for speedy use later
			var wind = ((base.windSpeed / 30) * 15) * ((base.windBearing < 180) ? -1 : 1),
				growSpeed = 500,
				// subsequentInterval = 10000,
				subsequentInterval = 500,
				circleTimeout,
				circlesArea = 0,
				circlesCounter = 0,
				maxCircleSize = 250,
				minCircleSize = 50;

			var nozzleLeftWall = (window.innerWidth - maxCircleSize) /  2;

			function insertCircle(circleCount) {

				// create unique circle ID nased on current time at creation
				var currentCircle = 'circle-' + new Date().getTime();

				// size the circle randomly between 50 and a max of 250 pixels, normalized for number of circles
				var currentSize = Math.floor(Math.random() * ((maxCircleSize - minCircleSize) * ((circleCount > 10) ? 10 / circleCount : 1 ))) + minCircleSize;

				// position each circle randomly within the nozzle
				var positionLeft = nozzleLeftWall + Math.floor(Math.random() * (maxCircleSize - currentSize));

				var $frag = $(document.createElement('a')).attr({
					id: currentCircle,
					'class': 'circle',
					href: '#',
					'data-box2d-shape': 'circle'
				}).css({
					width: currentSize,
					height: currentSize,
					left: positionLeft,
					top: 0 - (currentSize / 2) + $('#nozzle').height(),
					opacity: (base.cloudCover > 0.8) ? 0.2 : 1 - base.cloudCover // assign opacity based on cloud cover, maxing out at 0.2
				}).text('click to select this circle');

				$('body').append($frag);

				circlesCounter++;
				circlesArea += Math.PI * Math.pow(currentSize / 2, 2);

				// afer the circle "grows" onto the page, give it physics
				var physicsTimeout = setTimeout(function() {
					clearTimeout(physicsTimeout);
					$('#' + currentCircle).box2d();
					// cleanup
					$('.snatched').remove();
				}, growSpeed + 50);
			}

			function initCircles() {
				// create box2d world and give the nozzle walls physical properties
				$('.box2d-object').box2d({
					// 'debug': true,
					'x-velocity': wind,
					'y-velocity': 30,
					'density': 10,
					'friction': 0.8, // slideiness, from 0 to 1
					'restitution': 0.7 // bounciness, from 0 to 1
				});

				// cleanup
				$('.snatched').remove();

				// random number of circles between 5 and 15
				var circleCount = Math.floor(Math.random() * 10) + 5;

				// insert circles
				function doCircle() {
					clearTimeout(circleTimeout);

					insertCircle(circleCount);

					// repeat insert circles until we insert all desired init circles
					if ($('.circle.bodysnatcher').length < circleCount) circleTimeout = setTimeout(doCircle, growSpeed + 100);
					// once we've added the init circles, keep adding circles indefinitely, but slower
					else circleTimeout = setTimeout(subsequentCircles, subsequentInterval);
				}

				// insert the first circle to kick it off the chain
				doCircle();

				// set double click behavior for circles
				$('body').on('dblclick.circleSquared', '.circle', function(e) {
					e.preventDefault();
					var tempRatio = (base.temperature - 32) / 56;
					if ($(this).hasClass('selected')) $(this).removeClass('selected').css('background-color', 'transparent');
					else $(this).addClass('selected').css('background-color', (base.temperature > 88) ? 'rgb(255, 40, 0)' : (base.temperature < 32) ? 'rgb(0, 40, 255)' : 'rgb(' + parseInt(tempRatio * 255) + ', 40, ' + parseInt(255 - (tempRatio * 255)) + ')');
				});
			}

			function subsequentCircles() {
				clearTimeout(circleTimeout);

				insertCircle($('.circle.bodysnatcher').length);

				// insert up to 50 circles or until circles take up 50% of the page (any more and the collisions will likely crash the browser)
				if (circlesCounter < 50 && circlesArea / (window.innerWidth * window.innerHeight) < 0.5) circleTimeout = setTimeout(subsequentCircles, subsequentInterval);
			}

			// prefetch circle bg img, then proceed
			var dummyImage = new Image();
			dummyImage.onload = initCircles;
			dummyImage.src = 'assets/images/circle_500.png';
		},

		logWeatherInfo: function() {
			if (typeof(console) !== 'undefined' && typeof(console.log) === 'function') {
				var singularIndicative = (base.currentInfo) ? 'is' : 'was';
				console.log(((base.currentInfo) ? 'The current' : 'On May 2nd, 2013') + ' weather forecast for ' + base.city + ':\n   wind speed ' + singularIndicative + ' ' + base.windSpeed + 'mph, bearing ' + base.windBearing + '°\n   temparature ' + singularIndicative + ' ' + base.temperature + '°F\n   cloud cover ' + singularIndicative + ' ' + (base.cloudCover * 100) + '%');
			}
		}
	};

	$(window).on('load', function() {
		// add class to html element to key off lazy-loading css
		$('html').addClass('delayed');

		// using either native loaction or remote IP detection, get user's lat/long
		base.checkOnlineStatus();
	});

})( jQuery, window, document );