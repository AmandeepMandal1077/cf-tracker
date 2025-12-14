import Bottleneck from "bottleneck";

export const ratelimiter = new Bottleneck({
  minTime: 2000,
  maxConcurrent: 1,
  highWater: 0,
  strategy: Bottleneck.strategy.LEAK,
});
