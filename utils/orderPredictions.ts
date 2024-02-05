import computePrice from "./computePrice";

// ASC
const orderPredictions = (predictions: any) =>
  predictions.sort(
    (a: any, b: any) => computePrice(a.price) - computePrice(b.price)
  );

export default orderPredictions;
