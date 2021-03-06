function NodeaStudio(editorContainer, project) {
	// Singleton!
	NodeaStudio.instance = this;
	
	// Convenience Variable for setting event handling.
	var self = this;
	
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
	this.instrumentationContainer = $(editorContainer).find("#instrumentation").on("click",function(ev){ 
		self.nodas.forEach(function(noda){ 
			noda.lightOff('selected'); 
		});
	});

	var ideasWindow = $(editorContainer).find("#idea_window");
	ideasWindow.
		on('mousewheel', function(ev){ 
			self.advance((ev.originalEvent.wheelDelta > 0) ? self.advanceAmount : -self.advanceAmount); 
		}).on("mousedown",function(ev){
			// unless propagation stopped by notes
			Note.unselectAll();
			self.startSelectBox(ev.pageX, ev.pageY);
		});
		
	this.ideasContainer = $(editorContainer).find("#ideas");	
		
	this.barsContainer = $('<div id="barlines"></div>').appendTo(this.ideasContainer);
	// === Loopin Bars ===
	$('<div/>', {class:'loop', id:'loopStart'}).css("bottom",this.loop_start+"px").appendTo(this.barsContainer);
	$('<div/>', {class:'loop', id:'loopEnd'}).css("bottom",this.loop_end+"px").appendTo(this.barsContainer);
	
	
	
	// === Setup Swytches & Tracks ===
	this.nodas = [];
	this.keyset = this.keySets[this.keysetName];
	
	this.tracksContainer = $('<div id="tracks"></div>').appendTo(this.ideasContainer);
	this.swytchesContainer = $("#swytches");	
	this.tracks = {};
	this.swytches = {};
	this.keyset.chromaticOrder.forEach(function(ordinal){
		this.swytches[ordinal] = $('<spiv/>',{class: 'trackSwitch', html: String.fromCharCode(ordinal)}).
				appendTo(this.swytchesContainer).on("click",function(ev){
					self.selectedMachine.swytcheSelected(ordinal);
					ev.stopPropagation();
				});
		this.tracks[ordinal] = $('<spiv/>',{id: 'track_'+ordinal, class:'circuitTrack'}).
				appendTo(this.tracksContainer);
	}, this);
	// numeric tracks
	$('<spiv/>',{id: 'swytche_prenumeric', class: 'trackSwitch numeric', html: '&nbsp;'}).prependTo(this.swytchesContainer);
	$('<spiv/>',{id: 'swytch_postnumeric', class: 'trackSwitch numeric', html: '&nbsp;'}).appendTo(this.swytchesContainer);
	$('<spiv/>',{id: 'track_prenumeric', class:'circuitTrack numeric'}).prependTo(this.tracksContainer);
	$('<spiv/>',{id: 'track_postnumeric', class:'circuitTrack numeric'}).appendTo(this.tracksContainer);
	
	
	
	// === Instantiate Machines ===
	this.machineContainer = $(this.instrumentationContainer).find("#machines");
	
	var sinistraRow = $('<div/>',{class: 'circuitRow sinistra'}).appendTo(this.machineContainer);
	var dextraRow = $('<div/>',{class: 'circuitRow dextra'}).appendTo(this.machineContainer);
	
	for( var i=0; i<10; i++){
		$("<div class='placeholder machine'></div>").appendTo(i<5 ? sinistraRow : dextraRow);
	}
	this.circuitsContainer = $(this.instrumentationContainer).find("#circuits");
	this.machines = {};
	for( ascii in NodeaStudio.MACHINE_SET ) {
		var tabDefinition = NodeaStudio.MACHINE_SET[ascii];
		var marshaledMachine;
		if( project.machines && tabDefinition.ascii in project.machines ){
			marshaledMachine = project.machines[tabDefinition.ascii];
		} else {
			marshaledMachine = {handle: "Machine"}; //new Machine(this.ctx, tabDefinition, this, {});
		}
		this.initializeMachine(tabDefinition, marshaledMachine, function(machine){
			var tabIndex = NodeaStudio.MACHINE_SET[machine.ascii].order;
			var placeholder = self.machineContainer.find(".machine").get(tabIndex);
			$(placeholder).replaceWith(machine.tab);
			machine.circuitsContainer.appendTo(self.circuitsContainer);
			if(machine.ascii === NodeaStudio.defaultMachineCode){
				self.selectMachine(NodeaStudio.defaultMachineCode);
			}
		});
	}
	
	
	
	
	// === Event Handling ===
	$("body").on("keydown",function(ev) {
		var key = ev.keyCode;
		if( ev.ctrlKey && key in self.ctrlKeyControlMap){ // ctrl keys
			self.ctrlKeyControlMap[key](self);
			ev.preventDefault();
		} else if( key in self.keyCodeToAsciiMap ){ // circuit
			//if( ev.shiftKey ){
			//	self.selectedMachine.swytcheSelected(self.keyCodeToAsciiMap[key]);
			//} else {
				self.selectedMachine.circuitOnAscii(self.keyCodeToAsciiMap[key]);		
			//}
			ev.preventDefault();
	    } else if ( key >= 48 && key <= 57 ){ // machine
			self.selectMachine(key);
		} else if( key in self.eventControlMap ){ // event keys
	        self.eventControlMap[key](self);
			ev.preventDefault();
	    } else {
			console.log(key);
	        return;
	    }
	}).on("keyup",function(ev) {
		var key = ev.keyCode;
	    if( key in self.keyCodeToAsciiMap ){
			self.selectedMachine.circuitOffAscii(self.keyCodeToAsciiMap[key]);
			ev.preventDefault();
	    } else if( key in self.eventControlMap ){
	        // do nothing
			ev.preventDefault();
	    } else {
	        return;
		}
	}).on("mouseup",function(ev){
		self.selectedMachine.mouseup();
	});
	
	

	// Middle Controls
	// TODO: Should these be initialized in js?
	this.advanceBox = $("#advance_box");
	this.advanceAmount = this.pixels_per_beat;
	this.advanceBox.change(	function(){ 
		var parts = this.value.split("_");
		var counter = parseInt(parts[0]);
		switch(parts[1]){
			case "bar": 
				self.advanceAmount = counter * self.pixels_per_bar; break;
			case "beat":
				self.advanceAmount = counter * self.pixels_per_beat; break;
			case "pixel":
				self.advanceAmount = counter; break;
		}
	});
			
	this.snapBox = $("#snap_resolution_box");
	this.snapResolution = parseInt(this.snapBox.val());
	this.snapBox.on("change", function(){
		self.snapResolution = parseInt(this.value);
	});
			
	
	this.bpmBox = $("#bpm");
	this.bpmBox.
	    on("change", function(){ self.setBPM(this.value); } ).
	    on("keydown",    function(ev){ ev.stopPropagation(); }).
	    on("keyup",      function(ev){ ev.stopPropagation(); });
	this.barSizeBox = $("#bar_size");
	this.barSizeBox.
		change(		function(){ self.setBarSize(this.value); }).
	    on("keydown",    function(ev){ ev.stopPropagation(); }).
	    on("keyup",      function(ev){ ev.stopPropagation(); });
	this.barCountBox = $("#bar_count");
	this.barCountBox.
		change(	function(){ 
			self.setBarCount(this.value);
			$(this).val(self.bar_count);
		}).
	    on("keydown",    function(ev){ ev.stopPropagation(); }).
	    on("keyup",      function(ev){ ev.stopPropagation(); });
	$('#name').
		change(		function(){ self.setName(this.value); }).
	    on("keydown",    function(ev){ ev.stopPropagation(); }).
	    on("keyup",      function(ev){ ev.stopPropagation(); });
	$('#description').
		change(		function(){ self.setDescription(this.value); }).
	    on("keydown",    function(ev){ ev.stopPropagation(); }).
	    on("keyup",      function(ev){ ev.stopPropagation(); });


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



NodeaStudio.prototype.initializeMachine = function( tabDefinition, marshaledMachine, callback){
	var self = this;
	if(marshaledMachine.handle === 'Function'){
		marshaledMachine.handle = "Machine";
	} else if(marshaledMachine.handle === ''){
		marshaledMachine.handle = 'Machine';
	}

	machineConstructor = window[marshaledMachine.handle];
	var machine = new machineConstructor(self.ctx, tabDefinition,  marshaledMachine, function(oldMachine, newHandle){
		 self.replaceMachine(oldMachine, newHandle);
	});
	self.machines[tabDefinition.ascii] = machine;
	if(callback){
		callback.call(this, machine);
	}

};





// External Startup Functions

NodeaStudio.prototype.replaceMachine = function( oldMachine, newHandle ){
	var marshaledMachine = oldMachine.marshal();
	var tabDefinition = NodeaStudio.MACHINE_SET[oldMachine.ascii];
	marshaledMachine.handle = newHandle;
	
	var self = this;
	this.initializeMachine( tabDefinition, marshaledMachine, function(machine){
		oldMachine.tab.replaceWith(machine.tab);
		oldMachine.circuitsContainer.replaceWith(machine.circuitsContainer);
		if( self.selectedMachine === oldMachine ){
			self.selectMachine(machine.ascii);
			//machine.swytcheSelected(NodeaStudio.defaultCircuitCode); //TODO: Race Condition. Resolve.
		}
		NodeaStudio.invalidateSavedStatus();
	});
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
		this.recordingNodas.forEach(function(circuit){ 
			this.selectedMachine.circuitOff(circuit);
			// TODO: Performance
			//this.noteOff(noda);
		}, this);
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
	NodeaStudio.invalidateSavedStatus();
};




NodeaStudio.prototype.selectMachine = function(idx){
	this.selectedMachine = this.machines[idx];
	this.selectedMachine.select();
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
		
		for( mkey in this.machines ){
			var machine = this.machines[mkey];
			for( ckey in machine.circuits ){
				var circuit = machine.circuits[ckey];
				circuit.lightOff('active');
				circuit.play( this.pixels_per_second, this.location );
			}
		}
		
	    requestAnimationFrame(this.frame.bind(this));
	}
};

NodeaStudio.prototype.pause = function(){
	if( this.startTime !== null){
		this.ctx.startTime = null;
		
	    $('#playpause').removeClass("active");
		this.metronome.stop();
		
		/*
		this.recordingNodas.forEach(function(circuit){
			circuit.off(this.location);
		}, this);
		*/
		
		for( mkey in this.machines ){
			this.machines[mkey].pause();
		}
		
	   
	   
	   
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
				bar.find('.beat').get().reverse().splice(0, -difference).forEach(function(el){ el.remove(); });
			}
		});
		
		this.beats_per_bar = howmany;
		this.barSizeBox.val(howmany);
		if(!duringStartup){
			NodeaStudio.invalidateSavedStatus();
		}
		this.resetPixelTiming();
	} catch (ex) {
		this.notify("Invalid Value for Bar Size. Please Enter a Number.", ex.message);
	}
};

NodeaStudio.prototype.setBarCount = function(howmany, duringStartup){
	try{
		howmany = parseInt(howmany);
		if( howmany === this.bar_count ){
			return;
		}
		var newMaximum = howmany*this.pixels_per_bar;
		if(newMaximum < Note.maximum){
			howmany = Math.ceil(Note.maximum / this.pixels_per_bar);
			newMaximum = howmany*this.pixels_per_bar;
		}
		
		var difference = howmany - this.bar_count;
		this.maxLocation = newMaximum;
		this.ideasContainer.css("height", this.maxLocation+'px');

		if( howmany > this.bar_count ){
			this.barsContainer.find(".bar.final").removeClass("final");
			for( var i = difference; i > 0; i--){
				var bar = $('<div/>', {class: "bar"+(i===1 ? " final":""), style: 'height: '+(this.pixels_per_bar-1)+'px;'}).prependTo(this.barsContainer);
				for( var j = this.beats_per_bar; j>0 ; j-- ){
					var beat = $('<div/>', {class: 'beat', style: 'height: '+(this.pixels_per_beat-1)+'px;'}).appendTo(bar);
					if( j === this.beats_per_bar ){
						var barNumber = this.bar_count + (difference-i) + 1;
						$("<spiv/>",{"class":"sinistra numeric", "html": barNumber}).appendTo(beat);
						$("<spiv/>",{"class":"dextra numeric", "html": barNumber}).appendTo(beat);
					}
				}
			}
		} else{
			this.barsContainer.find(".bar").splice(0, -difference).forEach(function(el){ el.remove(); });
			this.barsContainer.find(".bar").first().addClass("final");
		}
		this.bar_count = howmany;
		this.barCountBox.val(howmany);
		if(!duringStartup){
			NodeaStudio.invalidateSavedStatus();
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
		NodeaStudio.invalidateSavedStatus();
	} catch( ex ){
		this.notify('Invalid Value for BPM. Please Enter a Number', ex.message);
	}
};

NodeaStudio.prototype.setName = function(value){
	this.project_name = value;
	NodeaStudio.invalidateSavedStatus();
};

NodeaStudio.prototype.setDescription = function(value){
	this.project_description = value;
	NodeaStudio.invalidateSavedStatus();
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
		
		self.keyset.chromaticOrder.forEach(function(ascii, idx){
			if(idx < firstTrackIndex || idx > lastTrackIndex){ 
				self.selectedMachine.circuits[ascii].notes.forEach(function(note){
					note.unselect();
				}, self);
			} else {
				self.selectedMachine.circuits[ascii].notes.forEach(function(note){
					if(note.start >= noteStartBound && note.finish <= noteFinishBound){
						note.select();
					} else {
						note.unselect();
					}
				}, self);
			}
		}, self);
	}).on("mouseup",function(ev_up){
		noteSelectBox.remove();
		$(document.body).off("mousemove").off("mouseup");
	});
};




// saving project

NodeaStudio.prototype.pushUndoRedo = function(undo, redo){
	this.undoList.push(undo, redo);
	NodeaStudio.invalidateSavedStatus();
};

NodeaStudio.invalidateSavedStatus = function(){
	NodeaStudio.instance.saved = false;
	$('#save').addClass('warning');
};


NodeaStudio.prototype.marshal = function(){
	var ret = {
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
	
	ret.machines = {};
	for( idx in this.machines ){
		var machine = this.machines[idx];
		if(machine){
			ret.machines[idx] = machine.marshal();
		}
	}
	
	return ret;
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
			console.error(ex.stack);
			alert("Save Failed. Please let me know about this.", ex);
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
	if(note.circuit){
		note.removeContainer();
		note.circuit.deleteNote(note);
		NodeaStudio.invalidateSavedStatus();
	}
};











NodeaStudio.TRACK_WIDTH = 20; //px


NodeaStudio.prototype.asciiKeys = [
	'1','2','3','4','5','6','7','8','9','0',
	'q','w','e','r','t','y','u','i','o','p',
	'a','s','d','f','g','h','j','k','l',';',
	'z','x','c','v','b','n','m',',','.','/'
];


NodeaStudio.prototype.keyCodeToAsciiMap = {	
	 // uppercase latin
	65:  97,	66:  98,	67:  99,	68:  100,	69:  101,	
	70:  102,	71:  103,	72:  104,	73:  105,	74:  106,	
	75:  107,	76:  108,	77:  109,	78:  110,	79:  111,	
	80:  112,	81:  113,	82:  114,	83:  115,	84:  116,	
	85:  117,	86:  118,	87:  119,	88:  120,	89:  121,	
	90:  122,	
	
	// punctuation
	186: 59,	59: 59,		188: 44,	190: 46,	191: 47
};

NodeaStudio.MACHINE_SET = {
	49: {ascii: 49, color: "#98C", order: 0},
	50: {ascii: 50, color: "#89C", order: 1},
	51: {ascii: 51, color: "#8BB", order: 2},
	52: {ascii: 52, color: "#7B9", order: 3},
	53: {ascii: 53, color: "#9B7", order: 4},

	54: {ascii: 54, color: "#BC7", order: 5},
	55: {ascii: 55, color: "#CB6", order: 6},
	56: {ascii: 56, color: "#C96", order: 7},
	57: {ascii: 57, color: "#C87", order: 8},
	48: {ascii: 48, color: "#C78", order: 9}
};


NodeaStudio.prototype.keySets = {
	desktop: {
		domOrder: [
			// left letters
			113, 119, 101, 114, 116, 97,  115, 100, 102, 103, 122, 120, 99,  118, 98,
			// right letters
			121, 117, 105, 111, 112, 104, 106, 107, 108, 59, 110, 109, 44,  46,  47
		],
		chromaticOrder: [
			122, 120, 99,  118, 98,	 110, 109, 44,  46,  47, // bottom row
			97,  115, 100, 102, 103, 104, 106, 107, 108, 59, // mid row
			113, 119, 101, 114, 116, 121, 117, 105, 111, 112 // top row
		]
	}
};


NodeaStudio.defaultMachineCode = 49;
NodeaStudio.defaultCircuitCode = 113;


NodeaStudio.prototype.eventControlMap = {
	//spacebar
	32: function(studio){ studio.playpause(); },
	
	// home, page, end
	33: function(studio){ studio.advance(studio.advanceAmount * studio.beats_per_bar); },
	34: function(studio){ studio.advance(-studio.advanceAmount * studio.beats_per_bar); },
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
	// ctrl-r
	82: function(studio){ studio.toggleRecording(); },
	
	// ctrl-m
	77: function(studio){ studio.metronome.toggleArmament(); },
	// ctrl-a
	65: function(studio){ studio.snap(); },
	
	// ctrl-z
	90:	function(studio){ studio.undoList.undo(); },
	// ctrl-y
	89: function(studio){ studio.undoList.redo(); },
	
	// ctrl-x
	88: function(studio){ Note.cutSelected(); },
	// ctrl-c
	67: function(studio){ Note.copySelected(); },
	// ctrl-v
	86: function(studio){ Note.pasteClipboard(studio.location); }
};
