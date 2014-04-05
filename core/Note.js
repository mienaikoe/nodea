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
	
	jQuery('<div/>',{ class: 'noteExpander north'}).appendTo(this.container);
	
	this.noteBox = jQuery('<div/>',{ class: 'note', style: 'height: '+slivers+'px;'}).
			mousedown(function(ev){
				if( self.container.hasClass("selected") ){
					self.container.addClass("dragging");
					self.mouseSetpoint = parseInt(self.container.css('bottom')) + ev.pageY;
					self.container.mousemove(function(ev_move){
						$(this).css('bottom', (self.mouseSetpoint - ev_move.pageY)+'px');
					});
				}
			}).mouseup(function(ev){
				if( self.container.hasClass("dragging") ){
					self.move(self.mouseSetpoint - ev.pageY);
					self.container.removeClass("dragging");
				}
			});
			
	this.noteBox.appendTo(this.container);
	
	jQuery('<div/>',{ class: 'noteExpander south'}).appendTo(this.container);
			
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
	this.container.unbind("mousemove");
	
	this.finish = this.finish + (newStart - this.start);
	this.start = newStart;
	
	studio.invalidateSavedStatus();
};