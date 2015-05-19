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

	enter: function(element, method, animateHeight) {
		return this.queue(function(next) {
			$(element)[method || 'append'](this);
			next();
		}).queue(function(next) {
			if(animateHeight)
				$(this).css('height', this.scrollHeight);
			next();
		}).queue(enter).queue(done);
	},

	leave: function() {
		return this.stop().queue([leave, remove]);
	}
});
