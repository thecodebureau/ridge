/* Base view */

var dust = require('dustjs-linkedin'),
	app = require('./ridge'),
	Promise = require('./util/promise'),
	tagPattern = /<(\w+)[^>]*>/,
	attrPattern = /\s+(\S+)\s*=\s*("[^"]*"|'[^']*')/g;


/* Extract wrapping element, attributes and contents */
function parseElement(html, callback) {
	var m = html.match(tagPattern);    // match first start tag

	if (m) {
		var tag = m[0], tagName = m[1],
			endTag = '</' + tagName + '>',
			endIndex = html.lastIndexOf('</');

		// check that the last end matches the start tag
		// and that there is no content after it

		if (html.slice(endIndex).replace(/\s+/g, '') == endTag)
			return callback(html.slice(m.index + tag.length, endIndex), tag, endTag, tagName);
	}

	return callback(html);
}

function attributes(tag) {    // extract attributes from tag string
	var attrs = {}, m;

	while (m = attrPattern.exec(tag))
		attrs[m[1]] = m[2].slice(1, -1);

	return attrs;
}

function updateElement(html, tag, endTag, tagName) {
	if (tag && !this.rendered) {
		if (this.$el.is(tagName)) {
			this.$el.attr(attributes(tag));
		} else {
			var old = this.$el, queue = old.queue();
			old.clearQueue();
			this.setElement(tag + endTag);
			old.replaceWith(this.el);
			this.$el.queue(queue);
		}
	}
	this.el.innerHTML = html;
	this.rendered = true;

	// remove old subviews
	_.invoke(this.views, 'remove');
}

function createViews(view) {
	return _.flatten(_.map(view.subviews, function(options, name) {
		var defaults = {
			model: view.model,
			data: view.data
		};

		var Subview = app.views[name];

		var selector = options;
		if ($.isPlainObject(options)) {
			selector = options.selector;
			if (!selector) return new Subview(options);
			else _.defaults(options, defaults);
		} else {
			options = _.clone(defaults);
		}

		return _.map(view.$(selector), function(elem) {
			options.el = elem;
			return new Subview(options);
		});
	}));
}

var View = Backbone.View.extend({
	// Promise factory function using view as the context with callbacks
	Promise: function(resolver) {
		return Promise(resolver, this);
	},

	constructor: function(options) {
		_.extend(this, _.pick(options, 'template', 'parent', 'bindings'));

		// we clone to prevent views referencing the same object
		this.data = options && options.data ? _.clone(options.data) : {};

		if (!this.elements) this.elements = {};

		Backbone.View.apply(this, arguments);

		if(_.isString(this.model))
			this.model = new app.models[this.model]();

		if(_.isString(this.collection))
			this.collection = new app.collections[this.collection]();

		this.rendered = (this.el && this.el.firstChild) != null;

		if (!this.rendered) this.render();
		else if (this.attach) this.attach();

		// this.ready(callbacks)
		//

		this.ready = this.ready || $.Callbacks('once memory').fireWith(this).add;
	},

	convertElements: function() {
		var view = this;
		_.each(this.elements, function(element, key) {
			if(/^\$/.test(key)) view.elements[key.slice(1)] = element[0];
		});
	},

	initializeViews: function() {
		var _view = this;

		_view.$('[data-view]').each(function() {
			var viewName = $(this).data('view');

			var View = app.views[viewName];

			// TODO destroy/remove all nested views when a PageView is removed.
			if (View) new View({ el: this, data: _view.data });
		});
	},

	render: function() {
		if(this.unobserve) this.unobserve();

		var _view = this;

		var data = _.result(_view, 'data');

		var args = arguments[0] === true ? _.rest(arguments) : null;

		if(app.user)
			data.user = app.user.toJSON();

		if (_view.model) {
			var modelData = _view.model.toJSON();

			if(args)
				data[_view.model.name.toCamelCase()] = modelData;
			else
				_.extend(data, modelData);
		}

		_view.renderTemplate(data).ready(args || arguments);

		return _view;
	},

	// Render Dust template and update element, using the fx queue

	renderTemplate: function(data) {
		var templateName = this.template,
			rendering = this.Promise(function(resolve, reject) {
			this.$el.queue(function(next, hooks) {
				// hooks.stop() is called if queue is stopped using $el.stop() or $el.finish()
				hooks.stop = function() {
					reject();
				};

				dust.render(templateName, data || {}, function(err, out) {
					if (err)
						reject(err);
					else
						parseElement(out, resolve);
				});
			});
		}).done(updateElement, this.attach, function() { this.$el.dequeue(); })
			.fail(Promise.error);

		this.ready = rendering.done;
		this.rendering = rendering;

		return this;
	},

	attach: function() {
		this.views = createViews(this);
	},

	// animated enter
	enter: function() {
		this.$el.enter.apply(this.$el, arguments);
		return this;
	},

	preventDefault: function(e) {
		e.preventDefault();
	},

	alternate: function() {
		this.$el.alternate();
		return this;
	},

	// animated remove
	remove: function() {
		this.stopListening();

		var subViews = this.views;

		while(subViews && subViews.length > 0) {
			_.invoke(subViews, 'stopListening');

			subViews = _.compact(_.flatten(_.pluck(subViews, 'views')));
		}

		this.$el.leave();

		return this;
	}
});

View.prototype._remove = View.prototype.remove;
View.prototype._render = View.prototype.render;

module.exports = View;
