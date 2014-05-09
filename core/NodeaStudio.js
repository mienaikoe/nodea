//= require_tree .

var assert = function(obj){
	return (typeof(obj) !== 'undefined' && obj !== null);
};

window.requestAnimationFrame = 
		window.requestAnimationFrame || 
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame ||
		window.msRequestAnimationFrame;
		
window.AudioContext = 
		window.AudioContext || 
		window.webkitAudioContext;

window.AudioContext.prototype.createGainNode =
		window.AudioContext.prototype.createGainNode || 
		window.AudioContext.prototype.createGain;

if( !window.requestAnimationFrame || !window.AudioContext ){
	alert("It looks like your browser doesn't support this application. Please try a more modern Browser.");
}

navigator.vibrate = 
		navigator.vibrate || 
		navigator.webkitVibrate || 
		navigator.mozVibrate || 
		navigator.msVibrate ||
		function(duration){};




function NodeaStudio(ideasContainer, circuitsContainer, project) {
	// Convenience Variable for setting event handling.
	var self = this;
	
	// TODO: Don't know if i should add some global filters or effects to this and have those be configurable as well.
	this.ctx = new AudioContext(); 
	
	// Create space for Circuit-Specific Styles
	this.circuitStylesheet = document.createElement('style');
	this.circuitStylesheet.setAttribute("type","text/css");
	document.head.appendChild(this.circuitStylesheet);

	this.project_id = project.project_id;
	this.project_name = project.name;
	this.project_description = project.description;	
	this.keysetName = project.keyset;
	
	this.looping = project.looping || false;
	this.loop_start = project.loop_start || 0;
	this.loop_end = project.loop_end || 48;
	
	this.saved = true;
	this.undoList = new UndoList();
	
	this.beats_per_minute = project.beats_per_minute;
	this.resetPixelTiming();
	
	// === Main UI Containers ===
	this.circuitsContainer = $(circuitsContainer).click(function(ev){ 
		self.nodas.forEach(function(noda){ 
			noda.lightOff('selected'); 
		});
	});

	this.ideasContainer = $(ideasContainer).
		bind('mousewheel', function(ev){ 
			self.advance((ev.originalEvent.wheelDelta > 0) ? self.advanceAmount : -self.advanceAmount); 
		}).mousedown(function(ev){
			// unless propagation stopped by notes
			Note.unselectAll();
			self.startSelectBox(ev.pageX, ev.pageY);
		});
	this.barsContainer = $('<div id="barlines"></div>').appendTo(this.ideasContainer);
	this.tracksContainer = $('<div id="tracks"></div>').appendTo(this.ideasContainer);
	
	
	// === Loopin Bars ===
	$('<div/>', {class:'loop', id:'loopStart'}).css("bottom",this.loop_start+"px").appendTo(this.barsContainer);
	$('<div/>', {class:'loop', id:'loopEnd'}).css("bottom",this.loop_end+"px").appendTo(this.barsContainer);
	
	
	// === Instantiate Nodas ===
	this.nodas = [];
	this.keyset = this.keySets[this.keysetName];
	this.flatKeyset = this.keyset.reduce(function(a, b) {
		return a.concat(b);
	});
	this.keyContainer = $(this.circuitsContainer).find("#nodes");
	this.swytcheContainer = $(this.circuitsContainer).find("#swytches");
	
	
	
	this.loadedCircuits = ["Circuit"];	
	this.loadingCircuits = {};
	
	var nodeRowClass = "sinistra";
	this.keyset.forEach(function(keySetRow, idx){
		var keyRow = jQuery('<div/>',{class: 'nodeRow '+nodeRowClass}).appendTo(this.keyContainer);
		keySetRow.forEach(function(keySetKey){
			// Bad Hack: Fills out Containers so incoming containers can have proper placement.
			keyRow.append("<spiv/>");
			this.swytcheContainer.append("<spiv/>");
			this.tracksContainer.append("<spiv/>");
			// End Bad Hack
			
			var persistedNoda = project.nodas.filter(function(noda){ return noda.ordinal === keySetKey; })[0];
			if( !persistedNoda ){
				persistedNoda = { id: null, ordinal: keySetKey, handle: "Circuit", notes: [] };
			}
			
			this.initializeNoda(persistedNoda);
		}, this);
		nodeRowClass = nodeRowClass === 'sinistra' ? 'dextra' : 'sinistra';
	}, this);
	
	jQuery('<div/>',{class: 'touchpad'}).appendTo(this.keyContainer);
	
	
	// === Event Handling ===
	$("body").keydown(function(ev) {
		if( ev.ctrlKey && ev.keyCode in self.ctrlKeyControlMap){
			self.ctrlKeyControlMap[ev.keyCode](self);
			ev.preventDefault();
		} else if( ev.keyCode in self.keyCodeToAsciiMap ){
			var interactiveNoda = self.nodas[self.keyCodeToAsciiMap[ev.keyCode]];
	        self.noteOn( interactiveNoda );
			interactiveNoda.keydown = true;
			ev.preventDefault();
	    } else if( ev.keyCode in self.eventControlMap ){
	        self.eventControlMap[ev.keyCode](self);
			ev.preventDefault();
	    } else {
			console.log(ev.keyCode);
	        return;
	    }
	}).keyup(function(ev) {
	    if( ev.keyCode in self.keyCodeToAsciiMap ){
			var interactiveNoda = self.nodas[self.keyCodeToAsciiMap[ev.keyCode]];
	        self.noteOff( interactiveNoda );
			interactiveNoda.keydown = false;
			ev.preventDefault();
	    } else if( ev.keyCode in self.eventControlMap ){
	        // do nothing
			ev.preventDefault();
	    } else {
	        return;
		}
	}).mouseup(function(ev){
		self.nodas.forEach(function(noda){ if(noda.mousedown){ self.noteOff(noda); } });
	});
	
	

	// Middle Controls
	// TODO: Should these be initialized in js?
	this.advanceBox = $("#advance_box");
	this.advanceAmount = this.pixels_per_beat;
	this.advanceBox.change(	function(){ 
		var parts = this.value.split("_");
		var counter = parseInt(parts[0]);
		switch(parts[1]){
			case "bar": self.advanceAmount = counter * self.pixels_per_bar; break;
			case "beat":
				self.advanceAmount = counter * self.pixels_per_beat; break;
			case "pixel":
				self.advanceAmount = counter; break;
		}
	});
			
	this.snapBox = $("#snap_resolution_box");
	this.snapResolution = parseInt(this.snapBox.val());
	this.snapBox.change( function(){
		self.snapResolution = parseInt(this.value);
	});
			
	
	this.bpmBox = $("#bpm");
	this.bpmBox.
	    change(     function(){ self.setBPM(this.value); } ).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	this.barSizeBox = $("#bar_size");
	this.barSizeBox.
		change(		function(){ self.setBarSize(this.value); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	this.barCountBox = $("#bar_count");
	this.barCountBox.
		change(		function(){ self.setBarCount(this.value); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	$('#name').
		change(		function(){ self.setName(this.value); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });
	$('#description').
		change(		function(){ self.setDescription(this.value); }).
	    keydown(    function(ev){ ev.stopPropagation(); }).
	    keyup(      function(ev){ ev.stopPropagation(); });


	this.metronome = new Metronome(this.ctx, $("#metronome"), this.beats_per_minute);
	
	this.bar_count = 0;
	this.beats_per_bar = 0;
	this.setBarSize(project.beats_per_bar, true);
	this.setBarCount(project.bar_count, true);
	this.setLocation(0);


	// Drawers
	DrawerUtils.activateDrawerToggles($("#master_drawer"));
	


	// === Animation/Timing ===
	this.startTime = null;
	this.startFrameTimestamp = null;
	this.recording = false;
	this.recordingNodas = [];
};





// External Startup Functions


NodeaStudio.prototype.initializeNoda = function(persistedNoda, callback){
	if(!callback){
		callback = function(newCircuit){};
	}
	var nodaInitializer = function(){
		var newCircuit = this.eagerInitializeNoda(persistedNoda);
		callback.call(this, newCircuit);
	};
	
	if( this.loadedCircuits.indexOf(persistedNoda.handle) == -1 ){
		this.loadCircuit(persistedNoda, nodaInitializer);
	} else {
		nodaInitializer.call(this);
	}
};


NodeaStudio.prototype.eagerInitializeNoda = function(persistedNoda){
	var circuitConstructor = window[persistedNoda.handle];
	if(!circuitConstructor){
		console.error("Could not find Constructor for "+persistedNoda.handle);
		return;
	}
	
	var self = this;
	var replacementCallback = function(oldCircuit, newHandle){
		 self.replaceCircuit(oldCircuit, newHandle);
	};
	var interactiveNoda = new circuitConstructor(this.ctx, persistedNoda, replacementCallback);
	
	this.nodas[persistedNoda.ordinal] = interactiveNoda;
	
	var keyRowPosition = 0;
	var keyPosition = 0;
	var swytchePosition = 0;
	for( idx in this.keyset ){
		keyRowPosition = idx;
		var keysetRow = this.keyset[idx];
		keyPosition = keysetRow.indexOf(persistedNoda.ordinal);
		if( keyPosition != -1 ){
			swytchePosition += keyPosition;
			break;
		} else {
			swytchePosition += keysetRow.length;
		}
	}	
	this.keyContainer.children().eq(keyRowPosition).children().eq(keyPosition).replaceWith(interactiveNoda.noda);
	this.swytcheContainer.children().eq(swytchePosition).replaceWith(interactiveNoda.swytche);
	this.tracksContainer.children().eq(swytchePosition).replaceWith(interactiveNoda.trackline);
	
	var self = this;
	interactiveNoda.noda.
			mousedown(function(ev){ 
				self.noteOn(interactiveNoda);
				interactiveNoda.mousedown = true; 
				ev.stopPropagation(); }).
			mouseup(function(ev){ 
				self.noteOff(interactiveNoda); 
				interactiveNoda.mousedown = false;}).
			click(function(ev){ ev.stopPropagation(); });
			
	interactiveNoda.swytche.
			click(function(ev){
				self.nodas.forEach(function(noda){noda.lightOff('selected');});
				interactiveNoda.lightOn('selected');
				interactiveNoda.generateDrawer();
				ev.stopPropagation();
	});
	
	return interactiveNoda;
};

NodeaStudio.prototype.loadCircuit = function(persistedNoda, callback){
	var handle = persistedNoda.handle;
	var loadingCircuit = this.loadingCircuits[handle];
	if( loadingCircuit ){
		loadingCircuit.callbacks.push(callback);
	} else {
		var circuitJavascript = document.createElement('script');
		circuitJavascript.setAttribute("type","text/javascript");
		circuitJavascript.setAttribute("src","/nodea/circuits/"+handle+"/"+handle+".js");
		document.head.appendChild(circuitJavascript);
		
		this.circuitStylesheet.innerHTML += ".node."+handle+
				"{ background-image: url('circuits/"+handle+"/"+handle+".png'); background-size: cover; }";
		
		loadingCircuit = {js: circuitJavascript, callbacks: [callback]};
		this.loadingCircuits[handle] = loadingCircuit;
		
		var self = this;
		circuitJavascript.onload = function(){
			self.loadedCircuits.push(handle);
			loadingCircuit.callbacks.forEach(function(callback){ 
				callback.call(self); 
			});
		};
	}
};



// Timing

NodeaStudio.prototype.pixels_per_beat = 24; // subject to change

NodeaStudio.prototype.resetPixelTiming = function(){
	this.pixels_per_bar = this.pixels_per_beat * this.beats_per_bar;
	this.pixels_per_second = (this.beats_per_minute/60) * this.pixels_per_beat;
	this.maxLocation = this.pixels_per_bar * this.bar_count;
};


// Recording

NodeaStudio.prototype.toggleRecording = function(){
	if( this.recording ) {
		this.recordingNodas.forEach(function(noda){ this.noteOff(noda);}, this);
	}
	this.recording = !this.recording;
	$('#mode_controls #record').toggleClass("active");
};

NodeaStudio.prototype.toggleLooping = function(){
	if( this.looping ){
		$("#loopToggle").removeClass("active");
		$(".loop").hide();
	} else {
		$("#loopToggle").addClass("active");
		$(".loop").show();
	}
	this.looping = !this.looping;
};


NodeaStudio.prototype.snap = function(){
	var snapMiddle = this.snapResolution/2;
	Note.selecteds.forEach(function(note){
		var snapRemainder = note.start % this.snapResolution;
		if( snapRemainder !== 0 ){
			if( snapRemainder > snapMiddle ){
				note.move(note.start - snapRemainder + this.snapResolution);
			} else {
				note.move(note.start - snapRemainder);
			}
		}
	}, this);
	this.invalidateSavedStatus();
};





NodeaStudio.prototype.noteOn = function( noda ){
	if( noda.keydown || noda.mousedown ){
		return;
	}
	
	if( this.recording ){
		noda.on(this.pixelFor(Date.now()));
		this.recordingNodas.push(noda);
	} else {
		noda.on();
	}
};


NodeaStudio.prototype.noteOff = function( noda ){
	if( this.recording ){
		noda.off(this.location);
		this.invalidateSavedStatus();
		this.recordingNodas.splice(this.recordingNodas.indexOf(noda), 1);
	} else {
		noda.off();
	}
};









// Playback

NodeaStudio.prototype.play = function(){
	if( this.startTime === null ){
		this.ctx.startTime = this.ctx.currentTime;
		
	    $('#playpause').addClass("active");
	    this.resetPixelTiming();
		this.metronome.start();
	    this.startTime = Date.now() - (this.location / (this.pixels_per_second/1000));
		this.lastLocation = this.location;
		
		this.nodas.forEach(function(noda){
			noda.lightOff('active');
			noda.play( this.pixels_per_second, this.location );
		}, this);
		
	    requestAnimationFrame(this.frame.bind(this));
	}
};

NodeaStudio.prototype.pause = function(){
	if( this.startTime !== null){
		this.ctx.startTime = null;
		
	    $('#playpause').removeClass("active");
		this.metronome.stop();
	    this.nodas.forEach(function(noda){ 
			noda.pause(); 
			if( this.recordingNodas.indexOf(noda) !== -1){
				this.noteOff(noda);
			}
		}, this);
		this.startTime = null;
	    this.startFrameTimestamp = null;
	}
};

NodeaStudio.prototype.playpause = function(){
	this.startTime ? this.pause() : this.play(); 
};


NodeaStudio.prototype.pixelFor = function(epoch){
	var pixel = 0;
	if( this.startTime === null ){
	    pixel = this.location;
	} else {
	    pixel = this.pixelForProgress(epoch - this.startTime);
	}
	
	var snapRemainder = pixel % this.snapResolution;
	if( snapRemainder === 0){
		return pixel;
	} else {
		return pixel - snapRemainder + this.snapResolution;
	} 
};

NodeaStudio.prototype.pixelForProgress = function(progress){
	return Math.ceil( (this.pixels_per_second/1000) * progress );
};





NodeaStudio.prototype.setLocation = function(location){
	this.location = location;
	$(this.ideasContainer).css('bottom', -location+'px');
};

NodeaStudio.prototype.setBarSize = function(howmany, duringStartup){
	try{
		howmany = parseInt(howmany);
		if( howmany === this.beats_per_bar ){
			return;
		}
		
		var self = this;
		var difference = howmany - this.beats_per_bar;
		this.barsContainer.find(".bar").each(function(){
			var bar = $(this).css('height', (self.pixels_per_beat*howmany)-1);
			if( difference > 0 ){
				for( var j = difference; j>0 ; j-- ){
					$('<div/>', {class: 'beat', style: 'height: '+(self.pixels_per_beat-1)+'px;'}).appendTo(bar);
				}
			} else {
				bar.find('.beat').splice(0, -difference).forEach(function(el){ el.remove(); });
			}
		});
		
		this.beats_per_bar = howmany;
		this.barSizeBox.val(howmany);
		if(!duringStartup){
			this.invalidateSavedStatus();
		}
		this.resetPixelTiming();
	} catch (ex) {
		this.notify("Invalid Value for Bar Size. Please Enter a Number.", ex.getMessage());
	}
};

NodeaStudio.prototype.setBarCount = function(howmany, duringStartup){
	try{
		howmany = parseInt(howmany);
		if( howmany === this.bar_count ){
			return;
		}
		var difference = howmany - this.bar_count;
		this.maxLocation += difference*this.pixels_per_bar;
		this.ideasContainer.css("height", this.maxLocation+'px');

		if( howmany > this.bar_count ){
			for( var i = difference; i > 0; i--){
				var bar = $('<div/>', {class: 'bar', style: 'height: '+(this.pixels_per_bar-1)+'px;'}).appendTo(this.barsContainer);
				for( var j = this.beats_per_bar; j>0 ; j-- ){
					$('<div/>', {class: 'beat', style: 'height: '+(this.pixels_per_beat-1)+'px;'}).appendTo(bar);
				}
			}
		} else{
			this.barsContainer.find('.bar').splice(0, -difference).forEach(function(el){ el.remove(); });
		}
		this.bar_count = howmany;
		this.barCountBox.val(howmany);
		if(!duringStartup){
			this.invalidateSavedStatus();
		}
	} catch( ex ) {
		this.notify('Invalid Value for Count. Please Enter a Number', ex.message);
	}
	// remove notifications once notifications system is built
};

NodeaStudio.prototype.setBPM = function(value){
	try{
		this.beats_per_minute = parseInt(value);
		this.metronome.setBPM(this.beats_per_minute);
		this.resetPixelTiming();
		this.invalidateSavedStatus();
	} catch( ex ){
		this.notify('Invalid Value for BPM. Please Enter a Number', ex.message);
	}
};

NodeaStudio.prototype.setName = function(value){
	this.project_name = value;
	this.invalidateSavedStatus();
};

NodeaStudio.prototype.setDescription = function(value){
	this.project_description = value;
	this.invalidateSavedStatus();
};




NodeaStudio.prototype.frame = function( timestamp ){
	if( this.startTime === null ){
	    return this.pause();
	}
	
	if( this.location >= this.maxLocation ){
	    if( this.recording ){
	        this.setBarCount(this.bar_count + 4);
	    } else {
	        return this.pause();
	    }
	} 
	   
	if( this.startFrameTimestamp === null ){
	    this.startFrameTimestamp = timestamp - (this.location / (this.pixels_per_second/1000));
	}
	  
	var newLocation = this.pixelForProgress(timestamp-this.startFrameTimestamp);
	
	this.setLocation(newLocation);
	
	// handle lighting
	this.nodas.forEach( function(noda){
		noda.notes.forEach( function(note){
			if( note.start <= newLocation && note.start >= this.lastLocation ){
				noda.lightOn('active');
			} else if( note.finish <= newLocation && note.finish > this.lastLocation ){
				noda.lightOff('active');
			}
		}, this);
	}, this);

	this.recordingNodas.forEach( function(noda){
		noda.frame(newLocation);
	});

	this.lastLocation = newLocation;
	
	requestAnimationFrame(this.frame.bind(this));
};




// Navigation

NodeaStudio.prototype.head = function(){
	this.pause();
	this.setLocation(0);
};
NodeaStudio.prototype.tail = function(){
	this.pause();
	this.setLocation(this.maxLocation);
};


NodeaStudio.prototype.advance = function(howmuch){
	this.pause();
	var newLocation = this.location+howmuch;
	if( newLocation > this.maxLocation ){
	    newLocation = this.maxLocation;
	} else if( newLocation < 0){
	    newLocation = 0;
	} 
	if( newLocation !== this.location ){
	    this.setLocation(newLocation);
	}
};

NodeaStudio.prototype.incrementAdvanceBox = function(larger){
	var oldSelection = this.advanceBox.find("option:selected");
	var newSelection = (larger) ? oldSelection.prev("option") : oldSelection.next("option");
	if( newSelection.val() !== undefined ){
	    oldSelection.removeAttr("selected");
	    newSelection.attr("selected","selected");
	    this.advanceBox.trigger("change");
	}
};


NodeaStudio.prototype.startSelectBox = function(x, y){
	var noteSelectBox = $("<div></div>",{class: 'noteSelectBox'}).appendTo(this.ideasContainer);
	var ideasOffset = this.ideasContainer.offset();
	var ideasHeight = this.ideasContainer.height();
	
	var maxLeftWidth = x - ideasOffset.left;
	var maxRightWidth = this.ideasContainer.width() - (x - ideasOffset.left);
	var maxDownHeight = this.ideasContainer.height() - (y - ideasOffset.top);
	var self = this;

	$(document.body).mousemove(function(ev_move){		
		var newTop =  Math.min(y, ev_move.pageY) - ideasOffset.top;
		var newHeight = ev_move.pageY < y ? 
				y - ev_move.pageY : // TODO: calculate bound
				Math.min(maxDownHeight, ev_move.pageY - y);
		var newLeft = Math.max(0, Math.min(x, ev_move.pageX) - ideasOffset.left);
		var newWidth = ev_move.pageX < x ?
				Math.min(maxLeftWidth, x - ev_move.pageX) :
				Math.min(maxRightWidth, ev_move.pageX - x); 
		
		noteSelectBox.
				css("top",newTop+"px").
				css("height",newHeight-2+"px").
				css("left",newLeft+"px").
				css("width",newWidth-2+"px");
		
		var firstTrackIndex = Math.ceil(newLeft / NodeaStudio.TRACK_WIDTH);
		var lastTrackIndex = Math.floor((newLeft + newWidth) / NodeaStudio.TRACK_WIDTH);
		var noteFinishBound = ideasHeight - newTop;
		var noteStartBound = noteFinishBound - newHeight;
		
		self.flatKeyset.forEach(function(ascii, idx){
			if(idx < firstTrackIndex || idx > lastTrackIndex){ 
				self.nodas[ascii].notes.forEach(function(note){
					note.unselect();
				}, self);
			} else {
				self.nodas[ascii].notes.forEach(function(note){
					if(note.start >= noteStartBound && note.finish <= noteFinishBound){
						note.select();
					} else {
						note.unselect();
					}
				}, self);
			}
		}, self);
	}).mouseup(function(ev_up){
		noteSelectBox.remove();
		$(document.body).unbind("mousemove").unbind("mouseup");
	});
};




// saving project

NodeaStudio.prototype.pushUndoRedo = function(undo, redo){
	this.undoList.push(undo, redo);
	this.invalidateSavedStatus();
};

NodeaStudio.prototype.invalidateSavedStatus = function(){
	this.saved = false;
	$('#save').addClass('warning');
};


NodeaStudio.prototype.marshal = function(){
	return {
		project_id: this.project_id,
		name: this.project_name,
		description: this.project_description,
		beats_per_minute: this.beats_per_minute,
		beats_per_bar: this.beats_per_bar,
		keyset: this.keysetName,
		bar_count: this.bar_count,
		looping: this.looping,
		loop_start: this.loop_start,
		loop_end: this.loop_end,
		nodas: this.nodas.
			map(function(noda){ return noda.marshal(); }).
			filter(function(noda){ return noda.handle !== 'Circuit'; })
	};
};


NodeaStudio.prototype.save = function(){
	if( !this.saved ){
		try{
			$('#save').removeClass('warning').addClass('active');
			localStorage.defaultProject = JSON.stringify(this.marshal());
			$('#save').removeClass('active').addClass('kosher');
			setTimeout(function(){ $('#save').removeClass('kosher'); }, 3000 );
		} catch (ex) {
			$('#save').removeClass('active').addClass('warning');
			self.notify("Save Failed. Please let me know about this.", msg);
		}
	}
};


NodeaStudio.prototype.publish = function(){
	if( !this.saved ){
		this.notify("Please Save your Work Before Publishing");
	}
	
	var self = this;
	$.ajax({
		type: "POST",
		url: "/studio/publish",
		data: JSON.stringify(this.marshal()),
		contentType: 'application/json; charset=utf-8',
		success: function(){
			self.notify("Publish Successful");
		},
		error: function(jqxhr, msg, ex){
			$('#save').removeClass('active').addClass('warning');
			self.notify("Save Failed. Please Try Again.", msg);
		}
	});
};

NodeaStudio.prototype.notify = function(words, errorMessage){
	if(errorMessage !== undefined){
		console.error(errorMessage);
	}
	alert(words);
};


NodeaStudio.prototype.deleteNote = function(note){
	if(note.noda){
		note.removeContainer();
		note.noda.deleteNote(note);
		this.invalidateSavedStatus();
	}
};


NodeaStudio.prototype.replaceCircuit = function( oldCircuit, newHandle ){
	var persistedNoda = oldCircuit.persistedNoda;
	persistedNoda.handle = newHandle;
	
	var self = this;
	this.initializeNoda( persistedNoda, function(newCircuit){
		self.nodas[oldCircuit.ordinal] = newCircuit;
		newCircuit.swytche.click();
		self.invalidateSavedStatus();
	});
};






NodeaStudio.TRACK_WIDTH = 19; //px


NodeaStudio.prototype.asciiKeys = [
	'1','2','3','4','5','6','7','8','9','0',
	'q','w','e','r','t','y','u','i','o','p',
	'a','s','d','f','g','h','j','k','l',';',
	'z','x','c','v','b','n','m',',','.','/'
];


NodeaStudio.prototype.keyCodeToAsciiMap = {
	// numbers  
	48:  48,	49:  49,	50:  50,	51:  51,	52:  52,	
	53:  53,	54:  54,	55:  55,	56:  56,	57:  57,	
	
	 // uppercase latin
	65:  97,	66:  98,	67:  99,	68:  100,	69:  101,	
	70:  102,	71:  103,	72:  104,	73:  105,	74:  106,	
	75:  107,	76:  108,	77:  109,	78:  110,	79:  111,	
	80:  112,	81:  113,	82:  114,	83:  115,	84:  116,	
	85:  117,	86:  118,	87:  119,	88:  120,	89:  121,	
	90:  122,	
	
	// punctuation
	186: 59,	188: 44,	190: 46,	191: 47
};

NodeaStudio.prototype.keySets = {
	desktop: [
		// top numbers
		[49,  50,  51,  52,  53],
		[54,  55,  56,  57,  48],

		// left letters
		[113, 119, 101, 114, 116, 
		 97,  115, 100, 102, 103, 
		 122, 120, 99,  118, 98],

		// right letters
		[121, 117, 105, 111, 112, 
		 104, 106, 107, 108, 59,  
		 110, 109, 44,  46,  47]
	]
};


NodeaStudio.prototype.eventControlMap = {
	//spacebar
	32: function(studio){ studio.playpause(); },
	
	// home, page, end
	33: function(studio){ studio.advance(-studio.advanceAmount * studio.beats_per_bar); },
	34: function(studio){ studio.advance(studio.advanceAmount * studio.beats_per_bar); },
	35: function(studio){ studio.head(); },
	36: function(studio){ studio.tail(); },
	
	// arrow keys
	// TODO: Find another use for these
	37: function(studio){ studio.incrementAdvanceBox(false); },
	38: function(studio){ studio.advance(studio.advanceAmount); },
	39: function(studio){ studio.incrementAdvanceBox(true); },
	40: function(studio){ studio.advance(-studio.advanceAmount); },
	
	// delete key
	46: function(studio){ Note.selecteds.forEach(function(note){studio.deleteNote(note);}); },
	
	// backspace key
	8: function(studio){ Note.selecteds.forEach(function(note){studio.deleteNote(note);}); }
	
};


NodeaStudio.prototype.ctrlKeyControlMap = {

	// ctrl-s
	83:	function(studio){ studio.save(); },
		
	// ctrl-z
	90:	function(studio){ studio.undoList.undo(); },
	// ctrl-y
	89: function(studio){ studio.undoList.redo(); },
	
	// ctrl-x
	88: function(studio){ /*cut*/ },
	// ctrl-c
	67: function(studio){ /*copy*/ },
	// ctrl-v
	86: function(studio){ /*paste*/ }
};