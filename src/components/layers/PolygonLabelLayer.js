import { CompositeLayer, GeoJsonLayer, TextLayer } from 'deck.gl';
import TagmapLayer from './tagmap/tagmap-layer';

export default class PolygonLabelLayer extends CompositeLayer {
  renderLayers() {
    return [
      // Polygons
      new GeoJsonLayer(
        this.getSubLayerProps({
          id: 'polygon',
          data: this.props.data,

          getFillColor: this.props.getFillColor,
          getLineColor: this.props.getLineColor,
          lineWidthMinPixels: this.props.lineWidthMinPixels,

          fillPatternMask: this.props.fillPatternMask,
          fillPatternAtlas: this.props.fillPatternAtlas,
          fillPatternMapping: this.props.fillPatternMapping,
          getFillPattern: this.props.getFillPattern,
          getFillPatternScale: this.props.getFillPatternScale,
          getFillPatternOffset: this.props.getFillPatternOffset,

          extensions: this.props.extensions,

          updateTriggers: {
            getFillColor: this.props.updateTriggers.getFillColor,
            getLineColor: this.props.updateTriggers.getLineColor,
          },
        })
      ),

      // Labels
      // new TextLayer(
      new TagmapLayer(
        this.getSubLayerProps({
          id: 'text',
          data: this.props.dataLabels,

          // We don't want to generate picking events on the label layer
          pickable: false,

          fontFamily: this.props.fontFamily,
          fontWeight: this.props.fontWeight,

          //getPosition: this.props.getTextPosition,
          getText: this.props.getText,
          getSize: this.props.getTextSize,
          getColor: this.props.getTextColor,
          getAngle: this.props.getTextAngle,

          updateTriggers: {
            getPosition: this.props.updateTriggers.getPosition,
            getText: this.props.updateTriggers.getText,
            getSize: this.props.updateTriggers.getTextSize,
            getColor: this.props.updateTriggers.getTextColor,
            getAngle: this.props.updateTriggers.getTextAngle,
          },

          extensions: [],
        })
      ),
    ];
  }
}

PolygonLabelLayer.layerName = 'PolygonLabelLayer';

PolygonLabelLayer.defaultProps = {
  // Text properties
  fontFamily: 'Monaco, monospace',
  fontWeight: 'normal',
  // Text accessors
  getText: { type: 'accessor', value: (x) => x.text },
  //getTextPosition: { type: 'accessor', value: (x) => x.textPosition },
  getTextSize: { type: 'accessor', value: 12 },
  getTextColor: { type: 'accessor', value: [0, 0, 0, 255] },
  getTextAngle: { type: 'accessor', value: (x) => x.angle },
};
