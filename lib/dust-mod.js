// 
// DUST MODIFICATIONS
//

var dust = require('dustjs-linkedin');


// if dust cannot find the specified template in dust.cache, this function gets called.
dust.onLoad = function(name, callback) {
	// callback is a function provided by dust.
	// run console.log(callback.toString()) if you are interested in it's contents.
	function notFound() {
		callback(new Error('Template Not Found: ' + name));
	}
	// attempt to load the template using the templates route in Express.
	$.ajax({
		method: 'GET',
		url: '/templates/' + name,
		dataType: 'json',
		success: function(res) {
			var arr = [];
			// the templates route does not only return the specified temlate, but also
			// all templates it depends on. They are placed in the res.compiled array.
			if(res.compiled.length > 0) {
				for(var i = 0; i < res.compiled.length; i++) {
					arr.push(dust.loadSource(res.compiled[i]));
				}
				// the specified template will always be the first item in the res.compiled array.
				callback(null, res.compiled[0]);
			} else {
				notFound();
			}
		},
		error: notFound
	});
};
