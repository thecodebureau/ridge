require('./string-helpers');
require('./dust-mod');
require('./jquery-ext');

var Bassline = function(options) {
	_.extend(this, options);

	this.$el = $(this.el);
	this.$ = this.$el.find.bind(this.$el);
};


Bassline.prototype.start = function() {
	$(document).on('click', 'a.nav, nav a', function (evt) {
		var href = $(this).attr('href');
		var protocol = this.protocol + '//';

		if (href.slice(protocol.length) !== protocol) {
			evt.preventDefault();
			Backbone.history.navigate(href, { trigger: true });
		}
	});

	this.currentPage = new this.views.Page({ el: this.elements.main.children() });
};

Bassline.prototype.navigate = function(page) {
	window.scrollTo(0,0);

	this.currentPage.remove();

	this.currentPage = new this.views.Page(page);

	this.elements.page.text(_.last(page.template.split('/')));
	
	this.currentPage.enter(this.elements.main);
};

Bassline.prototype.login = function(user, init) {
	this.user = new User(user);

	if(init) this.user.fetch();

	else {
		this.user.fetched = true;
	}

	console.log('about to trigger login');
	this.trigger('login', init);
};

Bassline.prototype.logout = function(e) {
	var app = this;
	e.preventDefault();
	$.ajax({
		url: '/auth/logout',
		dataType: 'json',
		success: function(res, statusText, xhr) {
			that.user = null;

			Backbone.history.navigate('/', { trigger: true, replace: true });

			app.trigger('logout');
		},
		error: function(res, statusText, error) {
			// TODO
		}
	});
};

Bassline.Model = require('./model');
Bassline.View = require('./view');
Bassline.FormView = require('./form-view');
Bassline.ModelView = require('./model-view');
Bassline.CollectionView = require('./collection-view');

_.extend(Aviator.prototype, Backbone.Events);

module.exports = window.Aviator = Aviator;
