(function($){

  spriteButton = function(kind, css) {
    css = $.extend({
      width: '24px',
      height: '24px',
      backgroundColor: 'transparent',
      backgroundImage: 'url("/javascripts/slidable/slidable.png")',
      backgroundRepeat: 'no-repeat',
      border: 'none'
    }, css);
    width = +css.width.replace(/[^0-9]/g,'');
    var kindPositions = { prev: 0, next: 1 };
    css.backgroundPosition = -width * kindPositions[kind] + 'px 0px';
    return $('<button />').addClass(kind).css(css);
  }

  $.fn.slidable = function(options){
    var options = $.extend({css: {}}, options);
    options.css.items = options.css.items || {};
    options.css.wrapper = $.extend({
      width: '100%',
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

    return this.each(function(){
      var
        list = $(this),
        items = list.children();
        viewport = list.wrap('<div />').parent(),
        wrapper = viewport.wrap('<div />').parent();
      viewport.data('list', list);

      items.css(options.css.items);
      wrapper.css($.extend({
        height: items.outerHeight()+'px'
      }, options.css.wrapper ));

      var
        itemsWide = Math.round(wrapper.width()/items.outerWidth()),
        itemsHigh = Math.round(wrapper.height()/items.outerHeight()),
        vertical = ('vertical' in options) ? options.vertical : (itemsHigh > itemsWide && !options.horizontal),
        horizontal = !vertical

      list.css($.extend({
        width: vertical ?
          wrapper.width() :
          items.outerWidth() * Math.ceil(items.length/itemsHigh),
        height: horizontal ?
          wrapper.height() :
          items.outerHeight() * Math.ceil(items.length/itemsWide)
      }, options.css.list ));
      viewport.css(options.css.viewport = $.extend({
        width: items.outerWidth() * itemsWide + 'px'
      }, options.css.viewport ));

      options = $.extend({
        duration: 300 + 2 * items.outerWidth()
      }, options);
      list.options = options;

      list.slide_increment = options.slide_increment || 1;
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
        
        list.scroll_back = function() { this.scroll_by(-this.slide_increment); }

        list.scroll_forward = function() { this.scroll_by(this.slide_increment); }

        if (horizontal) {
          list.prevButton = wrapper.prepend(spriteButton('prev', options.css.buttons)).children().first()
            .css({
              position: 'absolute',
              top: '50%',
              marginTop: '-12px'
            })
            .data('list',list)
            .click(function(e){ $(this).data('list').scroll_back() });
          list.prevButton.css('left', '-'+list.prevButton.outerWidth()+'px')
          list.nextButton = wrapper.append(spriteButton('next', options.css.buttons)).children().last()
            .css({
              position: 'absolute',
              top: '50%',
              marginTop: '-12px'
            })
            .data('list',list)
            .click(function(e){ $(this).data('list').scroll_forward() });
          list.nextButton.css('right', '-'+list.prevButton.outerWidth()+'px')
          list.scroll_to(0); // Disable prev button and, if need be, next button.
        }
      }

    });
  }

})(jQuery);