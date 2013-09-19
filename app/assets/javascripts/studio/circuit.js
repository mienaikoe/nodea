var Circuit = function(sound_files) {

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
                    function(buffer) {
                        noda.setBuffer(buffer);
                    },
                    function(buffer) {
                        console.log("Error decoding drum samples!");
                    }
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

    var ctx = new webkitAudioContext();
    this.context = ctx;
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
                applyBuffer(sound_files[i], noda);
                nodas[i] = noda;
            }
        }        
        
        // should be able to enter music as a typewriter
        // enter key should skip to next increment a configurable number of times 
        // (smallest chunk is 132)
        $("body").keydown(function(ev) {
            console.log(ev.which);
            if (ev.which < 48 || ev.which > 200) {
                return;
            } else if(ev.which === 13){
                advanceIdeas();
            }
            nodas[ev.which].on();
            ev.preventDefault();
        }).keyup(function(ev) {
            if (ev.which < 48 || ev.which > 200) {
                return;
            }
            nodas[ev.which].off();
        });
    }
    this.nodas = nodas;
    this.final = this.context.destination;
};