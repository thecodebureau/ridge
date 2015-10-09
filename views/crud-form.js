var app = require('ridge');

View = require('ridge/view').extend();

_.extend(View.prototype, require('ridge/mixins/observe'), {
	events: {
		'submit': 'preventDefault'
	},

	subviews: {
		SpytextField: '[data-spytext]',
		ImageUpload: '.image-upload',
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

		this.observe();
	},
});

module.exports = View;
