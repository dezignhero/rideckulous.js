var Deck = function(selector, options) {

	/*------- Globals -------*/

	var viewportWidth = 0,
		animating = false,
		numSlides = 0,
		goTo = 0,
		currentSlide = 0,
		lastSlide = 0;

	// Swiping
	var swipe = {
		started : false,
		startX : 0,
		endX : 0
	};

	// Defaults
	var defaults = {
		easeDefault : 0.2,
		preventAdvance : false
	};

	/*------- Initialization -------*/
	
	var el = selector,
		parent = $(el),
		cards = $('.page', el),
		controls = $('.control');
	
	/*------- Methods -------*/

	var init = function(options) {
		// Options
		defaults = $.extend(defaults, options || {});

		// Setup
		cards.css({ '-webkit-transition' : 'all '+defaults.easeDefault+'s ease-out' });

		// Assign ids
		numSlides = cards.length;
		cards.each(function(i){
			var self = $(this);
			self.attr('data-id', i).css({
				'z-index' : numSlides-i
			});
			// Add initial class
			if ( i == 0 ) self.addClass('current');
		});

		// Set Dimensions
		resize();

		// Display controls correctly
		if(defaults.preventAdvance) {
			disableSliding();
		} else {
			updateControls();
		}

		// Behavior
		controls.on('touchstart, click', function(){
			if(!animating) {
				animating = true;

				var self = $(this);
				if(self.hasClass('next') && (currentSlide < numSlides-1)) {
					goTo = currentSlide + 1;
				} else if (self.hasClass('prev') && currentSlide > 0) {
					goTo = currentSlide - 1;
				}

				// Move container
				jumpToSlide(goTo);
			}
		});

		// Swiping
		parent[0].addEventListener('touchstart', function(e) { touchStart(e); }, false);
		parent[0].addEventListener('touchmove', function(e) { touchMove(e); }, false);
		parent[0].addEventListener('touchend', function(e) { touchEnd(e); }, false);
		// Desktop
		parent[0].addEventListener('mousedown', function(e) { touchStart(e); }, false);
		parent[0].addEventListener('mousemove', function(e) { if(e.which==1) { touchMove(e); } }, false);
		parent[0].addEventListener('mouseup', function(e) { touchEnd(e); }, false);

		// Orientation Change
		var supportsOrientationChange = "onorientationchange" in window,
			orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

		window.addEventListener(orientationEvent, function() {
			resize(function(){
				jumpToSlide(currentSlide);
			});
		}, false);
	},

	resize = function(callback){
		viewportWidth = parent.width();

		// callback
		if(typeof callback != 'undefined') {
			callback();
		}
	},

	touchStart = function(e) {
		swipe.started = true;
		// Get start point
		swipe.startX = e.touches ? e.touches[0].pageX : e.pageX;
		swipe.startY = e.touches ? e.touches[0].pageY : e.pageY;
		swipe.endX = swipe.startX;  // prevent click swiping when touchMove doesn't fire
	},
	
	touchEnd = function(e) {
		swipe.started = false;

		// Nullify event
		e.preventDefault();

		if(!animating) {
			var moved = swipe.endX - swipe.startX;

			// Figure out closest slide
			if(moved > 0 && moved > viewportWidth/3) {
				if(currentSlide > 0) {
					goTo = currentSlide - 1;
				}
			} else if(moved < 0 && moved < -viewportWidth/3) {
				if(currentSlide < numSlides-1) {
					goTo = currentSlide + 1;
				}
			} else {
				goTo = currentSlide;
			}

			// Jump to closest
			console.log(goTo);
			jumpToSlide(goTo, 0.15);
		}
	},
	
	touchMove = function(e) {
		if(swipe.started && !parent.hasClass('disabled')) {
			var touchX = e.touches ? e.touches[0].pageX : e.pageX;
			var touchY = e.touches ? e.touches[0].pageY : e.pageY;
			var dX = touchX - swipe.startX;
			var dY = touchY - swipe.startY;
			swipe.endX = touchX;
			
			// Escape if motion wrong
			if(Math.abs(dX) < Math.abs(dY)) return true;

			e.preventDefault();

			// Always run this so that hit the ends
			animate(dX,'none');
		}
	},
	
	animate = function(scrollTo, ease) {
		// Momentum Effect or Not
		var transition = (ease!='none') ? 'all '+ease+'s ease-out' : 'none';
		var card = ( scrollTo < 0 ) ? card = $('.page.current') : $('.page.top');
		card[0].style.webkitTransition = transition;
		card[0].style.webkitTransform = 'translate3d('+scrollTo+'px,0,0)';

		// Allow animating again
		window.setTimeout(function(){
			animating = false;
		}, ease*1000);
	},

	jumpToSlide = function(num, ease) {
		// Keep within range
		if(num >= 0 && num < numSlides) {

			// Animate
			var easeAmt = ease || defaults.easeDefault;
			animating = true;
			animate(-viewportWidth, easeAmt);

			// If new slide
			if(num != currentSlide) {
				// Update current slide
				currentSlide = num;
				cards.removeClass('current');
				$(cards.selector+'[data-id='+currentSlide+']').addClass('current');

				// Control Buttons
				updateControls();

				// Disable Again
				if(defaults.preventAdvance) {
					disableSliding();
				}

				// Trigger event
				parent.trigger('update');
			}
		}
	},

	updateControls = function() {
		// Enable control buttons
		if(currentSlide>0 && currentSlide<numSlides-1) {
			$('.control', el).show();
		} else if (currentSlide<=0) {
			$('.control.prev').hide();
			if(!defaults.preventAdvance || currentSlide==0) {
				$('.control.next').show();
			}
		} else if (currentSlide>=numSlides-1) {
			$('.control.next').hide();
			$('.control.prev').show();
		}
	},

	disableSliding = function() {
		// Hide Controls
		$('.control', el).hide();
		// Add disabled flag
		parent.addClass('disabled');
	},

	enableSliding = function() {
		// Enable control buttons
		updateControls();
		// Remove disabled flag
		parent.removeClass('disabled');
	};

	// Initialize the object
	init(options);

	return {

		element : parent,

		jumpToSlide : jumpToSlide,

		disableSliding : disableSliding,

		enableSliding : enableSliding,

		current : function() {
			return currentSlide+1;
		},

		total : numSlides,

		next : function() {
			jumpToSlide(currentSlide+1);
		},

		prev : function() {
			jumpToSlide(currentSlide-1);  
		}
	};

}