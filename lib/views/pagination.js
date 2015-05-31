module.exports = {
	events: {
		'click a': 'paginate'
	},

	initialize: function(opts) {
		this.pagination = opts.pagination;
		this.listenTo(this.collection, 'reset', this.reset);
	},

	template: 'partials/pagination',

	attach: function() {
		var _view = this;

		_view.elements = {};

		
		_view.$('a').each(function() {
			var $el = $(this);
			var name = '$' + $(this).data('type');

			_view.elements[name] = $el;
		});

		_.extend(_view.elements, {
			$numbers: this.$('span.numbers'),
			$thisPage: this.$('.thisPage'),
			$totalCount: this.$('.totalCount')
		});
	},

	reset: function(collection, options) {
		var _view = this;

		if(!options.page) {
			_view.data.totalCount = _view.collection.totalCount;
			_view.data.pageCount = Math.ceil(_view.data.totalCount/_view.collection.filter._limit);
			_view.data.pages = _.range(1, _view.data.pageCount + 1);
		}

		_view.data.thisPage = _view.collection.length;

		_view.populate(options);

		if(!options.page) {
			this.currentPage = null;
			this.page(1, false);
		}
	},

	populate: function(options) {
		if(!options.page) {
			this.elements.$totalCount.text(this.data.totalCount);

			this.elements.$numbers.children().remove();
			for(var i = 0; i < this.data.pageCount; i++) {
				this.elements.$numbers.append('<a data-type="number" data-number="' + (i + 1) + '" href="">' + (i + 1) + '</a>');
			}
		}

		this.elements.$thisPage.text(this.data.thisPage);
	},

	page: function(number, fetch) {
		if(number > 0 && number <= this.data.pageCount && number !== this.currentPage) {
			if(fetch !== false) {
				this.collection.setPage(number);
				this.collection.fetch({ reset: true, page: true });
			}

			this.currentPage = number;

			if(this.elements.$current) this.elements.$current.removeClass('current');

			this.elements.$current = this.elements.$numbers.children().eq(number - 1).addClass('current');
			this.elements.$prev.toggleClass('disabled', number === 1);
			this.elements.$first.toggleClass('disabled', number === 1);
			this.elements.$next.toggleClass('disabled', number === this.data.pageCount);
			this.elements.$last.toggleClass('disabled', number === this.data.pageCount);

			if(number > 1 && this.pagination)
				this.pagination.forEach(function(val) {
					val.page(number, false);
				});


		}
	},

	paginate: function(e) {
		e.preventDefault();

		var _view = this,
			$el = $(e.currentTarget);

		switch($el.data('type')) {
			case 'first':
				_view.page(1);
				break;
			case 'prev':
				_view.page(_view.currentPage - 1);
				break;
			case 'next':
				_view.page(_view.currentPage + 1);
				break;
			case 'last':
				_view.page(_view.data.pageCount);
				break;
			case 'number':
				_view.page(parseInt($el.data('number')));
				break;

		}
	}
};
