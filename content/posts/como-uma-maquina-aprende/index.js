import { mount as mountLossGraph } from "./loss-graph-animation.js";
import { mount as mountNeuralNetwork } from "./neural-network-animation.js";

export function mount(root) {
  const cleanups = [mountLossGraph(root), mountNeuralNetwork(root)];
  return () => cleanups.forEach((fn) => typeof fn === "function" && fn());
}
