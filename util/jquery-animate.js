/* Animate views */

var transitionend = 'transitionend';

$(document).on(transitionend, '.animate.active', function() {
  $(this).dequeue();
});

function transition(className, options, complete) {
  options = options || {};

  if (options.className)
    className += ' ' + options.className;

  var stop;

  return {
    start: function(next, hooks) {
      hooks.stop = stop = animate.call(this, className, options);
    },

    finish: function() {
      if (complete) complete.call(this);
      stop();
      $(this).removeClass('animate active').css({ height: '' }).dequeue();
    }
  };
}

function animate(className, options) {
  // The extra offsetHeight is required to fix IE bug. if there is button in the page,
  // the page will be placed at it's end location, then aniamted out until the enter active class is added.
  //
  // this bug can apparently be sorted by setting the start position in .animate instead of .page
  //$(this).addClass('enter');

  // force redraw
  //this.offsetHeight;
  var elem = $(this).addClass('animate ' + className);

  // force redraw
  this.offsetHeight;

  var timeout = setTimeout(function() {
    elem.addClass('active');

    var duration = parseFloat(elem.css('transition-duration'));

    timeout = setTimeout(function() {
      // finish animation if we are still waiting for transitionend

      if (elem.is('.animate.active')) elem.dequeue();
    }, duration > 0 ? duration * 1100 : 0);
  });

  return function() {
    clearTimeout(timeout);
    elem.removeClass(className);
  };
}

$.fn.extend({

  toggle: function(options) {
    if(this.hasClass('hidden') || this.hasClass('leave'))
      this.show(options);
    else 
      this.hide(options);
  },

  enter: function(element, options, complete) {
    options = options || {};

    var enter = transition('enter', options, complete);

    return this.queue(function() {
      $(element)[options.method || 'append'](this);

      $(this).removeClass('hidden');

      if (options.animateHeight)
        $(this).css('height', this.scrollHeight);

      enter.start.apply(this, arguments);
    }).queue(enter.finish);
  },

  leave: function(options, complete) {

    var leave = transition('leave', options, complete || function() {
      // remove element when transition ends
      $(this).remove();
    });

    this.finish();

    if (options && options.animateHeight && !this.hasClass('animate')) {
      this.queue(function(next, hooks) {
        $(this).css('height', this.scrollHeight);

        this.offsetHeight;

        var timeout = setTimeout(next);

        hooks.stop = function() {
          clearTimeout(timeout);
        };
      });
    }
    
    return this.queue(leave.start).queue(leave.finish);
  },

  show: function(options) {
    this.finish()
      .queue(function(next) {
        $(this).addClass('visible');

        next();
      });

    return this.enter(null, options);
  },

  hide: function(options) {

    return this.leave(options, function() {
      $(this).addClass('hidden').removeClass('visible');
    });
  }
});
