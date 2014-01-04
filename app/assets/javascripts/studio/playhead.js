var Playhead = function( ideasContainer, maxBottom, beats_per_minute, beats_per_bar, bar_count ){
    
	this.beats_per_minute = beats_per_minute;
	this.beats_per_bar = beats_per_bar;
	this.maxBottom = maxBottom;
	this.resetPixelTiming();
	
	this.ideasContainer = $(ideasContainer).bind('mousewheel', function(ev){ self.advance((ev.originalEvent.wheelDelta > 0) ? -1 : 1); });
	this.barsContainer = $('<div id="barlines"></div>').appendTo(this.ideasContainer);
	this.tracksContainer = $('<div id="tracks"></div>').appendTo(this.ideasContainer);
	
	this.bar_count = 0;
	this.setBars(bar_count); 
	
	this.bpmBox = $("#beats_per_minute");
	this.bpmBox.
	    change(     function(){ self.playhead.setBPM(this.value); self.invalidateSavedStatus(); } ).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	this.countBox = $("#count");
	this.countBox.
		change(		function(){ self.playhead.setBars(this.value); self.invalidateSavedStatus(); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	
	
	this.startTime = null;
	this.startFrameTimestamp = null;
	this.location = 0;
	
	this.ideasContainer.css('height', containerHeight+'px' ).css('bottom', this.maxBottom+'px');
};





// Timing
Playhead.prototype.pixels_per_beat = 12; // subject to change by design decision

Playhead.prototype.resetPixelTiming = function(){
	this.pixels_per_bar = this.pixels_per_beat * this.beats_per_bar;
	this.pixels_per_second = (this.beats_per_minute/60) * this.pixels_per_beat;
};



Playhead.prototype.setBars = function(howmany){
	try{
		howmany = parseInt(howmany);
		if( howmany === this.bar_count ){
			return;
		}
		var difference = howmany - this.bar_count;
		this.minBottom -= difference*this.pixelsPerBeat;
		this.ideasContainer.css("height", this.maxBottom-this.minBottom+'px');
		if( howmany > this.bar_count ){
			for( var i = difference; i > 0; i--){
				this.barsContainer.append('<div class="beat"></div>');
			}
		} else{
			this.barsContainer.find('.beat').splice(0, -difference).forEach(function(el){ el.remove(); });
		}
		this.bar_count = howmany;
		this.countBox.val(howmany);
	} catch( ex ) {
		this.notify('Invalid Value for Count. Please Enter a Number', ex.message);
	}
	// remove notifications once notifications system is built
};

Playhead.prototype.setBPM = function(value){
	try{
		this.beats_per_minute = parseInt(value);
	} catch( ex ){
		this.notify('Invalid Value for BPM. Please Enter a Number', ex.message);
	}
	// remove notifications once notifications system is built
};


Playhead.prototype.applyNoda = function(noda){
	noda.trackline.appendTo(this.tracksContainer);
};