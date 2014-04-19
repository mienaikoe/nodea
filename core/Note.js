var Note = function(options){
	this.start = options.start;
	if( options.finish ){ this.finish = options.finish; }
	if( options.noda ){ this.noda = options.noda; } 
};

Note.EXPANDER_HEIGHT = 4;


Note.selecteds = [];

Note.unselectAll = function(){
	if( Note.selecteds.length > 0 ){
		Note.selecteds = [];
		$(".noteCapsule.selected").removeClass("selected"); 
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
	
	console.log(this.start);
	
	this.container = jQuery('<div/>',{ 
			class: 'noteCapsule ' + clazz, 
			style: 'bottom: '+(this.start-Note.EXPANDER_HEIGHT)+'px; height: '+(slivers+(Note.EXPANDER_HEIGHT*2))+'px;'
		}).mousedown(function(ev){
				if(!ev.ctrlKey){
					Note.unselectAll();
				}
				$(this).addClass("selected");
				Note.selecteds.push(self);
				ev.stopPropagation();
			});
			
	this.noteBox = jQuery('<div/>',{ class: 'note', style: 'height: '+slivers+'px;'}).
			mousedown(function(ev){
				if( self.container.hasClass("selected") ){
					Note.selecteds.forEach(function(note){
						note.mouseSetpoint = parseInt(note.container.css('bottom')) + ev.pageY;
					});
					$(document.body).mousemove(function(ev_move){
						Note.selecteds.forEach(function(note){
							note.container.css('bottom', (note.mouseSetpoint - ev_move.pageY)+'px');
						});
					}).mouseup(function(ev_up){
						Note.selecteds.forEach(function(note){
							note.move(note.mouseSetpoint - ev_up.pageY);
						});
					});
					ev.stopPropagation();
				}
			});
	
	this.northExpander = jQuery('<div/>',{ class: 'noteExpander north'}).
			mousedown(function(ev){
				if( self.container.hasClass("selected") ){
					Note.selecteds.forEach(function(note){
						note.heightSetpoint = parseInt(note.container.css('height')) + ev.pageY;
					});
					$(document.body).mousemove(function(ev_move){
						Note.selecteds.forEach(function(note){
							note.container.css('height', (note.heightSetpoint - ev_move.pageY)+'px');
							note.noteBox.css('height', (note.heightSetpoint - (Note.EXPANDER_HEIGHT*2) - ev_move.pageY)+'px');
						});
					}).mouseup(function(ev_up){
						Note.selecteds.forEach(function(note){
							note.newFinish(note.start + note.heightSetpoint - ev_up.pageY - (Note.EXPANDER_HEIGHT*2));
							$(document.body).unbind("mousemove").unbind("mouseup");
						});
					});
					ev.stopPropagation();
				}
			});
	
	this.southExpander = jQuery('<div/>',{ class: 'noteExpander south'}).
			mousedown(function(ev){
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
					}).mouseup(function(ev_up){
						Note.selecteds.forEach(function(note){
							note.newStart(note.mouseSetpoint - ev_up.pageY);
							note.container.removeClass("expandingSouth");
							$(document.body).unbind("mousemove").unbind("mouseup");	
						});
					});
					ev.stopPropagation();
				}
			});
			
	this.northExpander.appendTo(this.container);
	this.noteBox.appendTo(this.container);
	this.southExpander.appendTo(this.container);
	
	
			
	if( this.noda ){
		this.container.prependTo(this.noda.trackline);
	}
	
	return this.container;
};

Note.prototype.removeContainer = function(){
	this.container.remove();
};

Note.prototype.turnOffRecording = function(){
	this.noda.turnOffPassiveRecording();
	this.container.css('height', (this.finish-this.start) + 'px');
};

Note.prototype.move = function( newStart ){
	this.container.css('bottom', (newStart)+'px');
	$(document.body).unbind("mousemove").unbind("mouseup");
	
	this.finish = this.finish + (newStart - this.start);
	this.start = newStart;
	
	studio.invalidateSavedStatus();
};

Note.prototype.newStart = function( newStart ){
	this.container.css('bottom', (newStart)+'px');
	this.start = newStart;
	studio.invalidateSavedStatus();
};

Note.prototype.newFinish = function( newFinish ){
	var newHeight = newFinish - this.start;
	this.container.css('height', newHeight+(Note.EXPANDER_HEIGHT*2)+'px');
	this.noteBox.css('height', newHeight+'px');
	this.finish = newFinish;
	studio.invalidateSavedStatus();
};