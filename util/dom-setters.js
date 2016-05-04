'use strict';

module.exports = {
  prop: function (property) {
    var negate;
    if (/^!/.test(property)) {
      negate = true;
      property = property.slice(1);
    }
    return function ($el, value, previousValue) {
      $el = $($el);

      $el.prop(property, negate && !value || !negate && !!value);
    };
  },

  booleanClass: function (setClass, unsetClass) {
    return function ($el, value, previousValue) {
      $el = $($el);

      $el.toggleClass(setClass, !!value).toggleClass(unsetClass, !value);
    };
  },

  html: function ($el, value, previousValue) {
    $el = $($el);

    $el.html(value);

    $el.trigger('change', { internal: true });
  },

  text: function ($el, value, previousValue) {
    $el = $($el);

    $el.text(value);

    $el.trigger('change', { internal: true });
  },

  value: function ($el, value, previousValue) {
    $el = $($el);

    if ($el[0].type === 'radio' || $el[0].type === 'checkbox') {
      if ($el.length === 1) {
        $el.prop('checked', !!value);
      } else {
        $el.prop('checked', false);

        if (value)
          $el.filter((_.isArray(value) ? value : [ value ]).map(function (value) {
            return '[value="' + value + '"]';
          }).join(',')).prop('checked', true);
      }
    } else {
      if (value != null) value = value.toString();

      $el.val(value);
    }

    $el.trigger('change', { internal: true });
  },

  published: function ($el, value) {
    $el = $($el);

    $el = $el.closest('[data-published]');

    $el.attr('data-published', (!!value).toString());
  },

  parts: function ($el, value) {
    $el = $($el);

    if (!_.isDate(value)) value = new Date(value);

    var ref = value.toLocaleString('se-SV').split(' ');

    $el.find('[data-part]').toArray().forEach(function (part, index) {
      $(part).val(ref[index]);
    });
  },

  src: function ($el, value) {
    $el = $($el);

    $el.attr('src', value);
  },

  selectMultiple: function ($el, value) {
    $el = $($el);

    if (!value) $el.val(null);

    else
      value.forEach(function (value) {
        $el.find('[value="' + value + '"]').prop('selected', true);
      });
  }
};
