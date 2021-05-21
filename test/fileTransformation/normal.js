"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../../ts-transformer-shape/index");
var fooKeys = { foo: null, bar: null };
console.log(fooKeys[0]);
({ foo: null, bar: null }.bar);
var fooBarBazShape = { foo: null, bar: null, baz: null };
console.log('fooBarBazShape', fooBarBazShape);
index_1.shape.toString();
var MyClass = /** @class */ (function () {
    function MyClass() {
    }
    MyClass.prototype.keys = function () {
        return {};
    };
    return MyClass;
}());
