var Uncharted = function( ctx, settings ){
	Machine.call(this, ctx, settings);
	
	
};

Uncharted.prototype = Object.create(Machine.prototype, {
	constructor: { value: Uncharted, enumerable: false }
});