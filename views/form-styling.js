var app = require('../ridge');

var View = require('../view').extend();

_.extend(View.prototype, {
//_.extend(View.prototype, require('../mixins/observe'), {
	tagName: 'form',

	events: {
		'focus select,input,textarea,[data-name]': 'onFocus',
		'blur select,input,textarea,[data-name]': 'onBlur',
		'input select,input,textarea,[data-name]': 'onChange',
		'change select,input,textarea,[data-name]': 'onChange',
		'click label': 'labelClick',
		'mouseover .invalid>label.icon': 'onHover',
		'mouseout .invalid>label.icon': 'onUnhover'
	},

	initialize: function(opts) {
		this.listenTo(this.model, 'validated', this.setValid);
		this.listenTo(this.model, 'reset', this.reset);
	},

	attach: function() {
		this.$el.attr('novalidate', 'novalidate');

		var self = this;

		this.$('[data-name],[name]:not(:disabled)').each(function() {
			//if(!/checkbox|radio/.test(this.type) && this.value || this.checked) {
			//	$(this).trigger('change');
			//}

			// set non-empty classes
			self.onChange({ currentTarget: this });
		});

		if($.fn.placeholder)
			this.$('input,textarea').placeholder();
	},

	labelClick: function(e) {
		$(e.currentTarget).siblings('[name],[data-name]').focus();
	},

	reset: function() {
		this.$('[name], [data-name], .container').removeClass('valid invalid touched validated filled empty');
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

		$(target).closest('div.container', this.el).toggleClass('empty', !value).toggleClass('filled', !!value);
	},

	onFocus: function(e) {
		$(e.currentTarget).closest('div.container', this.el).addClass('focus');
	},

	onBlur: function(e) {
		$(e.currentTarget).closest('div.container', this.el).addClass('touched').removeClass('focus');
	},

	setValid: function (model, errors, valid, options) {
		var self = this;

		_.each(errors, function(error, property) {
			var $container = self.$('[data-name="' + property + '"],[name="' + property + '"]')
				.removeClass('valid').addClass('invalid').closest('.container', self.el);

			var $label = $container.find('label.error');

			if($label.length === 0)
				$('<label class="error ' + property + '"><span>' + error + '</span></label>').appendTo($container);
			else if($label.text() !== error)
				$label.text(error);

			$container.removeClass('valid').addClass('invalid');
		});

		if(!_.isEmpty(errors) && options && options.validateAll) 
			self.$('[name].invalid,[data-name].invalid').first().focus();

		_.each(valid, function(attr) {
			self.$('[data-name="' + attr + '"],[name="' + attr + '"]')
				.removeClass('invalid').addClass('valid validated')
				.closest('.container', self.el)
				.removeClass('invalid').addClass('valid validated')
				.find('label.error').remove();
		});
	},
});

module.exports = View;
