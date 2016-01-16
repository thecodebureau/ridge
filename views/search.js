var FormView = require('ridge/views/form-styling');

module.exports = FormView.extend({
	events: {
		'submit': 'submit'
	},

	submit: function(e) {
		e.preventDefault();

		var query = [];

		_.each(this.$el.prop('elements'), function(elem) {
			if (elem.name && elem.value)
				query.push(encodeURIComponent(elem.name) + '=' + encodeURIComponent(elem.value).replace('%20', '+'));
		});

		var url = '/' + Backbone.history.fragment.split('?')[0];

		if (query.length) url += '?' + query.join('&');

		Backbone.history.navigate(url, { trigger: true });
	},

	initialize: function() {
		this.listenTo(this.state, 'change:query', this.attach);
	},

	attach: function(model, value) {
		var query = this.state.get('query') || {};

		_.each(this.$el.prop('elements'), function(elem) {
			if (elem.name)
				$(elem).val(query[elem.name]).trigger('change');
		});
	}
});
