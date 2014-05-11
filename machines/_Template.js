var MachineTemplate = function( ctx, tabDefinition, studio, settings ){
	Machine.call(this, ctx, tabDefinition, studio, settings);
	
	
};

MachineTemplate.prototype = Object.create(Machine.prototype, {
	constructor: { value: MachineTemplate, enumerable: false }
});