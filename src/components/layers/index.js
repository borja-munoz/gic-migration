import BoundariesLayer from './BoundariesLayer';
import BoundariesCartoLayer from './BoundariesCartoLayer';
// [hygen] Import layers

export const getLayers = () => {
  return [
    BoundariesLayer(),
    BoundariesCartoLayer(),
    // [hygen] Add layer
  ];
};
