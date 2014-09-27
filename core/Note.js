var Note = function(options){
	this.start = options.start;
	if( options.finish ){ this.finish = options.finish; }
	if( options.circuit ){ this.circuit = options.circuit; } 
};

Note.EXPANDER_HEIGHT = 4;


Note.selecteds = [];

Note.unselectAll = function(){
	if( Note.selecteds.length > 0 ){
		Note.selecteds = [];
		$(".noteCapsule.selected").removeClass("selected"); 
	}
};


Note.prototype.select = function(){
	if( Note.selecteds.indexOf(this) === -1 ){
		Note.selecteds.push(this);
		this.container.addClass("selected");
	}
};

Note.prototype.unselect = function(){
	var selectedIdx = Note.selecteds.indexOf(this);
	if( selectedIdx !== -1 ){
		Note.selecteds.splice(selectedIdx, 1);
		this.container.removeClass("selected");
	}
};


Note.prototype.createContainer = function(){
	var clazz = '';
	if( typeof this.finish === 'undefined' ){
		this.finish = this.start+1;
		clazz = 'recording';
	} 
	var slivers = this.finish - this.start;
	var self = this;
	
	this.container = $('<div/>',{ 
			class: 'noteCapsule ' + clazz, 
			style: 'bottom: '+(this.start-Note.EXPANDER_HEIGHT)+'px; height: '+(slivers+(Note.EXPANDER_HEIGHT*2))+'px;'
		}).on("mousedown",function(ev){
				if(!ev.ctrlKey){
					Note.unselectAll();
				}
				$(this).addClass("selected");
				Note.selecteds.push(self);
				ev.stopPropagation();
			});
			
	this.noteBox = $('<div/>',{ class: 'note', style: 'height: '+slivers+'px; background-color: '+this.circuit.machine.color}).
			on("mousedown",function(ev){
				if( self.container.hasClass("selected") ){
					Note.selecteds.forEach(function(note){
						note.mouseSetpoint = parseInt(note.container.css('bottom')) + ev.pageY;
					});
					$(document.body).mousemove(function(ev_move){
						Note.selecteds.forEach(function(note){
							note.container.css('bottom', (note.mouseSetpoint - ev_move.pageY)+'px');
						});
					}).on("mouseup",function(ev_up){
						Note.selecteds.forEach(function(note){
							note.move(note.mouseSetpoint - ev_up.pageY);
							$(document.body).off("mousemove").off("mouseup");
						});
					});
					ev.stopPropagation();
				}
			});
	
	this.northExpander = $('<div/>',{ class: 'noteExpander north'}).
			on("mousedown",function(ev){
				if( self.container.hasClass("selected") ){
					Note.selecteds.forEach(function(note){
						note.heightSetpoint = parseInt(note.container.css('height')) + ev.pageY;
					});
					$(document.body).mousemove(function(ev_move){
						Note.selecteds.forEach(function(note){
							note.container.css('height', (note.heightSetpoint - ev_move.pageY)+'px');
							note.noteBox.css('height', (note.heightSetpoint - (Note.EXPANDER_HEIGHT*2) - ev_move.pageY)+'px');
						});
					}).on("mouseup",function(ev_up){
						Note.selecteds.forEach(function(note){
							note.newFinish(note.start + note.heightSetpoint - ev_up.pageY - (Note.EXPANDER_HEIGHT*2));
							$(document.body).off("mousemove").off("mouseup");
						});
					});
					ev.stopPropagation();
				}
			});
	
	this.southExpander = $('<div/>',{ class: 'noteExpander south'}).
			on("mousedown",function(ev){
				if( self.container.hasClass("selected") ){
					Note.selecteds.forEach(function(note){
						note.mouseSetpoint = parseInt(note.container.css('bottom')) + ev.pageY;
						note.heightSetpoint = parseInt(note.container.css('height')) - ev.pageY;
					});
					$(document.body).mousemove(function(ev_move){
						Note.selecteds.forEach(function(note){
							note.container.css('bottom', (note.mouseSetpoint - ev_move.pageY)+'px');
							note.container.css('height', (note.heightSetpoint + ev_move.pageY)+'px');
							note.noteBox.css('height', (note.heightSetpoint - (Note.EXPANDER_HEIGHT*2) + ev_move.pageY)+'px');
						});
					}).on("mouseup",function(ev_up){
						Note.selecteds.forEach(function(note){
							note.newStart(note.mouseSetpoint - ev_up.pageY);
							note.container.removeClass("expandingSouth");
							$(document.body).off("mousemove").off("mouseup");	
						});
					});
					ev.stopPropagation();
				}
			});
			
	this.northExpander.appendTo(this.container);
	this.noteBox.appendTo(this.container);
	this.southExpander.appendTo(this.container);
	
	
			
	if( this.circuit ){
		this.container.prependTo(this.circuit.trackline);
	}
	
	return this.container;
};

Note.prototype.removeContainer = function(){
	this.container.remove();
};

Note.prototype.turnOffRecording = function(){
	this.circuit.turnOffPassiveRecording();
	this.container.css('height', (this.finish-this.start) + 'px');
};




// Note Mobilization


Note.prototype.moveNoUndo = function( newStart ){
	this.container.css('bottom', (newStart-Note.EXPANDER_HEIGHT)+'px');
	this.noteBox.css('bottom', newStart+'px');
	
	this.finish = this.finish + (newStart - this.start);
	this.start = newStart;
};


Note.prototype.move = function( newStart ){
	var oldStart = this.start;
	this.moveNoUndo(newStart);
	
	var self = this;
	studio.pushUndoRedo(
		function(){self.moveNoUndo(oldStart);}, 
		function(){self.moveNoUndo(newStart);}
	);
};



Note.prototype.newStartNoUndo = function( newStart ){
	var newHeight = this.finish - newStart;

	this.container.css('bottom', (newStart-Note.EXPANDER_HEIGHT)+'px');
	this.container.css('height', newHeight + (Note.EXPANDER_HEIGHT*2) +'px');
	this.noteBox.css('bottom', newStart+'px');
	this.noteBox.css('height', newHeight+'px');
	
	this.start = newStart;
};

Note.prototype.newStart = function( newStart ){
	var oldStart = this.start;
	this.newStartNoUndo(newStart);
	
	var self = this;
	studio.pushUndoRedo(
		function(){self.newStartNoUndo(oldStart);}, 
		function(){self.newStartNoUndo(newStart);}
	);
};




Note.prototype.newFinishNoUndo = function( newFinish ){
	var newHeight = newFinish - this.start;
	
	this.container.css('height', newHeight+(Note.EXPANDER_HEIGHT*2)+'px');
	this.noteBox.css('height', newHeight+'px');
	
	this.finish = newFinish;
};


Note.prototype.newFinish = function( newFinish ){
	var oldFinish = this.finish;
	this.newFinishNoUndo(newFinish);
	
	var self = this;
	studio.pushUndoRedo(
		function(){self.newFinishNoUndo(oldFinish);}, 
		function(){self.newFinishNoUndo(newFinish);}
	);
};



// Cut-Copy-Paste
Note.clipboard = [];

Note.cutSelected = function(){
	Note.clipboard = [];
	var earliestStart = null;
	Note.selecteds.forEach(function(note){
		if( earliestStart === null ){
			earliestStart = note.start;
		} else if(note.start < earliestStart ) {
			earliestStart = note.start;
		}
		note.circuit.deleteNote(note);
		Note.clipboard.push(note);
	});
	Note.clipboardStart = earliestStart;
};

Note.copySelected = function(){
	Note.clipboard = [];
	var earliestStart = null;
	Note.selecteds.forEach(function(note){
		if( earliestStart === null ){
			earliestStart = note.start;
		} else if(note.start < earliestStart ) {
			earliestStart = note.start;
		}
		Note.clipboard.push(note.clone());
	});
	Note.clipboardStart = earliestStart;
};

Note.prototype.clone = function(){
	return new Note(this);
};

Note.pasteClipboard = function(location){
	var offset = location - Note.clipboardStart;
	var newClipboard = [];
	Note.clipboard.forEach(function(note){
		newClipboard.push(note.clone());
		note.start += offset;
		note.finish += offset;
		note.circuit.addNote(note);
	}, this);
	Note.clipboard = newClipboard;
};