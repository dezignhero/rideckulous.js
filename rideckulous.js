var Deck = function(selector, options) {

	/*------- Globals -------*/

	var viewportWidth = 0,
		animating = false,
		numSlides = 0,
		goTo = 0,
		currentCard = 0,
		lastSlide = 0,
		progression = 0;

	// Cards
	var $cc = $lc = $nc = [];

	// Swiping
	var swipe = {
		started : false,
		startX : 0,
		endX : 0
	};

	// Defaults
	var defaults = {
		ease : 0.2,
		shrink : 0.96,
		sensitivity : 5,
		cards : '.page',
		controls : '.control'
	};

	/*------- Initialization -------*/
	
	var el = selector,
		$parent = $(el),
		$cards, $controls;
	
	/*------- Methods -------*/

	var init = function(options) {
		// Options
		defaults = $.extend(defaults, options || {});

		// Initialize values
		defaults.transition = 'all '+defaults.ease+'s ease-out';
		$cards = $(defaults.cards, el);
		$controls = $(defaults.controls);

		// Assign Ids to the cards
		numSlides = $cards.length;
		$cards.each(function(i){
			var self = $(this);

			self.attr('data-id', i);
			// .css({'-webkit-transition' : 'all '+defaults.ease+'s ease-out'});
			
			// Add initial class
			if ( i == 0 ) {
				$cc = self;
				$cc.slot('current');
			}
			if ( i == 1 ) {
				$nc = self;
				$nc.slot('next');
			}
		});

		// Set Dimensions
		resize();

		// Display controls correctly
		updateControls();

		// Behavior
		$controls.on('touchstart, click', function(){
			var self = $(this),
				action = self.attr('data-action');

			// Ensure action defined
			if ( typeof action != 'undefined' ) return;

			if ( action == 'next' && currentCard < numSlides - 1 ) {
				goTo = currentCard + 1;
			} else if ( action == 'prev' && currentCard > 0 ) {
				goTo = currentCard - 1;
			}

			// Move container
			jumpTo(goTo);
		});

		// Swiping
		$parent[0].addEventListener('touchstart', function(e) { touchStart(e); }, false);
		$parent[0].addEventListener('touchmove', function(e) { touchMove(e); }, false);
		$parent[0].addEventListener('touchend', function(e) { touchEnd(e); }, false);
		// Desktop
		$parent[0].addEventListener('mousedown', function(e) { touchStart(e); }, false);
		$parent[0].addEventListener('mousemove', function(e) { if ( e.which==1) { touchMove(e); } }, false);
		$parent[0].addEventListener('mouseup', function(e) { touchEnd(e); }, false);

		// Orientation Change
		var supportsOrientationChange = "onorientationchange" in window,
			orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";

		window.addEventListener(orientationEvent, function() {
			resize(function(){
				jumpTo(currentCard);
			});
		}, false);
	},

	resize = function(callback){
		viewportWidth = $parent.width();

		// callback
		if ( typeof callback != 'undefined') {
			callback();
		}
	},

	touchStart = function(e) {
		swipe.started = true;
		// Get start point
		swipe.startX = e.touches ? e.touches[0].pageX : e.pageX;
		swipe.startY = e.touches ? e.touches[0].pageY : e.pageY;
		swipe.endX = swipe.startX;  // prevent click swiping when touchMove doesn't fire

		// Initiate card references
		$cc = $($cards.selector+'.current');
		$lc = $($cards.selector+'.last');
		$nc = $($cards.selector+'.next');
	},
	
	touchMove = function(e) {
		if ( swipe.started ) {
			var touchX = e.touches ? e.touches[0].pageX : e.pageX,
				touchY = e.touches ? e.touches[0].pageY : e.pageY,
				dX = touchX - swipe.startX,
				dY = touchY - swipe.startY;
			
			swipe.endX = touchX;
			
			// Escape if motion wrong
			if ( Math.abs(dX) < Math.abs(dY) ) return true;

			// Prevent default event
			e.preventDefault();
			
			moveTo(dX);
		}
	},

	touchEnd = function(e) {
		swipe.started = false;

		if ( animating ) return;

		// Nullify event
		e.preventDefault();

		var moved = swipe.endX - swipe.startX,
			threshold = viewportWidth/defaults.sensitivity;

		goTo = currentCard;

		// Figure out closest slide
		if ( moved > threshold && currentCard > 0 ) {
			goTo--;
		} else if ( moved < -threshold && currentCard < numSlides-1 ) {
			goTo++;
		}

		// Jump to closest
		jumpTo(goTo);
	},
	
	moveTo = function(dX) {
		progression = Math.floor(100 * dX / viewportWidth)/2000;
		
		// Choose which way to animate
		if ( dX <= 0 ) {
			// lock other card in place
			animate($lc, -viewportWidth, false);
			// animate actual card
			animate($cc, dX, false);
		} else {
			// lock other card in place
			animate($cc, 0, false);
			// animate actual card
			animate($lc, dX-viewportWidth, false);
		}
	},

	animate = function($card, scrollTo, ease, callback) {
		// Check if card exists
		if ( $card.length == 0 ) return false;

		// Momentum Effect or Not
		$card[0].style.webkitTransition = ( ease ) ? defaults.transition : '';
		$card[0].style.webkitTransform = 'translate3d('+scrollTo+'px,0,0)';

		// Allow animating again
		if ( ease != 'none' ) {
			animating = true;
			window.setTimeout(function(){
				animating = false;

				if ( typeof callback != 'undefined' ) {
					callback();
				}
			}, ease*1000);
		}
	},

	jumpTo = function(num) {
		// Keep within range
		if ( num >= 0 && num < numSlides ) {

			// How far away is the new card?
			var diff = Math.abs( num - currentCard );

			// Determine how to move slides
			if ( diff == 0 ) {
				animate($cc, 0, true);
				animate($lc, -viewportWidth, true);
			} else {
				var $go = $(defaults.cards+'[data-id='+num+']'),
					$before = $(defaults.cards+'[data-id='+(num-1)+']'),
					$after = $(defaults.cards+'[data-id='+(num+1)+']');

				// Are we REALLY jumping?
				if ( diff >= 2 ) {  // Yes
					// Determine where to start from
					var startPos = ( num > currentCard ) ? 'next' : 'last';
					// Shuffle cards into correct positions
					$go.slot(startPos, false, function(){
						$go.slot('current', true, function(){
							$before.slot('last', false);
							$after.slot('next', false);
							// Update current slide
							currentCard = num;
						});	
					});
				} else {  // Locking in place
					$go.slot('current', true);
					// Going to card is below current card
					if ( num > currentCard ) {
						$after.slot('next', false);
						$before.slot('last', true);
					} else {
						$before.slot('last', false);
						$after.slot('next', true);
					}
					// Update current slide
					currentCard = num;
				}
			}

			// Control Buttons
			updateControls();
		}
	},

	updateControls = function() {
		var $prevCtrl = $(defaults.controls+'[data-action=prev]'),
			$nextCtrl = $(defaults.controls+'[data-action=next]');

		if ( currentCard >= 0 && currentCard < numSlides ) {
			$controls.show();
			if ( currentCard == 0 ) {
				$prevCtrl.hide();
			} else if ( currentCard == numSlides-1 ) {
				$nextCtrl.hide();
			}	
		} else {
			$controls.hide();
		}
	};

	$.fn.slot = function(pos, ease, callback) {
		var self = $(this),
			transform = '';

		// Requires valid jQuery object
		if ( self.length == 0 ) return;

		// Slot in correct position and scale
		if ( pos == 'current' ) {
			transform = 'translate3d(0,0,0) scale(1)';
		} else if ( pos == 'last' ) {
			transform = 'translate3d('+-viewportWidth+'px,0,0) scale(1)';
		} else if ( pos == 'next' ) {
			transform = 'translate3d(0,0,0) scale('+defaults.shrink+')';
		}

		// Prevent duplicates
		$(defaults.cards+'.'+pos).unslot(pos, false);

		self.removeClass('current last next')
			.addClass(pos).css({ 
				'-webkit-transform' : transform,
				'-webkit-transition' : ( ease ) ? defaults.transition : ''
			});

		if ( typeof callback != 'undefined' ) {
			var delay = ( ease ) ? defaults.ease : 0;
			window.setTimeout(function(){
				callback();
			}, delay*1000);
		}
	};

	$.fn.unslot = function(pos, ease) {
		var self = $(this),
			transform = '';

		// Requires valid jQuery object
		if ( self.length == 0 ) return;

		self.removeClass(pos).css({ 
			'-webkit-transform' : 'translate3d(0,0,0) scale('+defaults.shrink+')',
			'-webkit-transition' : ( ease ) ? defaults.transition : ''
		});
	};

	// Initialize the object
	init(options);

	return {

		element : $parent,

		jumpTo : jumpTo,

		current : function() {
			return currentCard+1;
		},

		total : numSlides,

		next : function() {
			jumpTo(currentCard+1);
		},

		prev : function() {
			jumpTo(currentCard-1);  
		}
	};

}