;(function ($) { // store vars in a privately scoped anonymous function

    var $objectCache = {};

    /* when DOM is ready, bind some shit */

    $(function() {

    	$objectCache.html = $('html');

    	// once the page has fully loaded, do some shit
    	$(window).on('load', function () {

	    	$objectCache.html.addClass('delayed');

		});

		$('#touchTargetTest').on('click', function(e) {

			var currentX = $(this).width(),
				currentY = $(this).height();

			if (e.offsetX/currentX < 0.5) { // left
				if (e.offsetY/currentY < 0.5) { // top
					if ((currentX/e.offsetX) > (currentY/e.offsetY)) {
						console.log('left');
					} else {
						console.log('top');
					}
				} else { // bottom
					if ((currentX/e.offsetX) > (currentY/(currentY-e.offsetY))) {
						console.log('left');
					} else {
						console.log('bottom');
					}
				}
			} else { // right
				if (e.offsetY/currentY < 0.5) { // top
					if ((currentX/e.offsetX) > (currentY/(currentY-e.offsetY))) {
						console.log('top');
					} else {
						console.log('right');
					}
				} else { // bottom
					if ((currentX/e.offsetX) > (currentY/e.offsetY)) {
						console.log('bottom');
					} else {
						console.log('right');
					}
				}
			}

			/*
			switch () {
			   case :
			      statements1
			      break;
			}

			if ((currentX/e.offsetX) > (currentY/e.offsetY)) {
				console.log('bottom left');
			} else {
				console.log('top right');
			}

			if ((currentX/e.offsetX) > (currentY/(currentY-e.offsetY))) {
				console.log('top left');
			} else {
				console.log('bottom right');
			}
			*/

		});

	});

    /* /when DOM is ready, bind some shit */

})($);