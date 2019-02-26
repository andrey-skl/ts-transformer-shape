"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../index");
var fooKeys = { foo: null, bar: null };
console.log(fooKeys[0]);
({}.bar);
var fooBarBazShape = {};
console.log('fooBarBazShape', fooBarBazShape);
index_1.shape.toString();
var MyClass = /** @class */ (function () {
    function MyClass() {
    }
    MyClass.prototype.keys = function () {
        return null;
    };
    return MyClass;
}());
