require('./util/jquery-animate');

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
			collection: view.collection,
			model: view.model,
			data: view.data
		};

		var Subview = app.views[name];

		if(!_.isFunction(Subview)) throw new Error('No view "' + name + '" found, or it is not a function!');

		var selector = options;
		if ($.isPlainObject(options)) {
			selector = options.selector;

			_.defaults(options, defaults);

			if (!selector) return new Subview(options);
		} else {
			options = _.clone(defaults);
		}

		return _.map(view.$(selector), function(elem) {
			options.el = elem;
			return new Subview(options);
		});
	}));
}

function getElements(view) {
	return _.mapObject(view.elements, function(selector, name) {
		selector = _.isString(selector) ? selector : selector.selector;

		return view.$(selector);
	});
}

var View = Backbone.View.extend({
	// Promise factory function using view as the context with callbacks
	Promise: function(resolver) {
		var context = this;
		return new Promise(function(resolveWith) {
			resolveWith(context, null, resolver, context);
		});
	},

	constructor: function(options) {
		_.extend(this, _.pick(options, 'template', 'parent', 'bindings', 'subviews'));

		// we clone to prevent views referencing the same object
		this.data = options && options.data ? _.clone(options.data) : {};

		Backbone.View.apply(this, arguments);

		if(_.isString(this.model))
			this.model = new app.models[this.model]();

		if(_.isString(this.collection))
			this.collection = new app.collections[this.collection]();

		this.rendered = (this.el && (this.el.children.length > 0 || !!this.el.textContent.trim()));

		if (!this.rendered) this.render();
		else this._attach();

		this.ready = this.ready || $.Callbacks('once memory').fireWith(this).add;
	},

	render: function() {
		if(this.unobserve) this.unobserve();

		var _view = this;

		var data = _.result(_view, 'data');

		if (_view.model) {
			var modelData = _view.model.toJSON();

			_.extend(data, modelData);
		}

		_view.renderTemplate(data).ready(_.filter(arguments, _.isFunction));

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
		}).done(updateElement, this._attach, function() { this.$el.dequeue(); })
			.fail(Promise.error);

		this.ready = rendering.done;
		this.rendering = rendering;

		return this;
	},

	_attach: function() {
		this.views = createViews(this);
		this.elements = getElements(this);
		if(this.attach) this.attach();
	},

	// animated enter
	enter: function() {
		this.$el.enter.apply(this.$el, arguments);
		return this;
	},

	preventDefault: function(e) {
		e.preventDefault();
	},

	toggle: function(options) {
		this.$el.toggle(options);
		return this;
	},

	// animated remove
	remove: function(options) {
		this.stopListening();

		var subViews = this.views;

		while(subViews && subViews.length > 0) {
			_.invoke(subViews, 'stopListening');

			subViews = _.compact(_.flatten(_.pluck(subViews, 'views')));
		}

		this.$el.leave(options);

		return this;
	}
});

View.prototype._remove = View.prototype.remove;
View.prototype._render = View.prototype.render;

module.exports = View;
