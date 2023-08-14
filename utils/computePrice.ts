const computePrice = (price: number): number => {
  return Math.round(price * 10 ** 8) / 10 ** 8;
};

export default computePrice;
