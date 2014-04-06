var Note = function(options){
	this.start = options.start;
	if( options.finish ){ this.finish = options.finish; }
	if( options.noda ){ this.noda = options.noda; } 
};

Note.EXPANDER_HEIGHT = 4;

Note.prototype.createContainer = function(){
	var clazz = '';
	if( typeof this.finish === 'undefined' ){
		this.finish = this.start+1;
		clazz = 'recording';
	} 
	var slivers = this.finish - this.start;
	var self = this;
	
	this.container = jQuery('<div/>',{ class: 'noteCapsule ' + clazz, style: 'bottom: '+(this.start-Note.EXPANDER_HEIGHT)+'px; height: '+(slivers+(Note.EXPANDER_HEIGHT*2))+'px;'}).
			mousedown(function(ev){
				$(".noteCapsule.selected").removeClass("selected"); 
				$(this).addClass("selected");
				studio.selectedNote = self;
			});
			
	this.noteBox = jQuery('<div/>',{ class: 'note', style: 'height: '+slivers+'px;'}).
			mousedown(function(ev){
				if( self.container.hasClass("selected") ){
					self.container.addClass("dragging");
					self.mouseSetpoint = parseInt(self.container.css('bottom')) + ev.pageY;
					$(document.body).mousemove(function(ev_move){
						self.container.css('bottom', (self.mouseSetpoint - ev_move.pageY)+'px');
					}).mouseup(function(ev_up){
						self.move(self.mouseSetpoint - ev_up.pageY);
						self.container.removeClass("dragging");
					});
				}
			});
	
	this.northExpander = jQuery('<div/>',{ class: 'noteExpander north'}).
			mousedown(function(ev){
				if( self.container.hasClass("selected") ){
					self.container.addClass("expandingNorth");
					self.heightSetpoint = parseInt(self.container.css('height')) + ev.pageY;
					$(document.body).mousemove(function(ev_move){
						self.container.css('height', (self.heightSetpoint - ev_move.pageY)+'px');
						self.noteBox.css('height', (self.heightSetpoint - (Note.EXPANDER_HEIGHT*2) - ev_move.pageY)+'px');
					}).mouseup(function(ev_up){
						self.newFinish(self.start + self.heightSetpoint - ev_up.pageY);
						self.container.removeClass("expandingNorth");
					});
				}
			});
	
	this.southExpander = jQuery('<div/>',{ class: 'noteExpander south'}).
			mousedown(function(ev){
				if( self.container.hasClass("selected") ){
					self.container.addClass("expandingSouth");
					self.mouseSetpoint = parseInt(self.container.css('bottom')) + ev.pageY;
					self.heightSetpoint = parseInt(self.container.css('height')) - ev.pageY;
					$(document.body).mousemove(function(ev_move){
						self.container.css('bottom', (self.mouseSetpoint - ev_move.pageY)+'px');
						self.container.css('height', (self.heightSetpoint + ev_move.pageY)+'px');
						self.noteBox.css('height', (self.heightSetpoint - (Note.EXPANDER_HEIGHT*2) + ev_move.pageY)+'px');
					}).mouseup(function(ev_up){
						self.newStart(self.mouseSetpoint - ev_up.pageY);
						self.container.removeClass("expandingSouth");
					});
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
	$(document.body).unbind("mousemove").unbind("mouseup");
	
	this.start = newStart;
	
	studio.invalidateSavedStatus();
};

Note.prototype.newFinish = function( newFinish ){
	var newHeight = newFinish - this.start;
	this.container.css('height', newHeight+'px');
	this.noteBox.css('height', (newHeight - (Note.EXPANDER_HEIGHT*2))+'px');
	
	$(document.body).unbind("mousemove").unbind("mouseup");
	
	this.finish = newFinish;
	
	studio.invalidateSavedStatus();
};