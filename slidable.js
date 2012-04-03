(function($, undefined){
  $.fn.hiddenDimension = function(){
    if (arguments.length && typeof arguments[0] == 'string') {
      var dimension = arguments[0]

      if (this.is(':visible')) return this[dimension]();

      var visible_container = this.closest(':visible');

      if (!visible_container.is('body')) {
        var
          container_clone = $('<div />')
            .append(visible_container.children().clone())
            .css({
              position: 'absolute',
              left:'-32000px',
              top: '-32000px',
              width: visible_container.width(),
              height: visible_container.height()
            })
            .appendTo('body'),
          element_index = $('*',visible_container).index(this),
          element_clone = $('*',container_clone).slice(element_index);
        
        element_clone.parentsUntil(':visible').show();
        
        var result = element_clone[dimension]();
        container_clone.remove();
        return result;
      } else {
        //TO-DO: support elements whose nearest visible ancestor is <body>
        return undefined
      }
    }
    return undefined //nothing implemented for this yet
  }

  var spriteButton = function(kind) {
    return $('<button class="'+kind+'" />');
  }

  var defaultOptions = {css: { items: {}, viewport: {}, list: {}}};

  var actions = {
    setDefaults: function(options){
      $.extend(true, defaultOptions, options);
    },
    init: function(options){
      var options = $.extend(true, {}, defaultOptions, options);

      this.each(function(){
        var
          list = $(this),
          items = list.children(),
          viewport = list.wrap('<div class="slidable-viewport" />').parent(),
          wrapper = viewport.wrap('<div class="slidable-wrapper" />').parent()
        ;
        // TO-DO: if list.data('slidable') is defined, we're probably going to have problems.
        if (list.data('slidable') === undefined) list.data('slidable', list);

        list.addClass('slidable-list');
        items.addClass('slidable-item');

        var
          vertical = ('columns' in options),
          horizontal = !vertical,
          itemWidth = items.hiddenDimension('outerWidth'),
          itemHeight = items.hiddenDimension('outerHeight'),
          wrapperWidth = wrapper.hiddenDimension('width'),
          wrapperHeight = wrapper.hiddenDimension('height'),
          itemsWide = Math.round(wrapperWidth/itemWidth),
          listWidth = itemsWide * itemWidth,
          itemsHigh = options.rows || Math.round(wrapperHeight/itemHeight),
          columns = itemsWide,
          rows = itemsHigh
        ;
        if (vertical)
          rows = Math.ceil(items.size()/columns)
        else
          columns = Math.ceil(items.size()/rows);
        
        list.css(
          vertical ? {
            width: itemWidth * itemsWide
          } : {
            width: itemWidth * Math.max(columns, itemsWide)
          }
        );

        list.slide_increment = options.slide_increment || 1;
        list.slide_position = 0;
        list.max_slide_position = horizontal ?
          Math.max(0, Math.ceil(items.length/itemsHigh) - itemsWide) :
          Math.max(0, Math.ceil(items.length/itemsWide) - itemsHigh)
        ;

        options = $.extend({
          duration: 300 + Math.round(list.slide_increment * items.outerWidth()),
          easing: 'swing'
        }, options);
        list.options = options;

        if (list.max_slide_position > 0) { // Only set up scrolling buttons if we need to scroll.
        
          list.set_disabled = function(button, disable) {
            var was_disabled = !!button.attr('disabled');
            disable = !!disable
            if (disable !== was_disabled) {
              button.attr('disabled', disable);
              if (disable) button.addClass('.disabled');
              else button.removeClass('.disabled');
            }
          }
          list.scrollTo = function(position, wrap) {
            if (wrap === undefined) wrap = false;
            if (position > list.max_slide_position) {
              position = wrap ? 0 : list.max_slide_position;
            } else if (position < 0) {
              position = wrap ? list.max_slide_position : 0;
            }
            if (position !== list.slide_position) {
              list.slide_position = position;
              if (typeof list.options.beforeScroll === 'function') list.options.beforeScroll.call(list, list.slide_position);
              list.animate(
                {left: -list.children().outerWidth() * list.slide_position + 'px'},
                list.options.duration, list.options.easing,
                function(){
                  if (typeof list.options.afterScroll === 'function') list.options.afterScroll.call(list, list.slide_position);
                  if (list.options.autoRotate) list.autoRotate();
                }
              );
            }
            list.set_disabled(list.prevButton, list.slide_position == 0)
            list.set_disabled(list.nextButton, list.slide_position == this.max_slide_position)
          }

          list.scrollBy = function(delta, wrap) {
            if (typeof wrap === 'undefined') wrap = false;
            list.scrollTo(list.slide_position + delta, wrap);
          }

          list.scrollBack = function(wrap) {
            if (typeof wrap === 'undefined') wrap = false;
            list.scrollBy(-list.slide_increment, wrap);
          }

          list.scrollForward = function(wrap) {
            if (typeof wrap === 'undefined') wrap = false;
            list.scrollBy(list.slide_increment, wrap); 
          }

          if (horizontal) {
            list.prevButton = wrapper.prepend(
              spriteButton('prev')
            ).children().first();
            list.prevButton.click(function(e){ list.scrollBack() });
            list.nextButton = wrapper.append(
              spriteButton('next')
            ).children().last();
            list.nextButton.click(function(e){ list.scrollForward() });
            list.scrollTo(0); // Disable prev button and, if need be, next button.
          }
        }

        if (list.options.pager) {
          list.pager = $(list.options.pager, list.parent().parent().parent());
          if (list.pager.length && list.max_slide_position) {
            var
              pager = list.pager,
              button_el = pager.is('ul') ? 'li' : 'span',
              positions = [], last_position = list.max_slide_position
            ;

            for (var i = 0; i < last_position; i += list.slide_increment) positions.push(i);
            positions.push(last_position);
            $.each(positions, function(i, position) {
              var button = $('<'+button_el+' />'), a = $('<a />');
              a.attr({
                href: '#position-'+position,
                'class': position === 0 ? 'active' : '',
                'data-index': position
              });
              a.click(function(){
                list.scrollTo($(this).data('index'));
                list.autoRotate(false);
                return false;
              });
              a.appendTo(button);
              button.appendTo(pager);
            });

            list.options.beforeScroll = function(position){
              $('.active', pager).removeClass('active');
              $('a[data-index='+(position)+']', pager).addClass('active');
            }
          }
        }
        list.autoRotate = function(delay){
          if (typeof list.timeout === 'number') clearTimeout(list.timeout);
          if (delay !== undefined) list.options.autoRotate = delay;
          if (list.options.autoRotate) {
            list.timeout = setTimeout(function(){
              list.scrollForward([true]);
            }, list.options.autoRotate)
          }
        }
        list.autoRotate();
      });

      return this;
    }
  }

  $.slidable = function(action, options){
    if (typeof actions[action] === 'function') return actions[action](options);
  };

  $.fn.slidable = function(action, options){
    if (typeof action !== 'string') {
      options = action;
      action = 'init';
    }
    if (this.length && this.data('slidable') && this.data('slidable')[action]) {
      return this.data('slidable')[action].call(this, options);
    } else {
      return actions[action].call(this, options);
    }
  };

})(jQuery);