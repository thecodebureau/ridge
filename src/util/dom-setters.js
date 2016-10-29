export function prop(property) {
  let negate;
  if (/^!/.test(property)) {
    negate = true;
    property = property.slice(1);
  }
  return function ($el, value) {
    $el = $($el);

    $el.prop(property, negate && !value || !negate && !!value);
  };
}

export function booleanClass(setClass, unsetClass) {
  return function ($el, value) {
    $el = $($el);

    $el.toggleClass(setClass, !!value).toggleClass(unsetClass, !value);
  };
}

export function html($el, value) {
  $el = $($el);

  $el.html(value);

  $el.trigger('change', { internal: true });
}

export function text($el, value) {
  $el = $($el);

  $el.text(value);

  $el.trigger('change', { internal: true });
}

export function value(el, value) {
  if (el.type === 'radio' || el.type === 'checkbox') {
    if (el.name && el.form) {
      el = el.form[el.name];
    }

    if ('length' in el) {
      $(el).prop('checked', false);

      if (value != null) {
        _.each(el, (el) => {
          if (_.isArray(value) && value.indexOf(el.value) > -1 || el.value === value) {
            el.checked = true;
          }
        });
      }
    } else {
      el.checked = !!value;
    }
  } else {
    if (value != null) value = value.toString();

    $(el).val(value);
  }

  $(el).trigger('change', { internal: true });
}

export function published($el, value) {
  $el = $($el);

  $el = $el.closest('[data-published]');

  $el.attr('data-published', (!!value).toString());
}

export function parts($el, value) {
  $el = $($el);

  if (!_.isDate(value)) value = new Date(value);

  const ref = value.toLocaleString('se-SV').split(' ');

  $el.find('[data-part]').toArray().forEach((part, index) => {
    $(part).val(ref[index]);
  });
}

export function src($el, value) {
  $el = $($el);

  $el.attr('src', value);
}

export function selectMultiple($el, value) {
  $el = $($el);

  if (!value) {
    $el.val(null);
  } else {
    value.forEach((value) => {
      $el.find(`[value="${value}"]`).prop('selected', true);
    });
  }
}
