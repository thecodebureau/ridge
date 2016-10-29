'use strict';

module.exports = require('../view').extend({
  initialize: function (opt) {
    this.data = opt.message;
  },

  template: 'partials/message',
});
