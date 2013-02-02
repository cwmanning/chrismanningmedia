/**
 * Portfolio project javascript.
 * @author Chris Manning (chrismanningmedia at gmail dot com)
 */

/**
 * Grid Constructor
 * @param {object} $tiles The list items to work with.
 * @param {Number} width The window width.
 */
function Grid($tiles, width){
    this.$tiles = $tiles;
    this.$expanded = $('#expanded');
    this.loadingBars = this.getLoadingBars(12);
    this.duration = 400;
    this.easing = 'in-out';
    this.first = true;
    this.isNavigating = false;
    this.getRows(width);
}

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
    return loading + '</div>';
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
    this.rowPositions = distinct;
    this.winWidth = width;
};

/** 
 * Loads the expanded version of a tile.
 * @param {object} $tile The clicked list item.
 *
 * Clone content and write to a central location.
 * Elements must be positioned outside of the animating tiles,
 * and this allows for that without affecting markup and SEO.
 */
Grid.prototype.loadExpanded = function($tile){
    var more = $tile.find('.more').get(0);
    var moreClone = more.cloneNode(true);
    var $img = this.$expanded.html(moreClone).find('img');
    var dataSrc = $img.attr('data-src');
    var dfd = $.Deferred();
    $img.attr('src', dataSrc).load(function(){
        dfd.resolve();
    });
    return dfd.promise();
};

/** 
 * Navigate between projects (tiles) in the grid.
 * @param {object} $tile The clicked list item.
 *
 * Finds tiles in the chosen row, as well as an adjacent row, to trigger animations.
 * The adjacent row is always lower, unless the current row is last in the list.
 */
Grid.prototype.navigate = function($tile){
    if (!this.isNavigating) {
        this.isNavigating = true;
        $tile.append(this.loadingBars);

        var rowIndex = Math.floor($tile.index() / this.tilesPerRow);
        var tileStart = rowIndex * this.tilesPerRow;
        if (rowIndex === this.rowPositions.length - 1) {
            // If we're in the last row, move the start index up.
            tileStart -= this.tilesPerRow;
            rowIndex--;
        }
        var tileEnd = tileStart + this.tilesMoving;

        var self = this;
        $.when(this.loadExpanded($tile)).done(function(){
            $tile.find('.loading').remove();
            self.restore();
            // Animate rows off screen.
            self.$tiles.slice(tileStart, tileEnd).transition({ x: self.winWidth }, self.duration, self.easing).promise().done(function(){
                // Reveal the expanded version of the tile.
                self.showExpanded(rowIndex).done(function(){
                    self.isNavigating = false;
                });
            });
        });
    }
};

/** 
 * Restore the original grid.
 */
Grid.prototype.restore = function(){
    var dfd = $.Deferred();
    if (this.first) {
        this.first = false;
        dfd.resolve();
    } else {
        $.when(this.hideExpanded(), this.showTiles()).done(function(){
            dfd.resolve();
        });
    }
    return dfd.promise();
};

/** 
 * Hides the expanded version of a tile.
 */
Grid.prototype.showTiles = function(){
    return this.$tiles.transition({ x: '0' }, this.duration, this.easing);
};

/** 
 * Hides the expanded version of a tile.
 */
Grid.prototype.hideExpanded = function(){
    return this.$expanded.find('img').transition({ left: '-600px' }, 200, this.easing).promise().done(function(){
        this.$expanded.hide();
    }.bind(this));
};

/** 
 * Reveals the expanded version of a tile.
 * @param {Number} rowIndex The index of the clicked tile's row.
 */
Grid.prototype.showExpanded = function(rowIndex){
    var rowTop = this.rowPositions[rowIndex];
    return this.$expanded.css('top', rowTop)
        .show()
        .find('img')
        .transition({ left: '0' }, 200, this.easing)
        .promise();
};


$(window).load(function(){
    var $tiles = $('.tiles > li');
    $tiles.parent().addClass('ready');
    var portfolio = new Grid($tiles, $(this).width());

    $tiles.find('a').click(function(event){
        var $tile = $(this).parent();
        portfolio.navigate($tile);
        return false;
    });

    $(window).resize(function(){
        // Throttle this later.
        portfolio.getRows($(this).width());
    });
});
