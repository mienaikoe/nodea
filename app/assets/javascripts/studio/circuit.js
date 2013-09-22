var Circuit = function(bindings, ideas) {

    function applyBuffer(url, noda) {
        if (!url) {
            return null;
        } else if (!noda) {
            return null;
        }
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";
        request.onload = function() {
            ctx.decodeAudioData(
                request.response,
                function(buffer) { noda.setBuffer(buffer); },
                function(buffer) { console.log("Error decoding samples!"); }
            );
        };
        request.send();
    };
    
    function keyEventValue( letter ){
        ascii = letter.toUpperCase().charCodeAt(0);
        if (ascii < 48) {
            ascii = ascii + 144;
        } else if (ascii === 59) {
            ascii = 186;
        }
        return ascii;
    }



    // show a loading circle
    this.ideas = ideas;
    var ctx = new webkitAudioContext();
    var nodas = [];
    
    {
        var actionPairs = [];
        
        $("#circuit .node").each(function(i,v) {
            var ascii = keyEventValue($(v).text());
            actionPairs[ascii] = {noda: $(v)};
        }).click(function() {
            // should control the actions of the key. not play note.
        });
        
        $("#circuit .trackSwitch").each(function(i,v){
            var ascii = keyEventValue($(v).text());
            actionPairs[ascii].swytche = $(v);
        }).click(function(){
            // something..?
        });
        
        for( i in actionPairs ){
            var actionPair = actionPairs[i];
            if( actionPair && actionPair.noda && actionPair.swytche ){
                var noda = new Noda(actionPair.noda, actionPair.swytche, ctx);
                applyBuffer(bindings[i], noda);
                nodas[i] = noda;
            }
        }        
        
    }
    this.nodas = nodas;
};