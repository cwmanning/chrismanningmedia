$(document).ready(function(){
    $('.tiles > li > a').click(function(e){
        //$(this).siblings('.zoom').toggle();
        var $tile = $(this).parent();

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
});