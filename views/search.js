var app = require('ridge');

var FormView = require('ridge/views/form');

module.exports = FormView.extend({
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

		this.delegate('submit', this.submit.bind(this));
	},

	attach: function() {
		var params = this.state.get('params');

		_.each(this.$el.prop('elements'), function(elem) {
			if (elem.name)
				$(elem).val(params[elem.name]).trigger('change');
		});
	}
});
