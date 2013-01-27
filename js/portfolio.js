/**
 * Constructor
 * @param {jQuery Object} $tiles: list items to work with
 */
function Grid($tiles){
    $tiles.parent().addClass('ready');
    this.$tiles = $tiles;
    this.getRows();
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
 * Navigate between projects (tiles) in the grid.
 * @param {jQuery Object} $tile: clicked list item
 *
 * Finds tiles in the chosen row, as well as an adjacent row, to trigger animations.
 * The adjacent row is always lower, unless the current row is last in the list.
 */
Grid.prototype.navigate = function($tile){
    this.$tiles.removeClass('flying');

    this.$active = $tile;
    var top = $tile.position().top;
    if (this.rowPositions.indexOf(top) !== -1) {
        // Use the selected tile's top value to determine its row.
        var rowIndex = this.rowPositions.indexOf(top);
        var tileStart = rowIndex * this.tilesPerRow;
        if (rowIndex === this.rowPositions.length - 1) {
            // If we're in the last row, move the start index up.
            tileStart -= this.tilesPerRow;
        }
        var tileEnd = tileStart + this.tilesMoving;
        // Animate rows off screen
        this.$tiles.slice(tileStart, tileEnd).toggleClass('flying');
    }
};

$(window).load(function(){
    var $tiles = $('.tiles li');
    var portfolio = new Grid($tiles);

    $tiles.find('> a').click(function(event){
        var $tile = $(this).parent();
        portfolio.navigate($tile);
        return false;
    });

    $(window).resize(function(){
        // Throttle this later.
        portfolio.getRows();
    });
});
