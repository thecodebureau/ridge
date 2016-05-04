// 
// DUST MODIFICATIONS
//

var dust = require('dustjs-linkedin');

dust.loading = {};

// if dust cannot find the specified template in dust.cache, this function gets called.
dust.onLoad = function(name, callback) {
  // callback is a function provided by dust.
  function notFound() {
    delete dust.loading[name];
    callback(new Error('Template Not Found: ' + name));
  }
  if(dust.loading[name]) {
    dust.loading[name].push(callback);
    return;
  } else {
    var callbacks = dust.loading[name] = [ callback ];
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
        res.compiled.forEach(dust.loadSource);

        // the specified template will always be the first item in the res.compiled array.
        callbacks.forEach(function(cb) {
          cb(null, res.compiled[0]);
        });

        delete dust.loading[name];
        //callback(null, res.compiled[0]);
      } else {
        notFound();
      }
    },
    error: notFound
  });
};
