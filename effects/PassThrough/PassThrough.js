

function PassThrough(ctx) {
	this.ctx = ctx;

	/* because you can't create a generic audio node for pass-through
	 * and there need to be several nodes that link to this node
	 */
	this.input = ctx.createGainNode();
	this.input.gain.value = 1.0;

	this.output = this.input;
}


// This allows all other places in the studio to create one of these 
// and auto-tie it to the context they were working with.
window.AudioContext.prototype.createPassThrough = function() {
	return new PassThrough(this);
};




PassThrough.prototype.render = function(division) {

};

PassThrough.prototype.start = function(now) {

};

PassThrough.prototype.stop = function(now) {

};