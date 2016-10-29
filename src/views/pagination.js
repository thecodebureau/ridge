'use strict';

var View = require('../view');

module.exports = View.extend({
  template: 'pagination',

  initialize: function () {
    this.listenTo(this.collection, 'reset', this.render);
  },

  render: function () {
    return View.prototype.render.apply(this);
  }
});
