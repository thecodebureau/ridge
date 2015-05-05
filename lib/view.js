/* Base view */

var dust = require('dustjs-linkedin'),
	Promise = require('./util/promise');

/* Extract wrapping element, attributes and contents */

    tagPattern = /<(\w+)[^>]*>/,
    attrPattern = /\s+(\S+)\s*=\s*("[^"]*"|'[^']*')/g;

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
		} else
			this.setElement(tag + endTag);
	}
	this.el.innerHTML = html;
	this.rendered = true;
	if (this.attach) this.attach();
}

module.exports = Backbone.View.extend({
	// Promise factory function using view as the context with callbacks
	Promise: function(resolver) {
		return Promise(resolver, this);
	},

	constructor: function(options) {
		_.extend(this, _.pick(options, 'template', 'data'));

		Backbone.View.apply(this, arguments);

		this.rendered = (this.el && this.el.firstChild) != null;
		if (!this.rendered) this.render();
		else if (this.attach) this.attach();

		// this.ready(callbacks)

		this.ready = this.ready || $.Callbacks('once memory').fireWith(this).add;

	},

	convertElements: function() {
		var view = this;
		_.each(this.elements, function(element, key) {
			if(/^\$/.test(key)) view.elements[key.slice(1)] = element[0];
		});
	},

	render: function() {
		var data = _.result(this, 'data');

		if (this.model)
			data = _.defaults(this.model.toJSON(), data);
		else if(this.collection)
			data = _.defaults(this.collection.toJSON(), data);
		
		this.renderTemplate(data).ready(arguments);

		// TODO attach
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
					next = null;
				};

				dust.render(templateName, data || {}, function(err, out) {
					if (err)
						reject(err);
					else {
						parseElement(out, resolve);
						if (next) next();
					}
				});
			});
		}).done(updateElement);

		this.ready = rendering.done;
		this.rendering = rendering;

		return this;
	},

	// Animate view

	enter: function() {
		this.$el.enter.apply(this.$el, arguments);
	},

	remove: function() {
		this.$el.leave();
		return this.stopListening();
	}
});
