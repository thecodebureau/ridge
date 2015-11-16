var app = require('ridge');

module.exports = require('ridge/view').extend({
	tagName: 'form',

	events: {
		'submit': function(e) {
			e.preventDefault();

			var query = [];
			_.each(e.currentTarget.elements, function(elem) {
				var value = elem.value,
					name = elem.name;

				if($(elem).is('[data-dot]')) {
					// <select name="status" data-dot><option value="paid,false">Unpaid</option></select>
					var arr = value.split(',');
					name = name + '.' + arr[0];
					value = arr[1];
				} else if($(elem).is('[data-regex]'))
					value = '/' + value + '/' + $(elem).attr('data-regex');

				if (elem.name && elem.value)
					query.push(encodeURIComponent(name) + '=' + encodeURIComponent(value).replace('%20', '+'));
			});

			var url = '/' + Backbone.history.fragment.split('?')[0];

			if (query.length) url += '?' + query.join('&');

			Backbone.history.navigate(url, { trigger: true });
		},

		'change .query-options': function() {
			this.$('form').submit();
		}
	},

	initialize: function(opts) {
		this.listenTo(app.router.current(), 'change:query', this.attach);
	},

	attach: function() {
		var params = app.router.params;

		_.each(this.$('form').prop('elements'), function(elem) {
			if (elem.name)
				$(elem).val(params[elem.name]);
		});
	}
});
