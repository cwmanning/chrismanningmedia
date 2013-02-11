/**
 * Portfolio project javascript.
 * @author Chris Manning (chrismanningmedia at gmail dot com)
 */
 'use strict';

/**
 * Grid Constructor
 * @param {Object} $tiles The list items to work with.
 * @param {Object} $expanded The expanded element.
 * @param {Object} $content The expanded element's content area.
 * @param {Object} $scroll The element to animate scrollTop.
 * @param {Number} width The window width.
 * @param {Number} width The minimum window width for full grid functionality.
 */
function Grid($tiles, $expanded, $content, $scroll, width, minWidth){
    this.$tiles = $tiles;
    this.$expanded = $expanded;
    this.$expandedContent = $content;
    this.$scroll = $scroll;
    this.duration = 500;
    this.easing = 'easeInOutCubic';
    this.first = true;
    this.isNavigating = false;
    this.canNavigate = (width >= minWidth);
    this.resize = null;
    this.winWidth = width;
    this.minWidth = minWidth;

    this.initialize(width);
}

/**
 * Adds event listeners for the Grid app.
 */
Grid.prototype.addEvents = function(){
    var self = this;
    this.$tiles.find('a').click(function(event){
        if (self.canNavigate && !self.isNavigating) {
            self.isNavigating = true;
            var $tile = $(this).parent();
            self.navigate($tile);
        }
        return false;
    });
    this.$expanded.find('#return').click(function(event){
        self.restore();
        return false;
    });
    $(window).resize(function(event){
        clearTimeout(self.resize);
        self.resize = setTimeout(function(){
            self.initialize($(this).width(), true);
        }, 200);
    });
};

/**
 * Builds html for CSS3-based loading image.
 * @param {Number} barCount The number of bars/divs to generate.
 *
 * Normally wouldn't do this, but it beats loading in
 * a javascript file just for templating.
 */
Grid.prototype.getLoadingBars = function(barCount){
    var loading = '<div class="loading">';
    for (var i = 1; i <= 12; i++) {
        loading += '<div class="bar' + i + '"></div>';
    }
    this.loadingBars = loading + '</div>';
}

/**
 * Calculate and set information about the number of rows in the grid.
 * @param {Number} width The window width.
 */
Grid.prototype.getRows = function(width){
    var tops = [],
        seen = [],
        distinct = [];

    this.$tiles.each(function(index){
        tops.push($(this).position().top);
    });

    for (var i=0; i < tops.length; i++){
        var value = tops[i];
        if (i === 0 || seen[seen.length - 1] !== value) {
            seen.push(value);
            distinct.push(value);
        }
    }
    
    // Get the index of the last tile in the first row.
    var rowEndIndex = tops.lastIndexOf(distinct[0]);
    this.tilesPerRow = rowEndIndex + 1;
    this.tilesMoving = this.tilesPerRow * 2;
    this.tilesWidth = this.$tiles.eq(0).width();
    this.rowPositions = distinct;
    return $.Deferred().resolve();
};

/** 
 * Hides the expanded version of a tile.
 * @param {Boolean} animate Whether or not to animate.
 */
Grid.prototype.hideExpanded = function(animate){
    var duration = (animate) ? 160 : 0;
    return this.$expanded.find('img, .more-content').transition({ x: '-600px' }, duration, this.easing).promise().done(function(){
        this.$expanded.hide();
    }.bind(this));
};

/** 
 * Does setup work on grid creation and window resize.
 * @param {Number} width The window width.
 */
Grid.prototype.initialize = function(width, isResize){
    // Throttle this later.
    if (isResize) {
        this.restore(true);
    } else {
        this.getLoadingBars(12);
        this.addEvents();
    }
    
    this.getRows().done(function(){
        this.setExpanded();
    }.bind(this));
    
    this.winWidth = width;
    this.canNavigate = (width >= this.minWidth);
};

/** 
 * Loads the expanded version of a tile.
 * @param {Object} $tile The clicked list item.
 *
 * Loads larger image when tile is selected.
 */
Grid.prototype.loadExpanded = function($tile){
    var $more = $tile.find('.more');
    var $img = $more.find('img');
    var dataSrc = $img.attr('data-src');
    if (!dataSrc) {
        dataSrc = $img.attr('src');
    }
    var $newImg = $('<img>').attr('src', dataSrc);
    
    var deferred = $.Deferred();
    $newImg.one('load', function(event){
        deferred.resolve($more, event.currentTarget);
    });
    return deferred.promise();
};

/** 
 * Navigate between projects (tiles) in the grid.
 * @param {Object} $tile The clicked list item.
 *
 * Finds tiles in the chosen row, as well as an adjacent row, to trigger animations.
 * The adjacent row is always lower, unless the current row is last in the list.
 */
Grid.prototype.navigate = function($tile){
    $tile.append(this.loadingBars);

    var rowIndex = Math.floor($tile.index() / this.tilesPerRow);
    var tileStart = rowIndex * this.tilesPerRow;
    if (rowIndex === this.rowPositions.length - 1) {
        // If we're in the last row, move the start index up.
        tileStart -= this.tilesPerRow;
        rowIndex--;
    }
    var tileEnd = tileStart + this.tilesMoving;
    var $tilesToMove = this.$tiles.slice(tileStart, tileEnd);

    var self = this;
    $.when(this.loadExpanded($tile), this.scrollToRow(rowIndex)).done(function($content){
        $tile.find('.loading').remove();
        var restoreDeferred = $.Deferred();
        self.restore().done(function(){
            restoreDeferred.resolve();
        });
        // Animate rows off screen. The .promise() ensures one callback is fired when transitioning multiple elements.
        $tilesToMove.transition({ x: self.winWidth }, self.duration, self.easing).promise().done(function(){
            self.$tilesHidden = $tilesToMove;
            // Reveal the expanded version of the tile.
            restoreDeferred.done(function(){
                self.swapExpanded($content[0], $content[1]).done(function(){
                    self.showExpanded(rowIndex).done(function(){
                        self.isNavigating = false;
                    });
                });
            });
        });
    });
};

/** 
 * Restore the original grid.
 */
Grid.prototype.restore = function(isResize){
    var deferred = $.Deferred();
    this.isNavigating = false;
    if (this.first) {
        this.first = false;
        deferred.resolve();
    } else {
        var animate = !isResize;
        $.when(this.hideExpanded(animate), this.showTiles(animate)).done(function(){
            deferred.resolve();
        });
    }
    return deferred.promise();
};

/** 
 * Sets the width of the expanded content area to match the grid on resize callback.
 */
Grid.prototype.setExpanded = function(){
    this.$expanded.css('width', this.tilesPerRow * (this.tilesWidth + 10));
};

/** 
 * Animates scroll position to the selected tile's row.
 * @param {Number} rowIndex The index of the clicked tile's row.
 */
Grid.prototype.scrollToRow = function(rowIndex){
    if ($(window).scrollTop() === 0 && rowIndex === 0) {
        return $.Deferred().resolve();
    } else {
        return this.$scroll.animate({
            scrollTop: this.rowPositions[rowIndex]
        }, 400);
    }
}

/** 
 * Reveals the expanded version of a tile.
 * @param {Number} rowIndex The index of the clicked tile's row.
 */
Grid.prototype.showExpanded = function(rowIndex){
    this.$expanded.find('img, .more-content').transition({ x: '-600px' }, 0);
    var rowTop = this.rowPositions[rowIndex];
    return this.$expanded.css('top', rowTop)
        .show()
        .find('img, .more-content')
        .transition({ x: '0' }, 160, this.easing)
        .promise();
};

/** 
 * Hides the expanded version of a tile.
 * @param {Boolean} animate Whether or not to animate.
 */
Grid.prototype.showTiles = function(animate){
    var duration = (animate) ? this.duration : 0;
    if (this.$tilesHidden) {
        return this.$tilesHidden.transition({ x: '0' }, this.duration, this.easing).promise();
    }
};

/** 
 * Swaps content of the expanded version of a tile.
 * @param {Object} $content The content to use for expansion.
 * @param {Object} img The loaded image to show.
 *
 * Clone content and write to a central location.
 * Elements must be positioned outside of the animating tiles,
 * and this allows for that without affecting markup and SEO.
 */
Grid.prototype.swapExpanded = function($content, img){
    $content.find('img').replaceWith(img);
    var content = $content.get(0);
    var clone = content.cloneNode(true);
    return this.$expandedContent.html(clone).promise();
};


$(window).load(function(){
    var $scroll = $('html, body');
    var portfolio = new Grid(
        $('.tiles > li'),
        $('#expanded'),
        $('#expandedContent'),
        $scroll,
        $(this).width(),
        740
    );

    /**
     * Site navigation click handler, not part of Grid
     */
    $('.intro > nav a').click(function(event){
        var href = $(this).attr('href');
        if (href[0] === '#'){
            event.preventDefault();
            var top = $(href).offset().top;
            if (top) {
                $scroll.animate({
                    scrollTop: top
                }, 400);
            }
        }
    });
});
