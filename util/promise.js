/* jQuery Deferred replacement 

	provides a Promise constructor and a then method
	conforming to the Promises/A+ spec
*/

function Promise(resolver) {
	var doneList = $.Callbacks('once memory'),
		failList = $.Callbacks('once memory'),
		promise = {
			// Get promise
			// If obj is provided, the promise aspect is added to the object
			promise: function( obj ) {
				return obj != null ? $.extend( obj, promise ) : promise;
			},
			done: doneList.add,
			fail: failList.add
		};

	// Resolve recursively if fn is provided
	function resolveWith(context, args, fn, thenable) {
		var resolved;

		function resolve(value) {
			if (!resolved)
				try {
					var then = arguments.length == 1 && _.isObject(value) && value.then;
					resolved = true;
					resolveWith(context, arguments, then, value);
				} catch (e) {
					reject(e);
				}
		}

		function reject(e) {
			if (resolved) return Promise.error(e);
			resolved = true;
			failList.fireWith(context, arguments);
		}

		if (_.isFunction(fn))
			try {
				if (thenable === promise)
					throw new TypeError('Cannot resolve promise with itself');

				// If thenable is a promise, adopt its state
				if (fn == then)
					promise = thenable.promise().done(doneList.fire).fail(failList.fire);
				else
					fn.call(thenable, resolve, reject);
			} catch (e) {
				reject(e);
			}
		else
			doneList.fireWith(context, args);

		return this;
	}

	// Handle state
	doneList.add(failList.disable);
	failList.add(doneList.disable);

	// Assign promise properties to this instance
	promise = promise.promise(this);

	// resolver(resolveWith, rejectWith)
	resolver(resolveWith, failList.fireWith);
	return promise;
}

Promise.error = function(e) {
	var console = window.console;
	if (console && _.isFunction(console.error) && e)
		console.error(e);
};

Promise.prototype = {
	then: then,
	always: function() {
		return this.done(arguments).fail(arguments);
	},
	progress: function() {
		return this;
	}
};

function then(onFulfilled, onRejected) {
	var fn = onFulfilled,
		promise = this.promise().fail(function() { fn = onRejected; });

	return new Promise(function(resolveWith) {
		promise.always(function() {
			var values = arguments;

			resolveWith(this, null, function(resolve, reject) {
				if (_.isFunction(fn))
					setTimeout(function() {
						try {
							resolve(fn.apply(void 0, values));
						} catch (e) {
							reject(e);
						}
					}, 0);
				else
					resolve(promise);
			});
		});
	});
}

$.Deferred = function( func ) {
	var progressList = $.Callbacks('memory'),
		deferred = {},
		promise = new Promise(function(resolveWith, rejectWith) {
			$.each({
				resolve: resolveWith,
				reject: rejectWith,
				notify: progressList.fireWith
			}, function(action, fireWith) {
				// deferred[ resolve | reject | notify ]
				deferred[ action ] = function() {
					fireWith( this === deferred ? promise : this, arguments );
					return this;
				};
				deferred[ action + 'With' ] = fireWith;
			});
		})
		.always(progressList.lock);

	promise.progress = progressList.add;

	// Make the deferred a promise
	promise.promise( deferred );

	// Call given func if any
	if ( func ) {
		func.call( deferred, deferred );
	}

	// All done!
	return deferred;
};

module.exports = Promise;
