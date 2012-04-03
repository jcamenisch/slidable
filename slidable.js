(function($){
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
}(jQuery));

(function($){

  spriteButton = function(kind, css) {
    css = $.extend({
      position: 'absolute',
      top: '50%',
      width: '24px',
      height: '24px',
      padding: '0',
      border: 'none',
      backgroundColor: 'transparent',
      backgroundImage: 'url("/javascripts/slidable/slidable.png")',
      backgroundRepeat: 'no-repeat',
      border: 'none',
      zIndex: '1'
    }, css);
    width = +css.width.replace(/[^0-9]/g,'');
    height = +css.height.replace(/[^0-9]/g,'');
    var kindPositions = { prev: 0, next: 1 };
    css.backgroundPosition = -width * kindPositions[kind] + 'px 0px';
    css.marginTop = css.marginTop || Math.round(-height/2) + 'px';
    return $('<button />').addClass(kind).css(css);
  }

  var elements;

  var actions = {
    init: function(options){
      var options = $.extend({css: {}}, options);
      options.css.items = options.css.items || {};
      options.css.wrapper = $.extend({
        overflow: 'hidden',
        position: 'relative',
        overflow: 'visible'
      }, options.css.wrapper );
      options.css.list = $.extend({
        position: 'absolute',
        margin: 0,
        left: 0,
        top: 0
      }, options.css.list );
      options.css.viewport = $.extend({
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        padding: 0,
        margin: 0
      }, options.css.viewport );

      elements.each(function(){
        if (typeof $(this).data('slidable') === 'undefined') $(this).data('slidable', $(this))
        var
          list = $(this).data('slidable'),
          items = list.children(),
          viewport = list.wrap('<div class="slidable-viewport" />').parent(),
          wrapper = viewport.wrap('<div class="slidable-wrapper" />').parent()
        ;

        items.css(options.css.items);
        wrapper.css($.extend({
          height: items.outerHeight()+'px'
        }, options.css.wrapper ));

        var
          wrapper_width = wrapper.width() || wrapper.hiddenDimension('width'),
          itemsWide = Math.round(wrapper_width/items.outerWidth()),
          list_width = itemsWide * items.outerWidth();
          itemsHigh = Math.round(wrapper.height()/items.outerHeight()),
          vertical = ('vertical' in options) ? options.vertical : (itemsHigh > itemsWide && !options.horizontal),
          horizontal = !vertical

        wrapper.css($.extend({
          width: list_width+'px'
        }, options.css.wrapper ));
        
        wrapper_width = wrapper.width() || wrapper.hiddenDimension('width');

        list.css($.extend({width: list_width, height: wrapper.height()}, options.css.list));
        if (horizontal) {
          list.css('width', Math.max(
            +(options.css.list.width || '0').replace(/[^0-9]/g,''),
            wrapper_width,
            items.outerWidth() * Math.ceil(items.length/itemsHigh)
          ));
        } else {
          list.css('height', Math.max(
            +(options.css.list.height || '0').replace(/[^0-9]/g,''),
            wrapper.height(),
            items.outerHeight() * Math.ceil(items.length/itemsWide
          )));
        }
        viewport.css(options.css.viewport = $.extend({
          width: items.outerWidth() * itemsWide + 'px'
        }, options.css.viewport ));

        list.slide_increment = options.slide_increment || 1;
        list.slide_position = 0;
        list.max_slide_position = horizontal ?
          Math.max(0, Math.ceil(items.length/itemsHigh) - itemsWide) :
          Math.max(0, Math.ceil(items.length/itemsWide) - itemsHigh);

        options = $.extend({
          duration: 300 + Math.round(list.slide_increment * items.outerWidth()),
          easing: 'swing'
        }, options);
        list.options = options;

        if (list.max_slide_position > 0) { // Only set up scrolling buttons if we need to scroll.
        
          list.set_disabled = function(button, disable) {
            var was_disabled = !!button.attr('disabled'); disable = !!disable
            if (disable != was_disabled) {
              button.attr('disabled', disable);
              var sprite_position = +button.css('background-position-x').replace(/px/,'');
              var move_sprite = (disable ? -2 : 2) * button.outerWidth();
              button.css('background-position-x', sprite_position+move_sprite+'px')
            }
          }
          list.scrollTo = function(position, wrap) {
            if(typeof wrap == 'undefined') wrap = false;
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
              spriteButton('prev', $.extend(options.css.buttons, options.css.prevButton))
            ).children().first();
            list.prevButton
              .click(function(e){ list.scrollBack() })
              .css('left',
                list.prevButton.css('left') == 'auto' ?
                  '-'+list.prevButton.outerWidth()+'px' :
                  list.prevButton.css('left')
              );

            list.nextButton = wrapper.append(
              spriteButton('next', $.extend(options.css.buttons, options.css.nextButton))
            ).children().last();
            list.nextButton
              .click(function(e){ list.scrollForward() })
              .css('right', list.nextButton.css('right') == 'auto' ?
                '-'+list.prevButton.outerWidth()+'px' :
                list.nextButton.css('right')
              );
            list.scrollTo(0); // Disable prev button and, if need be, next button.
          }
        }

        list.autoRotate = function(delay){
          if (typeof list.timeout === 'number') clearTimeout(list.timeout);
          if (typeof delay !== 'undefined') list.options.autoRotate = delay;
          if (list.options.autoRotate) {
            list.timeout = setTimeout(function(){
              list.scrollForward([true]);
            }, list.options.autoRotate)
          }
        }
        list.autoRotate();
      });

      return elements;
    }
  }

  $.fn.slidable = function(action, options){
    if (typeof action != 'string') {
      options = action;
      action = 'init'
    }
    elements = $(this);
    if (elements && elements.data('slidable') && elements.data('slidable')[action]) {
      return elements.data('slidable')[action](options);
    } else {
      return actions[action](options);
    }
  }

})(jQuery);