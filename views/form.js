
module.exports = {
	tagName: 'form',

	events: {
		'focus input,textarea': 'focus',
		'blur input,textarea': 'blur',
		'input input,textarea': 'updateValue',
		'mouseover .invalid>label.icon': 'hover',
		'mouseout .invalid>label.icon': 'unhover',
		'submit': 'submit'
	},

	initialize: function(opts) {
		_.extend(this, _.pick(opts, 'rules', 'messages'));
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
		if(_view.messageView)
			_view.messageView.remove();

		_view.messageView = new _view.app.views.Message({
			message: message
		}).enter(this.$el, 'before');
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
				success: function(data) {
					_view.trigger('submitted', data);
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
};

