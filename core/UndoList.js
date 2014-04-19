var UndoList = function(){
	this.undoers = [];
	this.redoers = [];
};

UndoList.prototype.push = function( undo, redo ){
	if( undo && redo){
		this.undoers.push({undo: undo, redo: redo});
		this.redoers = [];
	} else {
		console.error("Invalid Undoer");
	}
};

UndoList.prototype.undo = function(){
	var undoer = this.undoers.pop();
	if(undoer){
		undoer.undo();
		this.redoers.push(undoer);
	}
};

UndoList.prototype.redo = function(){
	var redoer = this.redoers.pop();
	if(redoer){
		redoer.redo();
		this.undoers.push(redoer);
	}
};












