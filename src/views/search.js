'use strict';

var FormView = require('./form-styling');

var getValue = require('../util/dom-getters').value;
var setValue = require('../util/dom-setters').value;

module.exports = FormView.extend({
  events: {
    'submit': 'submit'
  },

  submit: function (e) {
    e.preventDefault();

    var query = {};

    _.each(this.$el.prop('elements'), function (elem) {
      // TODO this will currently loop through all checkboxes
      // and radio buttons in a group.
      if (!elem.name) return;

      var value = getValue(elem);

      if (value)
        query[encodeURIComponent(elem.name)] = encodeURIComponent(value).replace('%20', '+');
    });

    var url = this.url || '/' + Backbone.history.fragment.split('?')[0];

    if (!_.isEmpty(query)) url += '?' + $.param(query);

    Backbone.history.navigate(url, { trigger: true });
  },

  initialize: function (options) {
    this.listenTo(this.state, 'change:query', this.attach);

    this.url = options.url;
  },

  attach: function (model, value) {
    var query = this.state.get('query') || {};

    _.each(this.$el.prop('elements'), function (elem) {
      setValue(elem, query[elem.name] || '');
      $(elem).trigger('change');
    });
  }
});
