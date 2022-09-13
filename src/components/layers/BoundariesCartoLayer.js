import { useDispatch, useSelector } from 'react-redux';
import PolygonLabelCartoLayer from './PolygonLabelCartoLayer.js';
import { selectSourceById } from '@carto/react-redux';
import { useCartoLayerProps } from '@carto/react-api';
import htmlForFeature from 'utils/htmlForFeature';
import { setLayerIsLoadingData } from 'store/appSlice';

export const BOUNDARIES_CARTO_LAYER_ID = 'boundariesCartoLayer';

export default function BoundariesCartoLayer() {
  const { boundariesCartoLayer } = useSelector((state) => state.carto.layers);
  const source = useSelector((state) =>
    selectSourceById(state, boundariesCartoLayer?.source)
  );
  const cartoLayerProps = useCartoLayerProps({ source, uniqueIdProperty: 'cartodb_id' });
  const dispatch = useDispatch();

  let layer;

  const calculateLabelLocations = (features) => {
    features.forEach((feature) => {
      let longestEdgeLength = 0;
      let longestEdgeInitialCoordIndex = 0;
      for (let i = 0; i < feature.geometry.coordinates[0].length - 1; i++) {
        const dx =
          feature.geometry.coordinates[0][i + 1][0] -
          feature.geometry.coordinates[0][i][0];
        const dy =
          feature.geometry.coordinates[0][i + 1][1] -
          feature.geometry.coordinates[0][i][1];
        const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
        if (length > longestEdgeLength) {
          longestEdgeLength = length;
          longestEdgeInitialCoordIndex = i;
        }
      }
      feature.properties['text'] = feature.properties['provider_short_name'];
      const sumX =
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][0] +
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][0];
      const sumY =
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][1] +
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][1];
      const midPoint = [sumX / 2, sumY / 2];
      feature.properties['textPosition'] = midPoint;
      const dx =
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][0] -
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][0];
      const dy =
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex + 1][1] -
        feature.geometry.coordinates[0][longestEdgeInitialCoordIndex][1];
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      feature.properties['angle'] = angle;
    });
  };

  const viewportLoaded = (data) => {
    dispatch(setLayerIsLoadingData(false));
    let renderedFeatures = layer.getSubLayers()[0].getSubLayers()[0].getRenderedFeatures();
    calculateLabelLocations(renderedFeatures);
  };

  const tileLoaded = () => {
    dispatch(setLayerIsLoadingData(true));
  };

  if (boundariesCartoLayer && source) {
    layer = new PolygonLabelCartoLayer({
      ...cartoLayerProps,
      sourceData: source.data,
      id: BOUNDARIES_CARTO_LAYER_ID,

      getFillColor: [241, 109, 122],
      getLineColor: [255, 0, 0],
      lineWidthMinPixels: 1,

      pickable: true,
      onHover: (info) => {
        if (info?.object) {
          info.object = {
            html: htmlForFeature({ feature: info.object }),
            style: {},
          };
        }
      },
      onViewportLoad: viewportLoaded,
      onTileLoad: tileLoaded,
    });

    return layer;
  }
}
