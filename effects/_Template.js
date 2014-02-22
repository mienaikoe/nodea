
function Template(ctx) {
	this.ctx = ctx;

	this.input = null;
	this.output = null;
	// These are used for various connectivity things. Please Fill these in with something.
}


// This allows all other places in the studio to create one of these 
// and auto-tie it to the context they were working with.
window.AudioContext.prototype.createTemplate = function() {
	return new Template(this);
};




Template.prototype.render = function(division) {

};






Template.prototype.start = function(now) {

};

Template.prototype.stop = function(now) {

};