import View from '../view';

export default View.extend({
  events: {
    'click button': 'toggle',
  },

  elements: {
    buttons: '.buttons > button',
    containers: '> .container, > .field-container',
  },

  toggle(e) {
    const button = e.currentTarget;
    const index = Array.prototype.indexOf.call(button.parentNode.children, button);
    this.elements.containers.addClass('hidden').eq(index).removeClass('hidden');
    this.elements.buttons.removeClass('current').eq(index).addClass('current');
  },
});
