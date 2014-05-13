function Uncharted( ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshaledMachine, machineReplacementCallback);
	
	
};

Uncharted.prototype = Object.create(Machine.prototype, {
	constructor: { value: Uncharted, enumerable: false }
});