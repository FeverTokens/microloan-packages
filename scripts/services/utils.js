"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUtf8Bytes = exports.keccak256 = void 0;
const ethers_1 = require("ethers");
function keccak256(input) {
    return (0, ethers_1.keccak256)(input);
}
exports.keccak256 = keccak256;
function toUtf8Bytes(input) {
    return (0, ethers_1.toUtf8Bytes)(input);
}
exports.toUtf8Bytes = toUtf8Bytes;
