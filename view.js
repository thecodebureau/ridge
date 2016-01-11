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

function createViews() {
	var self = this;

	return _.flatten(_.map(this.subviews, function(subview, name) {
		subview = parseSubview.call(self, subview);

		var Subview = subview.constructor;

		if(!Subview) return;

		if(!subview.multi) {
			subview.el = self.$(subview.el);
			return (self[name] = new Subview(subview));
		}

		return (self[name] = _.map(self.$(subview.el), function(el) {
			subview.el = el;
			return new Subview(subview);
		}));
	}));
}

function parseSubview(subview) {
	var defaults = {
		collection: this.collection,
		model: this.model,
		state: this.state,
		data: this.data
	};

	if(_.isArray(subview)) {
		subview = _.extend({
			el: subview[0],
			constructor: subview[1],
		}, subview[2]);
	}

	subview.parent = this;
	//subview.name = name;

	if(!subview.prepareView)
		_.defaults(subview, defaults);

	return subview;
}

function getElements(view) {
	return _.mapValues(view.elements, function(selector, name) {
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
		_.extend(this, _.pick(options, 'template', 'parent', 'bindings', 'subviews', 'state'));

		// we clone to prevent views referencing the same object
		this.data = options && options.data ? _.clone(options.data) : {};

		Backbone.View.apply(this, arguments);

		this.rendered = (this.el && (this.el.children.length > 0 || !!this.el.textContent.trim()));

		if (!this.rendered) this.render();
		else this._attach();

		this.ready = this.ready || $.Callbacks('once memory').fireWith(this).add;
	},

	render: function() {
		_.result(this, 'unobserve');

		var data = _.extend({}, app.context, this.data, _.result(this.state, 'toJSON'), _.result(this.model, 'toJSON'));

		this.renderTemplate(data).ready(_.filter(arguments, _.isFunction));

		return this;
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
		this.views = createViews.call(this);
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
	leave: function(options) {
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
