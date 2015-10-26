//require('../util/jquery-jsonify');
//require('../util/validate');

var app = require('../ridge');

var View = require('../view').extend();

_.extend(View.prototype, require('../mixins/observe'), {
	tagName: 'form',

	elements: {
		button: 'button'
	},

	events: {
		'focus input,textarea': 'onFocus',
		'blur input,textarea': 'onBlur',
		'input input,textarea': 'onInput',
		'click label[for]': 'labelClick',
		'change select': 'onInput',
		'mouseover .invalid>label.icon': 'onHover',
		'mouseout .invalid>label.icon': 'onUnhover'
	},

	initialize: function(opts) {
		_.extend(this, _.pick(opts, 'validation', 'rules', 'messages', 'onError', 'onSuccess', 'onComplete', 'submit'));

		this.bindings = _.mapObject(this.bindings, function(value, key) {
			return {
				selector: '[name="' + key + '"]',
				type: value
			};
		});

		this.$el.on('submit', this.submit.bind(this));

		var id = _.last(window.location.pathname.split('/'));

		this.errors = {};

		this.listenTo(this.model, 'invalid', this.placeErrors);
		this.listenTo(this.model, 'change', this.setValid);

		if(!this.model.isNew() && _.keys(this.model.attributes) === 1)
			this.model.fetch();
	},

	attach: function() {
		this.$el.attr('novalidate', 'novalidate');

		var _view = this;

		//var $validator = this.$el.validate(this.rules, this.messages);

		this.$('[name]:not(:disabled)').each(function() {
			_view.onInput({ currentTarget: this });
		});

		this.observe({ validate: true });

		if($.fn.placeholder)
			this.$('input,textarea').placeholder();
	},

	labelClick: function(e) {
		var name = $(e.currentTarget).attr('for');

		this.$('[name="' + name + '"]').focus();
	},

	onHover: function() {
		this.$el.addClass('hide-errors');
	},

	onUnhover: function() {
		this.$el.removeClass('hide-errors');
	},

	onInput: function(e) {
		var target = e.currentTarget,
			value = target.value;

		if(value === 'undefined') value = undefined;

		$(target).closest('form div.container').toggleClass('not-empty', !!value);
	},

	onFocus: function(e) {
		$(e.currentTarget).closest('form div.container').addClass('focus');
	},

	onBlur: function(e) {
		$(e.currentTarget).closest('form div.container').removeClass('focus');
	},

	onError: function(xhr, textStatus, error) {
		var _view = this;

		var message = xhr.responseJSON;

		if(_view.messageView)
			_view.messageView.remove();

		_view.messageView = new app.views.Message({
			message: message
		}).enter(_view.$el, 'before');
	},

	onSuccess: function(data, statusText, xhr) {
		this.trigger('submitted', data, statusText, xhr);
	},

	onComplete: function(xhr, textStatus) {
		_view.els.button.disabled = false;
		$(document.body).removeClass('progress');
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
				success: _view.onSuccess,
				error: _view.onError,
				complete: _view.onComplete
			});
		}
	},

	setValid: function removeError(model, options) {
		var _view = this;

		_.each(model.changedAttributes(null, { dotNotation: true }), function(value, attr) {
			_view.$('[name="' + attr + '"]').closest('form .container')
				.removeClass('invalid').addClass('valid')
				.find('label.error').remove();
		});
	},

	placeErrors: function placeErrors(model, errors, options) {
		var _view = this;

		_.each(errors, function(error, property) {
			var $container = _view.$('[name="' + property + '"]').closest('form .container'),
				$label = $container.find('label.error');

			if($label.length === 0)
				$('<label class="error ' + property + '"><span>' + error + '</span></label>').appendTo($container);
			else if($label.text() !== error)
				$label.text(error);

			$container.removeClass('valid').addClass('invalid');
		});
	},
});

module.exports = View;
