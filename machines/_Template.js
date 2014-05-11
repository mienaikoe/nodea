var MachineTemplate = function( ctx, settings ){
	Machine.call(this, ctx, settings);
	
	
};

MachineTemplate.prototype = Object.create(Machine.prototype, {
	constructor: { value: MachineTemplate, enumerable: false }
});