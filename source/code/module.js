let value = undefined;

function getValue() {
    return value;
}

setTimeout(() => {
    value = 'not empty';
}, 1000);

module.exports = {
	value: value,
	getValue: getValue
};