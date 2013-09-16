var Studio = function(sound_files) {

    var Machine = function(sound_files) {
        
        var Noda = function(div, ctx){
            this.div = div;
            this.context = ctx;
        };
        Noda.prototype.setBuffer = function(buffer){
            this.buffer = buffer;
        };
        Noda.prototype.on = function(){
            if( !this.src ){
                this.src = this.context.createBufferSource();
                this.src.buffer = this.buffer;
                this.src.connect(this.context.destination);
                this.src.start(0);
            }
            $(this.div).addClass('active');
        };
        Noda.prototype.off = function(){
            if( this.src ){
                this.src.stop(0);
                this.src.disconnect(0);
                this.src = null;
            }
             $(this.div).removeClass('active');
        };
        
        
        var bufferFromUrl = function(url, noda){
            if( !url ){
                return null;
            } else if( !noda ){
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
        
        
          
        // show a loading circle
        
        var ctx = new webkitAudioContext();
        this.context = ctx;
        
        var nodas = [];
        {
            $("#nodes .node").each(function(i, v) {
                var ascii = $(v).text().toUpperCase().charCodeAt(0);
                if (ascii < 48) {
                    ascii = ascii + 144;
                }
                var noda = new Noda($(v), ctx);
                bufferFromUrl(sound_files[ascii], noda);
                nodas[ascii] = noda;
            }).click(function() {
                // should control the actions of the key. not play note.
            });

            $("body").keydown(function(ev) {
                nodas[ev.which].on();
                ev.preventDefault();
            }).keyup(function(ev) {
                nodas[ev.which].off();
            });
        }
        this.nodas = nodas;
        this.final = this.context.destination;
    };



    var Ideas = function(nodes) {

    };



    this.machine = new Machine(sound_files);
    this.ideas = new Ideas(this.nodas);
};

