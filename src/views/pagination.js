import View from '../view';

export default View.extend({
  template: 'pagination',

  initialize() {
    this.listenTo(this.collection, 'reset', this.render);
  },

  render() {
    return View.prototype.render.apply(this);
  },
});
