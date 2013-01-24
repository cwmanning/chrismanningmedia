function Grid($tiles){
    this.$tiles = $tiles;
    this.getRows();
}

Grid.prototype.navigate = function($tile){
    this.$active = $tile;
    console.log($tile.position().top);
}

Grid.prototype.getRows = function(){
    var tops = [],
        seen = [],
        distinct = [];

    this.$tiles.each(function(index){
        tops.push($(this).position().top);
    });

    for(var i=0; i < tops.length; i++){
        var value = tops[i];
        if (i === 0 || seen[seen.length - 1] !== value) {
            seen.push(value);
            distinct.push(value);
        }
    }
    console.log(distinct);
    this.rowPositions = distinct;
}


$(document).ready(function(){
    var portfolio = new Grid($('.tiles > li'));

    $('.tiles > li > a').click(function(event){
        var $tile = $(this).parent();
        portfolio.navigate($tile);

        // if on a small screen, stop here. or come up with alternate animations.
        // else...

        /** 
         * Find the other tiles in this row, as well as the next row.
         * The next row is always lower, unless the current row is the last, then it is higher.
         */


        /**
        * Animate the two rows in one direction off screen, leaving blank canvas for
        * larger imagery and project information.
        */

        return false;
    });

    $(window).resize(function(){
        // throttle this later
        portfolio.getRows();
    });
});