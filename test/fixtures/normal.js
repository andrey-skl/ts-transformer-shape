"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../index");
var fooKeys = index_1.shape();
console.log(fooKeys[0]);
index_1.shape().bar;
var fooBarBazShape = index_1.shape();
console.log('fooBarBazShape', fooBarBazShape);
index_1.shape.toString();
var MyClass = /** @class */ (function () {
    function MyClass() {
    }
    MyClass.prototype.keys = function () {
        return index_1.shape();
    };
    return MyClass;
}());
