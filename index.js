var state = {};

state.example = 'lul'
state.item = "thisisitem"
state.expensiveFunction = function(input) {
    return input
};
state.some_bool = false;
state.items = [1,2,3,4];

var b = new Baby('main', state);
