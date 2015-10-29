/* Animate views */

var transitionend = 'transitionend oTransitionEnd webkitTransitionEnd';

$(document).on(transitionend, '.animate', function() {
	$(this).dequeue();
});

function transition($el) {
	// check if transition duration > 0, otherwise finish animation
	parseFloat($el.css('transition-duration')) || $el.dequeue();
	// TODO set timeout or similar to prevent broken transitions from dequeuing
}

function enter() {
	$(this).addClass('animate enter').removeClass('hidden');

	// force redraw
	this.offsetHeight;

	transition($(this).addClass('active').removeClass('leave'));
}

function leave(options) {
	options = options || {};
	$(this).addClass('animate leave').addClass(options.className);

	// force redraw
	this.offsetHeight;

	transition($(this).addClass('active').removeClass('enter'));
}

// remove element when transition ends
function remove(next) {
	$(this).removeClass('animate leave active').remove();
	next();
}

function hide(options) {
	options = options || {};

	return function(next) {
		$(this).addClass('hidden').removeClass('visible').removeClass(options.className);

		next();
	}
}

function setHeight(next) {
	$(this).css('height', this.scrollHeight);

	if(next) next();
}

$.fn.extend({

	toggle: function(options) {
		if(this.hasClass('hidden') || this.hasClass('leave'))
			this.show(options);
		else 
			this.hide(options);
	},

	enter: function(element, options) {
		options = options || {};

		this.queue(function(next) {
			$(this).addClass(options.className);

			$(element)[options.method || 'append'](this);

			next();
		});

		if (options.animateHeight)
			this.queue(setHeight);

		return this.queue(enter).queue(function(next) {
			$(this).removeClass('animate enter active')
				.removeClass(options.className).css({ height: '' });

			next();
		});
	},

	leave: function(options) {
		return this.stop().queue([ leave.bind(this, options), remove ]);
	},

	show: function(options) {
		$(this).removeClass('hidden').addClass('visible');

		return this.enter(null, options);
	},

	hide: function(options) {
		if(options && options.animateHeight) {
			setHeight.call(this[0]);

			// needed for some reason
			this.css('overflow');
		}

		return this.stop().queue([ leave.bind(this, options), hide(options) ]);
	}
});
