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
		'focus input,textarea,[data-spytext]': 'onFocus',
		'blur input,textarea,[data-spytext]': 'onBlur',
		'input input,textarea,[data-spytext]': 'onChange',
		'change select,input,textarea,[data-spytext]': 'onChange',
		'click label': 'labelClick',
		'mouseover .invalid>label.icon': 'onHover',
		'mouseout .invalid>label.icon': 'onUnhover'
	},

	initialize: function(opts) {
		_.extend(this, _.pick(opts, 'onError', 'onSuccess', 'onComplete', 'submit'));

		// use properties from model validation to set up more bindings.
		// all model validation properties are assumed to be 'value' getter
		// and all selectors in form view default to [name=""] instead of [data-hook=""]
		this.bindings = _.mapObject(_.defaults(this.bindings || {}, _.mapObject(this.model.validation, function(value, key) {
			return 'value';
		})), function(value, key) {
			return _.isObject(value) ? value : {
				selector: '[name="' + key + '"],[data-name="' + key + '"]',
				type: value
			};
		});

		this.delegate('submit', this.submit.bind(this));

		this.listenTo(this.model, 'invalid', this.placeErrors);
		this.listenTo(this.model, 'change', this.setValid);

		if(!this.model.isNew() && _.keys(this.model.attributes) === 1)
			this.model.fetch();
	},

	attach: function() {
		this.$el.attr('novalidate', 'novalidate');

		var _view = this;

		this.observe({ validate: true });

		this.$('[data-spytext],[name]:not(:disabled)').each(function() {
			// change is triggered mainly so that getter events are changed from
			// only 'change' to 'input change', see the 'value' getter
			if(this.checked || !this.checked && this.value && this.value !== 'undefined')
				$(this).trigger('change');

			_view.onChange({ currentTarget: this });
		});

		if($.fn.placeholder)
			this.$('input,textarea').placeholder();
	},

	labelClick: function(e) {
		$(e.currentTarget).siblings('input,textarea,[data-spytext]').focus();
	},

	onHover: function() {
		this.$el.addClass('hide-errors');
	},

	onUnhover: function() {
		this.$el.removeClass('hide-errors');
	},

	onChange: function(e) {
		var target = e.currentTarget,
			value = target.nodeName === 'DIV' ? target.textContent.trim() : target.value;

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
		this.elements.button.prop('disabled', false);
		$(document.body).removeClass('progress');
	},

	submit: function(e) {
		var _view = this;

		e.preventDefault();
		
		this.$('input,textarea,select').trigger('change');

		if(this.model.isValid()) {
			$(document.body).addClass('progress');

			this.elements.button.prop('disabled', true);

			return this.model.save(null, {
				success: this.onSuccess,
				error: this.onError,
				complete: this.onComplete,
				context: this
			});
		} else {
			this.$('[name].invalid,[data-name].invalid').first().focus();
		}
	},

	setValid: function removeError(model, options) {
		var _view = this;

		_.each(model.flatten(model.changed, _.keys(model.validation)), function(value, attr) {
			_view.$('[data-name="' + attr + '"],[name="' + attr + '"]')
				.removeClass('invalid').addClass('valid')
				.closest('form .container')
				.removeClass('invalid').addClass('valid')
				.find('label.error').remove();
		});
	},

	placeErrors: function placeErrors(model, errors, options) {
		var _view = this;

		_.each(errors, function(error, property) {
			var $container = _view.$('[data-name="' + property + '"],[name="' + property + '"]')
				.removeClass('valid').addClass('invalid').closest('form .container'),
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
