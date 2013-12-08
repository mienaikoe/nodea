//= require_tree .

var assert = function(obj){
    return (typeof(obj) !== 'undefined' && obj !== null);
};


window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;