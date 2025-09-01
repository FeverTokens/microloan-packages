import { keccak256 as _keccak256, toUtf8Bytes as _toUtf8Bytes } from 'ethers';

export function keccak256(input: any): string {
  return _keccak256(input);
}

export function toUtf8Bytes(input: any): Uint8Array {
  return _toUtf8Bytes(input);
}
