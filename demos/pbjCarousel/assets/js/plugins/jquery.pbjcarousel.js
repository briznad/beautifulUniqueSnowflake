;(function($, sr){

  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function (func, threshold, execAsap) {
      var timeout;

      return function debounced () {
          var obj = this, args = arguments;
          function delayed () {
              if (!execAsap)
                  func.apply(obj, args);
              timeout = null;
          };

          if (timeout)
              clearTimeout(timeout);
          else if (execAsap)
              func.apply(obj, args);

          timeout = setTimeout(delayed, threshold || 100);
      };
  }
  // smartresize
  $.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

//})(jQuery,'smartresize');
})(Zepto,'smartresize');

;(function ( $, window, document, undefined ) {

	/* dev only - remove for prod */
	function p (msg) {
		console.log(msg);
	}
	/* /dev only - remove for prod */

    // undefined is used here as the undefined global variable in ECMAScript 3 is
    // mutable (ie. it can be changed by someone else). undefined isn't really being
    // passed in so we can ensure the value of it is truly undefined. In ES5, undefined
    // can no longer be modified.

    // window and document are passed through as local variable rather than global
    // as this (slightly) quickens the resolution process and can be more efficiently
    // minified (especially when both are regularly referenced in your plugin).

    // defaults

    $.pbjCarousel = function(el, color, show, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;

        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object
        // briznad: why would I set a data attribute containing all of "base"? this makes no sense to me. I'm uncommenting until I figure out a good eason for this.
        //base.$el.data("pbjCarousel", base);

        var methods = {

	        init: function () {
	            if( typeof( color ) === 'undefined' || color === null ) color = 'red';
	            if( typeof( show ) === 'undefined' || show === null ) show = false;

	            base.color = color;
	            base.show = show;

	            base.options = $.extend({},$.pbjCarousel.defaultOptions, options);

	            // Put your initialization code here
	            methods.doInitScavengry();
	        },

	        // cache DOM els for future use
	        doCacheEls: function () {
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
	        prefixr: function (rule, val) {
	        	var tempObj = {},
	        		browsers = ['-webkit-', '-moz-', '-ms-', '-ms-', '-o-', ''];
	        	for (var i = 0; i < browsers.length; i++) {
					tempObj[browsers[i] + rule] = val;
				}
				return tempObj;
	        },

	        doInitScavengry: function () {

	        	// before we build up we must tear down

	        	// loop through the provided img list/s, figure some things out, then hand it off to the processList function
	        	base.$el.children().each(function () {
	        		// check to see if we're using section elements or lists, so we know how the user would like us to build this again later
	        		if (!$(this).is('ul')) base.useSection = true;

	        		if ($(this).hasClass('horizontal') || $(this).data('pbjDirection') === 'horizontal') { // populate the horizontal catalog
	        			processList('h', this);
	        		} else { // populate the vertical catalog
	        			processList('v', this);
	        		}
	        	});

	        	// run 1 or more lists through the map function to extract necessary vals and then add to the appropriate catalog
        		function processList (listPlane, currentList) { // listPlane can be either "h" (horizontal) or "v" (vertical)

        			// init the catalog
		        	if (typeof base.catalog === 'undefined') base.catalog = {};
		        	if (typeof base.catalog[listPlane] === 'undefined') base.catalog[listPlane] = [];

		        	// run the list, minus the parent element, through the map function, grabbing the src and alt vals, then dump each img object into the catalog
		        	base.catalog[listPlane] = base.catalog[listPlane].concat($(currentList).find('img').map(function () {

        				// if the current img lacks an alt property, attempt to add one based on the img filename, which is hopefully semantic enough to make sense
		        		if (typeof this.alt === 'undefined' || this.alt === '') {
		        			var tempAlt = this.src.split('.').slice(-2, -1)[0].split('/').pop().replace('_', ' ').replace('-', ' ');
		        		} else {
		        			var tempAlt = this.alt;
		        		}

        				return {
		        			src: this.src,
		        			alt: tempAlt
		        		};
        			}));
        		}

        		// now lets move on to building
        		methods.doInitCarpentry();
        	},

        	doInitCarpentry: function () {

        		// now we build

	        	// create document fragment  initially populated with either ul or div, depending on if we're using section elements
	        	if (base.useSection) {
	        		var $frag = $('<div/>');
	        	} else {
	        		var $frag = $('<ul/>');
	        	}

	        	// add css width property to "inner" element, 100% x number of carousel items
	        	$frag.attr({
        			'class'	: '_pbj-inner',
        			style	: 'width: ' + base.catalog.h.length * 100 + '%'
        		});

	        	// iterate through the catalog to build the list items or sections
	        	$.each(base.catalog.h, function (i, val) {
					if (base.useSection) {
		        		var $tempFrag = $('<section/>');
		        	} else {
		        		var $tempFrag = $('<li/>');
		        	}
		        	// add "container" class to img container, then append img with appropriate values, and append the whole thing back to frag
		        	$tempFrag.addClass('_pbj-img-container').append($('<img/>', {
		        		'class'	: '_pbj-img',
	        			src		: val.src,
	        			alt 	: val.alt
		        	})).appendTo($frag);
				});
	        	// insert tap map elements to the end of frag
				$frag = $frag.add('<div class="_pbj-tap-map"><a class="_pbj-tap _pbj-tap-n" data-pbj-adv="up"><span class="visually-hidden">slide down</span></a><a class="_pbj-tap _pbj-tap-s" data-pbj-adv="down"><span class="visually-hidden">slide up</span></a><a class="_pbj-tap _pbj-tap-e" data-pbj-adv="right"><span class="visually-hidden">slide left</span></a><a class="_pbj-tap _pbj-tap-w" data-pbj-adv="left"><span class="visually-hidden">slide right</span></a><a class="_pbj-tap _pbj-tap-n _pbj-tap-n-1" data-pbj-adv="up"><span class="visually-hidden">slide down</span></a><a class="_pbj-tap _pbj-tap-n _pbj-tap-n-2" data-pbj-adv="up"><span class="visually-hidden">slide down</span></a><a class="_pbj-tap _pbj-tap-s _pbj-tap-s-1" data-pbj-adv="down"><span class="visually-hidden">slide up</span></a><a class="_pbj-tap _pbj-tap-s _pbj-tap-s-2" data-pbj-adv="down"><span class="visually-hidden">slide up</span></a></div>');

	        	// add "viewport" class and finally append frag to living el
	        	base.$el.addClass('_pbj-viewport').css({
	        		backgroundColor: base.options.backgroundColor,
	        		borderColor: base.options.borderColor,
			        borderWidth: base.options.borderSize
	        	}).html($frag);

	        	// now that the final structure is in the wild, lets cache some els
	        	methods.doCacheEls();
	        },

	        doRegisterEvents: function () {
	        	// on window resize, via debounce plugin, load layout figurer outer function
	        	$(window).smartresize(methods.doLayoutParams);

	        	// load tap target click function
	        	base.$tapTarget.on('click', function (e) {
	        		e.preventDefault();
	        		e.stopPropagation();
	        		methods.doSlide($(this).data('pbjAdv'));
	        	});
	        },

	        // do maths to assign necessary parameters (width, height, skew deg) to componenets (viewport, tap panels)
	        doLayoutParams: function () {

				// grab the width from the viewport el
	        	base.width = base.$el.width();

				// set the width attribute for all imgs, to help ease the rendering burden on mobile devices
				base.$imgs.attr({
					width: base.width - (base.options.borderSize * 2)
				});

				// if the imgs take a second to load the el height will remain at 0 (or may only pick up the height of the viewport border). we'll have to twiddle our thumbs for a bit.
				function delayedMaths () {
					if (base.$el.height() <= (base.options.borderSize * 2)) {
						var t = setTimeout(delayedMaths, 100);
					} else {
						// the images have scaled, resetting the height. grab the new value from the viewport el
						base.height = base.$el.height();

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
						var skewAngleNeg = skewAngle * -1;

						base.$skewPos.css(methods.prefixr('transform', 'skewY(' + skewAngle + 'deg)'));
						base.$skewNeg.css(methods.prefixr('transform', 'skewY(' + skewAngleNeg + 'deg)'));
					}
				}
				// init the the delayedMaths function
				delayedMaths();
	        },

	        // advance the frame in the indicated directiom
	        doSlide: function (advDir) {
	        	// init the currentFrame info
	        	if (typeof base.currentFrame === 'undefined') base.currentFrame = {
	        		h: 0,
	        		v: 0
	        	};

	        	// increment/decrement the current slide accordingly
	        	switch (advDir) {
					case 'up':

					break;
					case 'down':

					break;
					case 'left':
						base.currentFrame.h++;
					break;
					case 'right':
						base.currentFrame.h--;
					break;
				}
				p(base.currentFrame);
				function roundTheHorn (currentFrame) {
					//if ()
				}

				// "translate" the inner el, aka move the dance floor to the new position
	        	//base.$inner.css(methods.prefixr('transform', 'translate3d(' + ((2/3) * -100) + ', 0, 0)'));
	        }
        };

        // Run initializer
        methods.init();
    };

    $.pbjCarousel.defaultOptions = {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderSize: 3,
        test: 'boo'
    };

    $.fn.pbjCarousel = function (color, show, options) {
        return this.each(function(){
            (new $.pbjCarousel(this, color, show, options));
        });
    };

// to use with jQuery/Zepto, make sure the desired library is uncommented
//})( jQuery, window, document );
})( Zepto, window, document );