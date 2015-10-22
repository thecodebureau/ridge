require('jquery-jsonify');

var app = require('../ridge');

module.exports = require('../view').extend({
	tagName: 'form',

	events: {
		'focus input,textarea': 'focus',
		'blur input,textarea': 'blur',
		'input input,textarea': 'updateValue',
		'mouseover .invalid>label.icon': 'hover',
		'mouseout .invalid>label.icon': 'unhover'
	},

	initialize: function(opts) {
		_.extend(this, _.pick(opts, 'rules', 'messages', 'onError', 'onSuccess', 'submit'));

		this.$el.on('submit', this.submit.bind(this));
	},

	attach: function() {
		var _view = this;

		this.els = {
			button: this.$('button')[0]
		};

		var $validator = this.$el.validate(this.rules, this.messages);

		this.$('[name]:not(:disabled)').each(function() {
			_view.updateValue({ currentTarget: this });
		});

		if($.fn.placeholder)
			this.$('input,textarea').placeholder();
	},

	hover: function() {
		this.$el.addClass('hide-errors');
	},

	unhover: function() {
		this.$el.removeClass('hide-errors');
	},

	updateValue: function(e) {
		$(e.currentTarget).closest('div').toggleClass('not-empty', !!e.currentTarget.value);
	},

	focus: function(e) {
		$(e.currentTarget).closest('div').addClass('focus');
	},

	blur: function(e) {
		$(e.currentTarget).closest('div').removeClass('focus');
	},

	onError: function(message) {
		var _view = this;

		if(_view.messageView)
			_view.messageView.remove();

		_view.messageView = new app.views.Message({
			message: message
		}).enter(_view.$el, 'before');
	},

	onSuccess: function(data, statusText, xhr) {
		this.trigger('submitted', data, statusText, xhr);
	},

	submit: function(e) {
		var _view = this;

		e.preventDefault();
		
		if(this.$el.valid()) {
			this.els.button.disabled = true;
			$(document.body).addClass('progress');

			$.ajax({
				method: 'POST',
				url: this.$el.attr('action'),
				data: this.$el.JSONify(),
				dataType: 'json',
				success: function(data, statusText, xhr) {
					_view.onSuccess(data, statusText, xhr);
				},
				error: function(xhr) {
					_view.onError(xhr.responseJSON);
				},
				complete: function() {
					_view.els.button.disabled = false;
					$(document.body).removeClass('progress');
				}
			});
		}

	}
});
