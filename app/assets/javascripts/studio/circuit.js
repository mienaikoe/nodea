var Circuit = function(project) {
    
    var ctx = new webkitAudioContext();
    var nodas = [];
    
    var extractNodeNotes = function( timings, key ){
        var ret = [];
        for( _i in timings ){
            if( timings[_i].key.toUpperCase().charCodeAt(0).toString() === key ){
                ret.push(timings[_i]);
            }
        }
        return ret;
    };
    
    
    {
        var actionPairs = [];
        
        $("#circuit .node").each(function(i,v) {
            var ascii = $(v).text().toUpperCase().charCodeAt(0);
            actionPairs[ascii] = {noda: $(v)};
        }).click(function() {
            // should control the actions of the key. not play note.
        });
        
        $("#circuit .trackSwitch").each(function(i,v){
            var ascii = $(v).text().toUpperCase().charCodeAt(0);
            actionPairs[ascii].swytche = $(v);
        }).click(function(){
            // something..?
        });
        
        for( var i in actionPairs ){
            var actionPair = actionPairs[i];
            var bindings = project.bindings;
            if( actionPair && actionPair.noda && actionPair.swytche ){
                var nodeNotes = extractNodeNotes(project.timings, i);
                nodas[i] = new Noda(actionPair.noda, actionPair.swytche, ctx, nodeNotes, bindings[i]);
            }
        }        
        
    }
    this.nodas = nodas;
};