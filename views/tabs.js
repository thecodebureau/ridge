'use strict';

module.exports = require('../view').extend({
  events: {
    'click button': 'toggle'
  },

  elements: {
    buttons: '.buttons > button',
    containers: '> .container'
  },

  toggle: function (e) {
    var button = e.currentTarget;
    var index = Array.prototype.indexOf.call(button.parentNode.children, button);
    this.elements.containers.addClass('hidden').eq(index).removeClass('hidden');
    this.elements.buttons.removeClass('current').eq(index).addClass('current');
  }
});
