//= require_tree .
function advanceIdeas(){
    machine.advance
}

var Machine = function(sound_files) {
    this.circuit = new Circuit(sound_files);
    this.ideas = new Ideas(this.nodas);
};

