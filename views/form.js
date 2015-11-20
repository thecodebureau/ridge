var app = require('../ridge');

var View = require('../view').extend();

_.extend(View.prototype, require('../mixins/observe'), {
	tagName: 'form',

	elements: {
		button: 'button'
	},

	events: {
		'focus select,input,textarea,[data-spytext]': 'onFocus',
		'blur select,input,textarea,[data-spytext]': 'onBlur',
		'input select,input,textarea,[data-spytext]': 'onChange',
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

		this.listenTo(this.model, 'validated', this.setValid);
		this.listenTo(this.model, 'reset', this.reset);

		if(!this.model.isNew() && _.size(this.model.attributes) === 1)
			this.model.fetch();
	},

	attach: function() {
		this.$el.attr('novalidate', 'novalidate');

		var _view = this;

		this.observe({ delayInput: true, validate: true });

		// do not validate new or not fetched models
		if(!this.model.isNew() && _.size(this.model.attributes) > 1)
			this.model.validate(null, { validateAll: true });

		this.$('[data-spytext],[name]:not(:disabled)').each(function() {
			if(!/checkbox|radio/.test(this.type) && this.value) {
				delete this.delayInput;

				// TODO see how this handles defaults (meaning defaults might be
				// rendered with dust, and then this change event resets them
				if(_view.model.isNew())
					$(this).trigger('change');
			}

			// set non-empty classes
			_view.onChange({ currentTarget: this });
		});

		if($.fn.placeholder)
			this.$('input,textarea').placeholder();
	},

	labelClick: function(e) {
		$(e.currentTarget).siblings('input,textarea,[data-spytext]').focus();
	},

	reset: function() {
		this.$('.invalid,.valid').removeClass('valid invalid');
		this.$('label.error').remove();
		this.attach();
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
		
		if(this.model.isValid()) {
			$(document.body).addClass('progress');

			this.elements.button.prop('disabled', true);

			return this.model.save(null, {
				success: this.onSuccess,
				error: this.onError,
				complete: this.onComplete,
				context: this,
				validate: false
			});
		}
	},

	setValid: function (model, errors, valid, options) {
		var _view = this;

		_.each(errors, function(error, property) {
			var $el = _view.$('[data-name="' + property + '"],[name="' + property + '"]');

			delete $el[0].delayInput;

			var $container = $el
				.removeClass('valid').addClass('invalid').closest('form .container'),
				$label = $container.find('label.error');

			if($label.length === 0)
				$('<label class="error ' + property + '"><span>' + error + '</span></label>').appendTo($container);
			else if($label.text() !== error)
				$label.text(error);

			$container.removeClass('valid').addClass('invalid');
		});

		if(!_.isEmpty(errors) && options && options.validateAll) 
			_view.$('[name].invalid,[data-name].invalid').first().focus();

		_.each(valid, function(attr) {
			var $el = _view.$('[data-name="' + attr + '"],[name="' + attr + '"]');

			delete $el[0].delayInput;

			$el.removeClass('invalid').addClass('valid')
				.closest('form .container')
				.removeClass('invalid').addClass('valid')
				.find('label.error').remove();
		});
	},
});

module.exports = View;
