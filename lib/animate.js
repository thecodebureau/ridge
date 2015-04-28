/* Animate views */

var transitionend = 'transitionend oTransitionEnd webkitTransitionEnd';

$(document).on(transitionend, '.animate', function() {
	$(this).dequeue();
});

function transition($el) {
	// check if transition duration > 0, otherwise finish animation
	parseFloat($el.css('transition-duration')) || $el.dequeue();
}

function enter() {
	$(this).addClass('animate enter');

	// force redraw
	this.offsetHeight;

	transition($(this).addClass('active').removeClass('leave'));
}

function done(next) {
	$(this).removeClass('animate enter active');
	next();
}

function leave() {
	$(this).addClass('animate leave');

	// force redraw
	this.offsetHeight;

	transition($(this).addClass('active').removeClass('enter'));
}

// remove element when transition ends
function remove(next) {
	$(this).remove();
	next();
}

$.fn.extend({

	enter: function(element, method) {
		return this.queue(function(next) {
			$(element)[method || 'append'](this);
			next();
		}).queue(enter).queue(done);
	},

	leave: function() {
		return this.stop().queue([leave, remove]);
	}
});
