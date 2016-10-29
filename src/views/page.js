import View from '../view';

export default View.extend({
  tagName: 'section',

  className: 'page',

  constructor(options) {
    if (!this.template) {
      this.template = options.template || options.state && options.state.get('page').template;
    }

    View.call(this, options);
  },
});
