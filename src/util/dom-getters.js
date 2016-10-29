export function text(el) {
  return $(el).text(value);
}

text.events = ['blur', 'input', 'change'];

export function html(el) {
  return $(el).html();
}

html.events = ['blur', 'input', 'change'];

// NOTE important to pass jQuery object here, since it can radio or checkbox
// list
export function value(el) {
  if ((/radio|checkbox/i).test(el.type)) {
    // if the radio/checkbox has a form and a name, try get all others
    // with the same name. TODO impl
    if (el.name && el.form) {
      el = el.form[el.name];
    }

    // 'length' property exists only if el is a NodeList, ie there are
    // multiple checkboxes/radios
    if ('length' in el) {
      if ((/radio/i).test(el[0].type)) {
        return _.result(_.find(el, { checked: true }), 'value');
      }

      const arr = _.filter(el, 'checked').map((element) => element.value);

      return arr.length > 0 ? arr : null;
    }

    return el.checked;
  }

  return el.value;
}

value.events = ['blur', 'change', 'input'];

export function parts(el) {
  const _parts = $(el).find('[data-part]').toArray();
  // if the property is in "parts" we need to collect vales from all
  // the parts (elements). return if not all parts are set
  if (_.some(_parts, (el) => !($(el).val() || $(el).html()))) {
    return null;
  }

  return _parts.map((el) => ($(el).val() || $(el).html())).join(' ').trim();
}

parts.events = ['input', 'change', 'blur'];

export function src(el) {
  return $(el).attr('src');
}

export function selectMultiple(el) {
  return $(el).val();
}
