var nodtes=[];

$(function(){

    $("#nodes .node").each( function(i,v){
        var ascii = $(v).text().toUpperCase().charCodeAt(0);
        if( ascii < 48 ){
            ascii = ascii + 144;
        } 
        nodtes[ascii] = $(v);
    }).mousedown( function(){ 
        startNote(this);
    }).mouseup( function(){
        endNote(this);
    });

    $("body").keydown( function(ev){
        startNote(nodtes[ev.which]);
        ev.preventDefault();
    }).keyup( function(ev){ 
        endNote(nodtes[ev.which]);
    });
});




var endNote = function(el){
    $(el).removeClass('active');
};
var startNote = function(el){
    $(el).addClass('active');
}