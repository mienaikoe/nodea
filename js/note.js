var Note = function(options){
	this.start = options.start;
	if( options.finish ){ this.finish = options.finish; }
	if( options.noda ){ this.noda = options.noda; } 
};

Note.prototype.createContainer = function(){
	var clazz = '';
	if( typeof this.finish === 'undefined' ){
		this.finish = this.start+1;
		clazz = 'recording';
	} 
	var slivers = this.finish - this.start;
	var self = this;
	this.container = jQuery('<div/>',{ class: 'note ' + clazz, style: 'bottom: '+this.start+'px; height: '+slivers+'px;'}).
			mousedown(function(){ 
				$(".note.selected").removeClass("selected"); 
				$(this).addClass("selected");
				studio.selectedNote = self;
			});
			
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