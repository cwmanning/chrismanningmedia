/**
 * Portfolio project javascript.
 * @author Chris Manning (chrismanningmedia at gmail dot com)
 */

/**
 * Grid Constructor
 * @param {object} $tiles The list items to work with.
 */
function Grid($tiles){
    this.$tiles = $tiles;
    this.$expanded = $('#expanded');
    this.loadingBars = this.getLoadingBars(12);
    this.getRows();
}

/**
 * Builds html for CSS3-based loading image.
 * @param {Number} barCount The number of bars/divs to generate.
 *
 * Normally wouldn't do this, but it beats loading in
 * another javascript file just for templating.
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
 */
Grid.prototype.getRows = function(){
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
    console.log('getRows', distinct);
    
    // Get the index of the last tile in the first row.
    var rowEndIndex = tops.lastIndexOf(distinct[0]);
    this.tilesPerRow = rowEndIndex + 1;
    this.tilesMoving = this.tilesPerRow * 2;
    this.rowPositions = distinct;
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
    $img.attr('src', dataSrc).load($.proxy(function(){
        dfd.resolve();
    }, this));
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
    this.restore();
    $tile.append(this.loadingBars);

    var rowIndex = Math.floor($tile.index() / this.tilesPerRow);
    var tileStart = rowIndex * this.tilesPerRow;
    if (rowIndex === this.rowPositions.length - 1) {
        // If we're in the last row, move the start index up.
        tileStart -= this.tilesPerRow;
    }
    var tileEnd = tileStart + this.tilesMoving;

    $.when(this.loadExpanded($tile)).done($.proxy(function(){
        $tile.find('.loading').remove();
        // Animate rows off screen.
        this.$tiles.slice(tileStart, tileEnd).toggleClass('flying');
        // Reveal the expanded version of the tile.
        this.showExpanded(rowIndex);
    }, this));
};

/** 
 * Restore the original grid.
 */
Grid.prototype.restore = function(){
    this.$expanded.hide();
    this.$tiles.removeClass('flying');
};

/** 
 * Reveals the expanded version of a tile.
 * @param {Number} rowIndex The index of the clicked tile's row.
 *
 */
Grid.prototype.showExpanded = function(rowIndex){
    var rowTop = this.rowPositions[rowIndex];
    this.$expanded.css('top', rowTop).show();
};


$(window).load(function(){
    var $tiles = $('.tiles > li');
    $tiles.parent().addClass('ready');
    var portfolio = new Grid($tiles);

    $tiles.find('a').click(function(event){
        var $tile = $(this).parent();
        portfolio.navigate($tile);
        return false;
    });

    $(window).resize(function(){
        // Throttle this later.
        portfolio.getRows();
    });
});
