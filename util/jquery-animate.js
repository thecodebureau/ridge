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

function leave() {
	$(this).addClass('animate leave');

	// force redraw
	this.offsetHeight;

	transition($(this).addClass('active').removeClass('enter'));
}

// remove element when transition ends
function remove(next) {
	$(this).removeClass('animate leave active').remove();
	next();
}

function hide(next) {
	$(this).addClass('hidden').removeClass('visible');

	next();
}

function setHeight(next) {
	$(this).css('height', this.scrollHeight);

	next();
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
				.removeClass(options.className);

			next();
		});
	},

	leave: function() {
		return this.stop().queue([ leave, remove ]);
	},

	show: function(options) {
		return this.enter(null, options);
	},

	hide: function(options) {
		return this.stop().queue([ leave, hide ]);
	}
});
