var Spytext = require('tcb-spytext');

module.exports = {
	events: {
		'submit form': 'submit',
		'click button.cancel,button.clear': 'cancel'
	},

	initialize: function (options) {
		if(this.collection) {
			this.setModel(null, false);
		}
	},

	attach: function() {
		var view = this;

		this.$('[data-spytext]').each(function(i, el) {
			// TODO clear previous spytext fields
			if(!this.spytext) this.spytext = new Spytext();

			this.spytext.addField(el);
		}.bind(this));

		if(!this.controls) {
			// create new FormControls view if none exists
			this.controls = new this.app.views.FormControls({ el: this.$('.controls'), model: this.model, collection: this.collection });
		} else {
			// update FormControls view with correct element (since the FormView view has been rerendred) and model
			this.controls.setElement(this.$('.controls'));
			this.controls.setModel(this.model, false);//set model, do update since attach (currently) calls that
			this.controls.attach();
		}

		this.$('.image-upload').each(function() {
			// TODO do we need to save reference for these views and remove when rerendering?
			new view.app.views.ImageUpload({ el: this, model: view.model });
		});

		this.attachProperties(true);
	},

	// attachProperties is currently only called by attach(), but has such specific
	// and plentiful logic i figured it was best it got its own room.
	//
	// Basically it uses the property attribute on elements within the scope of the
	// view to set up 2-way binding between their values and their respective 
	// attributes on the model.
	attachProperties: function(twoway) {

		var view = this;

		var timeout;

		var $properties = this.$('[property]').not(':has([property])').each(function() {

			// sets up the view to listen for a change
			// in a specific attribute on the model (only first
			// level of namespace is used since Backbone models do not
			// support set and get of nested properties), and update the
			// connected element(s) as required.
			function startListening() {
				view.listenTo(view.model, 'change:' + namespace[0], function(model) {
					for(var i = 0, ref = model.changedAttributes(); i < namespace.length; i++) {
						ref = ref[namespace[i]];
					}

					// handle parts if they exist
					if(parts) {
						// currently date and time are the only allowed "parts"
						if(!_.isDate(ref)) ref = new Date(ref);

						ref = ref.toLocaleString('se-SV').split(' ');

						parts.forEach(function(part, index) {
							$(part).val(ref[index]);
						});
					} else
						// if the property is not in parts, simply set the html content
						// or value of the element according to type
						if($(el).is('input'))
							$(el).val(ref);
						else
							$(el).html(ref);
				});
			}

			// removes the event listener that startListening sets up
			function stopListening() {
				view.stopListening(view.model, 'change:' + namespace[0]);
			}

			var el = this, parts;

			// we figure out the namespace of the property by
			// checking the nesting of elements with the property attribute.
			// first we collect all ancestors that match within this view
			// convert to array, add the current element and then map the array
			// return the value of property. Result will be [ 'image', 'caption' ],
			// [ 'author', 'address', 'streetAddress' ] or similar
			var namespace = $(this).ancestors('[property]', view.el).add(this).toArray().map(function(el) {
				return $(el).attr('property');
			});

			// currently only TIME elements are checked for parts 
			if(this.tagName === 'TIME') parts = $(this).find('[data-part]').toArray();

			startListening();

			if(twoway) {
				// listen to the change event on the element. spytext elements
				$(this).on('change', function() {
					// can't really remember why i put a clear hear as well. perhaps
					// this is in fact stupid.
					if(timeout) clearTimeout(timeout);

					// stop listening so the the view doesnt react when
					// it sets the model itself
					stopListening();

					var value;

					if(parts) 
						// if the property is in "parts" we need to collect vales from all
						// the parts (elements). return if not all parts are set
						if(_.some(parts, function(el) { return !($(el).val() || $(el).html()); }))
							return;
						else
							value = parts.map(function(el) { return ($(el).val() || $(el).html()); }).join(' ').trim();
					else 
						// retrieve the value from the element itself
						value = $(this).val() || $(this).html();

					if(namespace.length > 1) {
						// if the we have namespace of more than one level we
						// need to clone the object, and iterate until we
						// find the right property to set
						var obj = _.clone(view.model.get(namespace[0])) || {};

						for(var i = 1, ref = obj; i < namespace.length - 1; i++) {
							if(!ref[namespace[i]]) ref[namespace[i]] = {};

							ref = ref[namespace[i]];
						}

						// remove or set the property depending on if value is set
						if(value)
							ref[namespace[i]] = value;
						else
							delete ref[namespace[i]];

						// TODO perhaps unset if obj is empty element
						view.model.set(namespace[0], obj);
					} else {
						// single level namespace, simply set or unset the model attribute
						// depending if value is set
						if(value)
							view.model.set(namespace[0], value);
						else
							view.model.unset(namespace[0]);
					}
					// model is set, start listening again.
					startListening();
				});
			}
		})
		
		if(twoway) {
			$properties.not('.spytext-field').on('keyup', function() {
				// set up keyup to trigger change event, since we have to wait for blur
				// otherwise.
				// notice spytext fields have been removed. they handle their own
				// 'change' events.
				if(timeout) clearTimeout(timeout);

				timeout = setTimeout(function() {
					$(this).trigger('change');
				}.bind(this), 200);
			});
		}
	},

	setModel: function(model, render) {
		if(this.model) {
			this.stopListening(this.model);
			this.model.trigger('cancel');
		}

		this.model = model || new this.collection.model();

		if(this.model) {
			this.listenTo(this.model, 'cancel', this.setModel.bind(this, undefined, true));
			this.listenTo(this.model, 'destroy', this.setModel.bind(this, undefined, true));
		}

		if(render !== false) this.render();
	},

	// TODO hande over submit control to form controls view
	submit: function(e) {
		e.preventDefault();
	}
};
