var app = require('ridge');

module.exports = require('ridge/view').extend(_.extend({
	events: {
		'submit': 'preventDefault'
	},

	subviews: {
		SpytextField: '[data-spytext]',
		ImageUpload: '.image-uploads',
		ModelControls: '.controls'
	},

	attach: function() {
		var _view = this;

		_view.$('select[multiple]').each(function() {
			function populate() {
				$ul.empty();

				$(this).find(':selected').toArray().map(function(el) {
					return el.textContent;
				}).forEach(function(match) {
					$ul.append('<li>' + match + '</li>');
				});
			}

			var $ul = $(this).siblings('ul.selected');

			if($ul.length > 0) {
				$(this).on('change', populate);
			}
		});

		require('ridge/view').prototype.attach.apply(this, arguments);

		this.observe();
	},
}, require('ridge/mixins/observe')));
