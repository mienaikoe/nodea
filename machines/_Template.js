function MachineTemplate( ctx, tabDefinition, studio, marshalledMachine, machineReplacementCallback ){
	Machine.call(this, ctx, tabDefinition, studio, marshalledMachine, machineReplacementCallback);
	
	
};

MachineTemplate.prototype = Object.create(Machine.prototype, {
	constructor: { value: MachineTemplate, enumerable: false }
});