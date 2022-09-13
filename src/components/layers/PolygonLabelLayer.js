import { CompositeLayer, GeoJsonLayer, TextLayer } from 'deck.gl';

export default class PolygonLabelLayer extends CompositeLayer {
  renderLayers() {
    return [
      // Polygons
      new GeoJsonLayer(
        this.getSubLayerProps({
          // `getSubLayerProps` will concat the parent layer id with this id
          id: 'polygon',
          data: this.props.data,

          getFillColor: this.props.getFillColor,
          getLineColor: this.props.getLineColor,
          lineWidthMinPixels: this.props.lineWidthMinPixels,

          updateTriggers: {
            getFillColor: this.props.updateTriggers.getFillColor,
            getLineColor: this.props.updateTriggers.getLineColor,
          },
        })
      ),

      // Labels
      new TextLayer(
        this.getSubLayerProps({
          // `getSubLayerProps` will concat the parent layer id with this id
          id: 'text',
          data: this.props.data.features,

          fontFamily: this.props.fontFamily,
          fontWeight: this.props.fontWeight,

          getPosition: this.props.getTextPosition,
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
  getText: { type: 'accessor', value: (x) => x.properties.text },
  getTextPosition: { type: 'accessor', value: (x) => x.properties.textPosition },
  getTextSize: { type: 'accessor', value: 12 },
  getTextColor: { type: 'accessor', value: [0, 0, 0, 255] },
  getTextAngle: { type: 'accessor', value: (x) => x.properties.angle },
};
