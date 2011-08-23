(function($){

  spriteButton = function(kind, width, height, img) {
    width = width || 24;
    height = height || width;
    img = img || '/javascripts/slidable/slidable.png';
    kindIndexes = {
      prev: 0,
      next: 1
    }
    return $('<button />')
      .addClass(kind)
      .css({
        width: (width || 24)+'px',
        height: (height || width || 24)+'px',
        backgroundColor: 'transparent',
        backgroundImage: 'url("'+img+'") ',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: -width * kindIndexes[kind] +'px 0px',
        border: 'none'
      });
  }

  $.fn.slidable = function(options){
    var options = $.extend({css: {}}, options);

    return this.each(function(){
      var
        list = $(this),
        items = list.children();
      var viewport = list.wrap('<div />').parent();
      var wrapper = viewport.wrap('<div />').parent();
      viewport.data('list', list);

      items.css(options.css.items = options.css.items || {});
      wrapper.css(options.css.wrapper = $.extend(
        {
          height: items.outerHeight()+'px',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
          overflow: 'visible'
        },
        options.css.wrapper
      ));

      var itemsWide = Math.round(wrapper.width()/items.outerWidth());
      var itemsHigh = Math.round(wrapper.height()/items.outerHeight());
      var vertical = ('vertical' in options) ?
        options.vertical : 
        (itemsHigh > itemsWide && !options.horizontal);
      var horizontal = !vertical

      list.css(options.css.list = $.extend(
        {
          position: 'absolute',
          margin: 0,
          left: 0,
          top: 0,
          width: vertical ?
            wrapper.width() :
            items.outerWidth() * Math.ceil(items.length/itemsHigh),
          height: horizontal ?
            wrapper.height() :
            items.outerHeight() * Math.ceil(items.length/itemsWide)
        }, 
        options.css.list
      ));
      viewport.css(options.css.viewport = $.extend(
        {
          position: 'relative',
          width: items.outerWidth() * itemsWide + 'px',
          height: '100%',
          overflow: 'hidden',
          padding: 0,
          margin: 0
        },
        options.css.viewport
      ));

      options = jQuery.extend({
        duration: 300 + 2 * items.outerWidth()
      }, options);
      list.options = options;

      list.slide_position = 0;
      list.max_slide_position = horizontal ?
        Math.max(0, Math.ceil(items.length/itemsHigh) - itemsWide) :
        Math.max(0, Math.ceil(items.length/itemsWide) - itemsHigh);

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
        list.scroll_to = function(position) {
          this.slide_position = (
            position > this.max_slide_position ? this.max_slide_position :
              position < 0 ? 0 :
                position
          );
          this.set_disabled(this.prevButton, this.slide_position == 0)
          this.set_disabled(this.nextButton, this.slide_position == this.max_slide_position)
          this.animate({left: -this.children().outerWidth() * this.slide_position + 'px'}, this.options.duration);
        }

        list.scroll_by = function(delta) {
          this.scroll_to(this.slide_position + delta)
        }

        if (horizontal) {
          list.prevButton = wrapper.prepend(spriteButton('prev')).children().first()
            .css({
              position: 'absolute',
              top: '50%',
              marginTop: '-12px',
              left: '-25px'
            })
            .data('list',list)
            .click(function(e){ $(this).data('list').scroll_by(-1) });
          list.nextButton = wrapper.append(spriteButton('next')).children().last()
            .css({
              position: 'absolute',
              top: '50%',
              marginTop: '-12px',
              right: '-25px'
            })
            .data('list',list)
            .click(function(e){ $(this).data('list').scroll_by(1) });
          list.scroll_to(0); // Disable prev button and, if need be, next button.
        }
      }

    });
  }

})(jQuery);