var Uncharted = function( ctx, tabDefinition, studio, marshaledMachine ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine);
	
	
};

Uncharted.prototype = Object.create(Machine.prototype, {
	constructor: { value: Uncharted, enumerable: false }
});