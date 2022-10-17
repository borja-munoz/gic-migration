import { WebMercatorViewport } from 'deck.gl';
import simplify from '@turf/simplify';
import bboxClip from '@turf/bbox-clip';

export default function LabelLocations(layerFeatures, viewState) {
  const viewport = new WebMercatorViewport(viewState);

  let layerDataLabels = [];

  // Calculate the length for all the edges in the polygon
  layerFeatures.forEach((originalFeature) => {
    // First we simplify and clip the feature
    const simplifiedFeature = simplify(originalFeature, { tolerance: 0.01 });
    const clippedFeature = bboxClip(simplifiedFeature, viewport.getBounds());
    let edges = [];
    if (clippedFeature.geometry.coordinates.length >= 1) {
      for (let i = 0; i < clippedFeature.geometry.coordinates[0].length - 1; i++) {
        const x1 = clippedFeature.geometry.coordinates[0][i][0];
        const y1 = clippedFeature.geometry.coordinates[0][i][1];
        const x2 = clippedFeature.geometry.coordinates[0][i + 1][0];
        const y2 = clippedFeature.geometry.coordinates[0][i + 1][1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        edges.push({
          x1,
          y1,
          x2,
          y2,
          length,
        });
      }
    }

    // Sorts the edges by length in descending order
    edges.sort((a, b) => b.length - a.length);

    // Loop through the edges and add a label to all the edges
    // with length > 100 px (or the longest edge if there is no edge with more than 100 px)
    let positions = [];
    let angles = [];
    for (const edge of edges) {
      // Calculate length in pixels
      const startVertexPixels = viewport.project([edge.x1, edge.y1]);
      const endVertexPixels = viewport.project([edge.x2, edge.y2]);
      const dxPixels = endVertexPixels[0] - startVertexPixels[0];
      const dyPixels = endVertexPixels[1] - startVertexPixels[1];
      const lengthPixels = Math.sqrt(Math.pow(dxPixels, 2) + Math.pow(dyPixels, 2));

      if (positions.length === 0 || lengthPixels > 100) {
        let numberLabels = 1;
        if (lengthPixels > 400) {
          // Add one label every 200 pixels
          numberLabels = Math.floor(lengthPixels / 200);
        }

        // Angle of inclination (X axis)
        const dx = edge.x1 - edge.x2;
        const dy = edge.y1 - edge.y2;
        const angle = (Math.atan(dy / dx) * 180) / Math.PI;

        // Parametric equation
        // Given two points (x1, y1) and (x2, y2), the parametric
        // equation for the line that passes through the points is:
        // x = x1 - x1 * t + x2 * t
        // y = y1 - y1 * t + y2 * t
        // If we have two labels, we will position them at t=0.33 and t=0.66
        // If we have three labels, we will position them at t=0.25, t=0.50 and t=0.75
        const incT = 1 / (numberLabels + 1);
        let t = incT;
        let x, y;
        for (let i = 0; i < numberLabels; i++) {
          x = edge.x1 - edge.x1 * t + edge.x2 * t;
          y = edge.y1 - edge.y1 * t + edge.y2 * t;
          positions.push([x, y]);
          angles.push(angle);
          t += incT;
        }
      } else {
        break;
      }
    }
    // Assign the same label to all the features
    for (let i = 0; i < positions.length; i++) {
      layerDataLabels.push({
        label: originalFeature.properties['provider_short_name'],
        position: positions[i],
        weight: 1,
        angle: angles[i],
      });
    }
  });

  return layerDataLabels;
}
