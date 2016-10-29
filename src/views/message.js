import View from '../view';

export default View.extend({
  initialize(opt) {
    this.data = opt.message;
  },

  template: 'partials/message',
});
