/* jQuery Deferred replacement 

	provides a Promise constructor and a then method
	conforming to the Promises/A+ spec
*/

function Promise(resolver) {
	var doneList = jQuery.Callbacks("once memory"),
		failList = jQuery.Callbacks("once memory"),
		lists = { done: doneList, fail: failList },
		state = "pending",
		promise = {
			state: function() {
				return state;
			},
			// Get promise
			// If obj is provided, the promise aspect is added to the object
			promise: function( obj ) {
				return obj != null ? jQuery.extend( obj, promise ) : promise;
			},
			done: doneList.add,
			fail: failList.add
		};

	function resolve(value) {
		if (arguments.length != 1 ||
				resolveThen(promise, value, resolve, lists, this) === false)
			doneList.fireWith(this, arguments);
	}

	// Handle state
	doneList.add(function() { state = "resolved"; }, failList.disable);
	failList.add(function() { state = "rejected"; }, doneList.disable);

	// Assign promise properties to this instance
	promise.promise(this);
	promise = this;

	// resolver(resolve, reject, lists[ done | fail ])
	resolver(resolve, failList.fire, lists);
}

Promise.prototype = {
	always: function() {
		return this.done(arguments).fail(arguments);
	},
	then: then,
	progress: function() {
		return this;
	}
};

function resolveThen(promise, value, resolve, lists, context) {
	var done;

	function reject() {
		if (!done) lists.fail.fireWith(context, arguments);
		done = true;
	}

	try {
		// Check if value is a thenable (duck-typed promise)
		var fn = _.isObject(value) && value.then;
		if (!_.isFunction(fn))
			return false;

		if (value.promise === promise.promise)
			throw new TypeError("Cannot resolve promise with itself");

		if (fn == then)
			_.each(lists, function(list, name) {
				value[name](list.fire);
			});
		else
			fn.call(value, function() {
				if (!done) resolve.apply(context, arguments);
				done = true;
			}, reject);
	} catch(e) {
		reject(e);
	}
}

function then(onFulfilled, onRejected, onProgress) {
	var promise = this,
		isFunction = _.map(arguments, _.isFunction);
		
	return new Promise(function(resolve, reject) {

		function resolveResult() {
			var fn = promise.state() == "resolved" ? onFulfilled : onRejected,
				context = this,
				values = arguments;

			setTimeout(function() {
				try {
					var undef;
					resolve.call(context, fn.apply(undef, values));
				} catch (e) {
					reject.call(context, e);
				}
			}, 0);
		}

		promise
			.done(isFunction[0] ? resolveResult : resolve)
			.fail(isFunction[1] ? resolveResult : reject)
			.progress(isFunction[2] && onProgress);
	});
}

jQuery.Deferred = function( func ) {
	var progressList = jQuery.Callbacks("memory"),
		deferred,
		promise = new Promise(function(resolve, reject, lists) {
			lists.progress = progressList;

			// deferred[ resolve | reject | notify ]

			/* Not calling corresponding fireWith method with context
			   this === deferred ? promise : this
			   because jQuery internally uses the fireWith methods anyway */

			deferred = {
				resolve: lists.done.fire, resolveWith: lists.done.fireWith,
				reject: lists.fail.fire, rejectWith: lists.fail.fireWith,
				notify: progressList.fire, notifyWith: progressList.fireWith
			};
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
