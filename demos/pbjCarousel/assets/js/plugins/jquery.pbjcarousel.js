;(function( $, window, document, undefined ) {

	/* console.log shortcut for internal dev */
	if ( typeof( _ ) === 'undefined' ) function _(msg) {
		console.log(msg);
	}
	/* /console.log shortcut for internal dev */

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // plugin name
    var pluginName = 'pbjCarousel';

    $[pluginName] = function(el, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;

        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object
        // Zepto only supports the following use of data() through the optional data plugin
        // Therefore reverse reference is only supported with jQuery or custom Zepto build
        //base.$el.data("pbjCarousel", base);

        var methods = {

	        init: function() {
	            // add options to the mix
	            base.options = $.extend({},$[pluginName].defaultOptions, options);

	            // first things first, add "viewport" class to base el. this allows us to add some immediate styling (like fading out) while we build things
	            base.$el.addClass('_pbj-viewport');

	            // run the first build method, the image scavenger, which will kick off subsequent methods when it's done
	            methods.doInitScavengry();
	        },

	        // cache DOM els for future use
	        doCacheEls: function() {
	        	// cache "inner"
	        	base.$inner = base.$el.find('._pbj-inner');

	        	// cache imgs
	        	base.$imgs = base.$el.find('._pbj-img');

	        	// cache needed tap targets
				base.$tapTarget = base.$el.find('._pbj-tap');
				base.$skewPos = base.$el.find('._pbj-tap-n-1, ._pbj-tap-s-2');
	        	base.$skewNeg = base.$el.find('._pbj-tap-n-2, ._pbj-tap-s-1');

	        	// now that those els are cached, lets get the layout looking spiffy and register some events
	        	methods.doLayoutParams();
	        	methods.doRegisterEvents();
	        },

	        // output browser prefixed CSS object for a given CSS rule
	        prefixr: function(rule, val) {
	        	var tempObj = {};
	        	$.each(['-webkit-', '-moz-', '-ms-', '-ms-', '-o-', ''], function(i, prefix) {
					tempObj[prefix + rule] = val;
				});
				return tempObj;
	        },

	        // throttle function from Underscore 1.4.4
	        //
			// > http://underscorejs.org
			// > (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
			// > Underscore may be freely distributed under the MIT license.
	        throttle: function(func, wait) {
				var context, args, timeout, result;
				var previous = 0;
				var later = function() {
					previous = new Date;
					timeout = null;
					result = func.apply(context, args);
				};
				return function() {
					var now = new Date;
					var remaining = wait - (now - previous);
					context = this;
					args = arguments;
					if (remaining <= 0) {
						clearTimeout(timeout);
						timeout = null;
						previous = now;
						result = func.apply(context, args);
					} else if (!timeout) {
						timeout = setTimeout(later, remaining);
					}
					return result;
				};
			},

			// adaptation of my whenVisible jQuery plugin
 			// http://plugins.jquery.com/whenvisible/
 			whenVisible: function(el, callback) {

	        	var interval = 50,
	        		timeout = 6000,
	        		isVisible = false,
		        	si = null,
		        	check = function () {
		        		// decrement the timeout counter each run
			    		timeout--;

			    		if ($(el)[0].offsetWidth > 0 && $(el)[0].offsetHeight > 0) {
			        		callback(el);
			        		isVisible = true;
			        		clearInterval(si);
			        	} else if (!timeout) { // if we reach the timeout just give up
			        		clearInterval(si);
			        		return;
			        	}
			    	};

	            // run initial check
	            check();

	            // if initial check didn't come back true, kick off setInterval
	            if (!isVisible) si = setInterval(check, interval);
 			},

	        doInitScavengry: function() {

	        	// before we build up we must tear down

	        	// loop through the provided img list/s, figure some things out, then hand it off to the processList function
	        	base.$el.children().each(function() {
	        		// check to see if we're using section elements or lists, so we know how the user would like us to build this again later
	        		if (!$(this).is('ul')) base.useSection = true;

	        		if ($(this).hasClass('horizontal') || $(this).data('pbjDirection') === 'horizontal') { // populate the horizontal catalog
	        			processList('h', this);
	        		} else { // populate the vertical catalog
	        			processList('v', this);
	        		}
	        	});

	        	// run 1 or more lists through the map function to extract necessary vals and then add to the appropriate catalog
        		function processList(listPlane, currentList) { // listPlane can be either "h" (horizontal) or "v" (vertical)

        			// init the catalog
		        	if (typeof base.catalog === 'undefined') base.catalog = {};
		        	if (typeof base.catalog[listPlane] === 'undefined') base.catalog[listPlane] = [];

		        	// run the list, minus the parent element, through the map function, grabbing the src and alt vals, then dump each img object into the catalog
		        	base.catalog[listPlane] = base.catalog[listPlane].concat($(currentList).find('img').map(function() {

        				// if the current img lacks an alt property, attempt to add one based on the img filename, which is hopefully semantic enough to make sense
		        		var tempAlt = (typeof this.alt === 'undefined' || this.alt === '') ? this.src.split('.').slice(-2, -1)[0].split('/').pop().replace('_', ' ').replace('-', ' ') : this.alt;

        				return {
		        			src: this.src,
		        			alt: tempAlt
		        		};
        			}));
        		}

        		// now lets move on to building
        		methods.doInitCarpentry();
        	},

        	doInitCarpentry: function() {

        		// now we build

	        	// create document fragment  initially populated with either ul or div, depending on if we're using section elements
	        	var $frag = $(document.createElement((base.useSection) ? 'div' : 'ul'));

	        	// add css width property to "inner" element, 100% x number of carousel items
	        	$frag.attr({
        			'class'	: '_pbj-inner',
        			style	: 'width: ' + base.catalog.h.length * 100 + '%'
        		});

	        	// iterate through the catalog to build the list items or sections
	        	$.each(base.catalog.h, function(i, val) {
	        		var $tempFrag = $(document.createElement((base.useSection) ? 'section' : 'li'));
		        	// add "container" class to img container, then append img with appropriate values, and append the whole thing back to frag
		        	$tempFrag.addClass('_pbj-img-container').append($(document.createElement('img')).attr({
		        		'class'	: '_pbj-img',
	        			src		: val.src,
	        			alt 	: val.alt
		        	})).appendTo($frag);
				});

	        	// build temp tap map frag
	        	var tapMapArr = ['n', 's', 'e', 'w', 'n _pbj-tap-n-1', 'n _pbj-tap-n-2', 's _pbj-tap-s-1', 's _pbj-tap-s-2'],
	        		$tapMap = $(document.createElement('div')).attr({
	        		'class'	: '_pbj-tap-map'
	        	});

	        	// iterate through each ap target type to build the tap target areas
        		$.each(tapMapArr, function(i, val) {
        			// map semantic directions to shorthand cardinal directions
        			var dirObj = {
        				n: 'up',
        				s: 'down',
        				e: 'right',
        				w: 'left'
        			};

        			if (dirObj[val[0]]) var advDir = dirObj[val[0]];

					// append the tap target we create to the tap map frag
	        		$tapMap.append($(document.createElement('a')).attr({
		        		'class'			: '_pbj-tap _pbj-tap-' + val,
		        		'data-pbj-adv'	: advDir
		        	})
		        		// add a visually hidden span to include accessible text describing the tap target link
		        		.append($(document.createElement('span')).attr({
			        		'class'	: 'visually-hidden'
			        	})
			        		// the accessibility text can be modified in default options
			        		.text(base.options.accessibleLinkText + ' ' + advDir)
			        	)
		        	);
        		});

	        	// add tap map elements to the end of frag
				$frag = $frag.add($tapMap);

	        	// add optionally css and finally append frag to living el
	        	base.$el.css({
	        		backgroundColor: base.options.backgroundColor,
	        		borderRadius: base.options.borderRadius,
	        		borderColor: base.options.borderColor,
			        borderWidth: base.options.borderSize
	        	}).html($frag);

	        	// now that the final structure is in the wild, lets cache some els
	        	methods.doCacheEls();
	        },

	        doRegisterEvents: function() {
	        	// on throttled window resize load layout figurer outer function
	        	$(window).on('resize', methods.throttle(methods.doLayoutParams, 100));

	        	// load tap target click function
	        	base.$tapTarget.on('click', function(e) {
	        		e.preventDefault();
	        		e.stopImmediatePropagation();
	        		methods.doSlide($(this).data('pbjAdv'));
	        	});
	        },

	        // do maths to assign necessary parameters (width, height, skew deg) to componenets (viewport, tap panels)
	        doLayoutParams: function() {

				// grab the width from the viewport el, but subtract the borders
	        	base.width = base.$el.width() - (base.options.borderSize * 2);

				// set the width attribute for all imgs, to help ease the rendering burden on mobile devices
				base.$imgs.attr({
					width: base.width
				});

				// if the imgs take a second to load the inner el height will remain at 0. we'll have to twiddle our thumbs for a bit.
				methods.whenVisible(base.$inner, function(el) {
					// the images have scaled, resetting the height. grab the new value from the inner el
					base.height = $(el).height();

					// handle image placement for images that are different sizes
					var doImagePlacement = {
						alignTop: function() {	/* this is default browser behavior; do nothing */	},
						alignBottom: function () {
							base.$imgs.each(function() {
								methods.whenVisible(this, function(el) {
									$(el).css('top', base.height - $(el).height());
								});
							});
						},
						alignMiddle: function () {
							base.$imgs.each(function() {
								methods.whenVisible(this, function(el) {
									$(el).css('top', (base.height - $(el).height()) / 2);
								});
							});
						},
						stretch: function () {
							base.$imgs.attr({
								height: base.height - (base.options.borderSize * 2)
							});
						}
					}

					// run the chosen image placement method
					doImagePlacement[base.options.imagePlacement]();

		        	// in order to create shaped "tap" (click) targets we must do some maths
		        	// imagine drawing 2 diagonal lines, 1 from the top left to the bottom right corner, the other from the top right to bottom left corner
		        	//
		        	// +------+
		        	// |\  n /|
		        	// | \  / |
		        	// |  \/  |
		        	// |w /\ e|
		        	// | /  \ |
		        	// |/  s \|
		        	// +------+
		        	//
		        	// we shape the north/top/up and south/bottom/down sections and overlay them on the rectangular east/right, west/left sections
		        	// to find the necessary skew angle for the north and south elements we use the folliwng equation:
		        	// sin A = opp/hyp
		        	// the opposite side is a, the current height of el
		        	// the hypotenuse can be solved using the Pythagorean theorem. as stated immediately above, side a is the current height of el and side b, the current width of el
		        	// js Math methods spit out radians, so we'll need to convert that to degrees (actually we could totally use radians but it's Greek to me)
					var skewAngle = Math.asin(base.height/Math.sqrt(Math.pow(base.width, 2) + Math.pow(base.height, 2))) * (180 / Math.PI);

					// set the special skewed click targets to use the determined angle
					base.$skewPos.css(methods.prefixr('transform', 'skewY(' + skewAngle + 'deg)')).addClass('shaped');
					base.$skewNeg.css(methods.prefixr('transform', 'skewY(' + (skewAngle * -1) + 'deg)')).addClass('shaped');
				});
	        },

	        // advance the frame in the indicated directiom
	        doSlide: function(advDir) {

	        	// create a var to store the plane of movement, "h" or "v"
	        	var framePlane;

	        	// init the currentFrame info
	        	if (typeof base.currentFrame === 'undefined') base.currentFrame = {
	        		h: 0,
	        		v: 0
	        	};

	        	// increment/decrement the current slide accordingly
	        	switch (advDir) {
					case 'up':
						framePlane = 'v';
						decrement();
					break;
					case 'down':
						framePlane = 'v';
						increment();
					break;
					case 'left':
						framePlane = 'h';
						decrement();
					break;
					case 'right':
						framePlane = 'h';
						increment();
					break;
				}

				function increment() {
					base.currentFrame[framePlane]++;
					if (base.currentFrame[framePlane] === base.catalog[framePlane].length) base.currentFrame[framePlane] = 0;
				}

				function decrement() {
					base.currentFrame[framePlane]--;
					if (base.currentFrame[framePlane] < 0) base.currentFrame[framePlane] = base.catalog[framePlane].length - 1;
				}

				_(base.currentFrame);

				// "translate" the inner el, aka move the dance floor to the new position, calculated by dividing the current position by the number of frames, then multiplying by -100
	        	//base.$inner.css(methods.prefixr('transform', 'translate3d(' + ((base.currentFrame[framePlane] / base.catalog[framePlane].length) * -100) + ', 0, 0)'));
	        	base.$inner.css(methods.prefixr('transform', 'translate3d(' + ((base.currentFrame[framePlane] / base.catalog[framePlane].length) * -100) + '%, 0, 0)'));
	        }
        };

        // Run initializer
        methods.init();
    };

    $[pluginName].defaultOptions = {
        backgroundColor: '#ededed',
        borderColor: '#ededed',
        borderSize: 3,
        borderRadius: 4,
        accessibleLinkText: 'advance to next frame',
        imagePlacement: 'stretch' // options: "alignTop", "alignBottom", "alignMiddle", "stretch"
    };

    $.fn[pluginName] = function(options) {
        return this.each(function() {
            (new $[pluginName](this, options));
        });
    };

// to use with jQuery/Zepto uncomment the desired library
//})( jQuery, window, document );
})( Zepto, window, document );