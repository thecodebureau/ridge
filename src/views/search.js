import FormView from './form-styling';

import { value as getValue } from '../util/dom-getters';
import { value as setValue } from '../util/dom-setters';

export default FormView.extend({
  events: {
    submit: 'submit',
  },

  submit(e) {
    e.preventDefault();

    const query = {};

    _.each(this.$el.prop('elements'), (elem) => {
      // TODO this will currently loop through all checkboxes
      // and radio buttons in a group.
      if (!elem.name) return;

      const value = getValue(elem);

      if (value) {
        query[encodeURIComponent(elem.name)] = encodeURIComponent(value).replace('%20', '+');
      }
    });

    let url = this.url || `/${Backbone.history.fragment.split('?')[0]}`;

    if (!_.isEmpty(query)) url += `?${$.param(query)}`;

    Backbone.history.navigate(url, { trigger: true });
  },

  initialize(options) {
    this.listenTo(this.state, 'change:query', this.attach);

    this.url = options.url;
  },

  attach() {
    const query = this.state.get('query') || {};

    _.each(this.$el.prop('elements'), (elem) => {
      setValue(elem, query[elem.name] || '');
      $(elem).trigger('change');
    });
  },
});
