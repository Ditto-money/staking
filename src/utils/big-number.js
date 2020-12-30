import BigJs from 'big.js';

const PRECISION = 4;

export function toFixed(a, b, precision) {
  if (isZero(Big(a)) || isZero(Big(b))) {
    return '0';
  }
  return Big(a)
    .div(Big(b))
    .toFixed(precision ?? PRECISION);
}

export function formatUnits(a, decimals, precision) {
  return toFixed(a, Big(10).pow(decimals), precision);
}

export function isZero(a) {
  return a.eq(Big('0'));
}

export function Big(n) {
  return new BigJs(n.toString());
}
