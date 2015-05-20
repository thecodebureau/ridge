/* Base view */

var dust = require('dustjs-linkedin'),
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
			var $oldEl = this.$el;
			var attrs = _.object(_.map($oldEl[0].attributes, function(attr) {
				return [ attr.name, attr.value ];
			}));
			var queue = $oldEl.queue();
			this.$el.clearQueue();
			this.setElement(tag + endTag);
			this.$el.attr(attrs);
			$oldEl.replaceWith(this.el);
			this.$el.queue(queue);
		}
	}
	this.el.innerHTML = html;
	this.rendered = true;
}

var View = Backbone.View.extend({
	// Promise factory function using view as the context with callbacks
	Promise: function(resolver) {
		return Promise(resolver, this);
	},

	constructor: function(options) {
		_.extend(this, _.pick(options, 'template', 'parent'));

		// we clone to prevent views referencing the same object
		this.data = options.data ? _.clone(options.data) : {};

		this.elements = {};

		Backbone.View.apply(this, arguments);

		if(_.isString(this.model))
			this.model = new this.app.models[this.model]();

		if(_.isString(this.collection))
			this.collection = new this.app.collections[this.collection]();

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

	render: function() {
		var _view = this;

		var data = _.result(_view, 'data');

		var args = arguments[0] === true ? _.rest(arguments) : null;

		if (_view.model) {
			function set() {
				var modelData = _view.model.toJSON();
				
				if(args)
					data[_view.model.name.toCamelCase()] = modelData;
				else
					_.extend(data, modelData);

				done();
			}


			if(_view.model._syncing) {
				_view.model.once('sync', set);
			} else {
				set();
			}
		} else if(_view.collection) {
			data = _.defaults(_view.collection.toJSON(), data);
			done();
		} else
			done();
		
		
		function done() {
			_view.renderTemplate(data).ready(args || arguments);
		}

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
		}).done(updateElement, this.attach, function() { this.$el.dequeue(); });

		this.ready = rendering.done;
		this.rendering = rendering;

		return this;
	},

	// animated enter
	enter: function() {
		this.$el.enter.apply(this.$el, arguments);
	},

	// animated remove
	remove: function() {
		this.$el.leave();
		return this.stopListening();
	}
});

View.prototype._remove = View.prototype.remove;
View.prototype._render = View.prototype.render;

module.exports = View;
