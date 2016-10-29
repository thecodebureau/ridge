import View from '../view';

const FormStylingView = View.extend();

_.extend(FormStylingView.prototype, {
  tagName: 'form',

  events: {
    'focus select,input,textarea,[data-name]': 'onFocus',
    'blur select,input,textarea,[data-name]': 'onBlur',
    'input select,input,textarea,[data-name]': 'onChange',
    'change select,input,textarea,[data-name]': 'onChange',
    'click label': 'labelClick',
    'mouseover .invalid>label.icon': 'onHover',
    'mouseout .invalid>label.icon': 'onUnhover',
  },

  initialize() {
    this.listenTo(this.model, 'validated', this.setValid);
    this.listenTo(this.model, 'reset', this.reset);

    // TODO maybe turn this off, and use this.el.reset() in 'reset' method to
    // ensure form is properly reset.
    this.$el.on('reset', this.reset.bind(this));
  },

  attach() {
    this.$el.attr('novalidate', 'novalidate');

    const self = this;

    this.$('[data-name],[name]:not(:disabled)').each(function () {
      // if(!/checkbox|radio/.test(this.type) && this.value || this.checked) {
      //  $(this).trigger('change');
      // }

      // set non-empty classes
      self.onChange({ currentTarget: this });
    });

    if ($.fn.placeholder) {
      this.$('input,textarea').placeholder();
    }
  },

  labelClick(e) {
    $(e.currentTarget).siblings('[name],[data-name]').focus();
  },

  reset() {
    this.$('[name], [data-name], .field-container').removeClass('valid invalid touched validated filled empty');
    this.$('label.error').remove();

    // needed when reset is called by 'form' reset event,
    // otherwise form values are not cleared before reattached
    setTimeout(this.attach.bind(this));
  },

  onHover() {
    this.$el.addClass('hide-errors');
  },

  onUnhover() {
    this.$el.removeClass('hide-errors');
  },

  onChange(e) {
    const target = e.currentTarget;
    // eslint-disable-next-line no-nested-ternary
    const value = target.nodeName === 'DIV' ? target.textContent.trim() : /radio|checkbox/.test(target.type) ? target.checked : target.value;

    $(target).closest('.field-container', this.el).toggleClass('empty', !value).toggleClass('filled', !!value);
  },

  onFocus(e) {
    $(e.currentTarget).closest('.field-container', this.el).addClass('focus');
  },

  onBlur(e) {
    $(e.currentTarget).closest('.field-container', this.el).addClass('touched').removeClass('focus');
  },

  setValid(model, errors, valid, options) {
    const self = this;

    _.each(errors, (error, property) => {
      const $container = self.$(`[data-name="${property}"],[name="${property}"]`)
        .removeClass('valid').addClass('invalid').closest('.field-container', self.el);

      const $label = $container.find('label.error');

      if ($label.length === 0) {
        $(`<label class="error ${property}"><span>${error}</span></label>`).appendTo($container);
      } else if ($label.text() !== error) {
        $label.text(error);
      }

      $container.removeClass('valid').addClass('invalid');
    });

    if (!_.isEmpty(errors) && options && options.validateAll) {
      self.$('[name].invalid,[data-name].invalid').first().focus();
    }

    _.each(valid, (attr) => {
      self.$(`[data-name="${attr}"],[name="${attr}"]`)
        .removeClass('invalid')
        .addClass('valid validated')
        .closest('.field-container', self.el)
        .removeClass('invalid')
        .addClass('valid validated')
        .find('label.error')
        .remove();
    });
  },
});

export default FormStylingView;
