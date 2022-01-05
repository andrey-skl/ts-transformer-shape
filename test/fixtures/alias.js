"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../index");
index_1.shape();
var fooShape = index_1.shape();
console.log(fooShape);
index_1.shape();
var fooBarBazShape = index_1.shape();
console.log('fooBarBazShape', fooBarBazShape);
function shape() {
    return '';
}
var a = shape();
shape.toString();
var MyClass = /** @class */ (function () {
    function MyClass() {
    }
    MyClass.prototype.keys = function () {
        return index_1.shape();
    };
    return MyClass;
}());
