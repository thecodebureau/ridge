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

module.exports = {

	enter: function(element, method) {
		this.$el.queue(function(next) {
			$(element)[method || 'append'](this);
			next();
		}).queue(enter).queue(done);

		return this;
	},

	remove: function() {
		this.$el.stop().queue([leave, remove]);
		return this.stopListening();
	}
};
