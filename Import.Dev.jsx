// Load JSON polyfill.
#include "jsonparse.jsx"

// Parse JSON string
var jsonString = '{"name": "Test", "value": 123}';
var obj = JSON.parse(jsonString);

alert(obj.name + " = " + obj.value);