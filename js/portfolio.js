$(document).ready(function(){
    $('.tile').click(function(e){
        $(this).find('.zoom').toggle();
        return false;
    });
});