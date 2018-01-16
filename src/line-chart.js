import * as array from 'd3-array'
import * as scale from 'd3-scale'
import * as shape from 'd3-shape'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import { View } from 'react-native'
import Svg, { Defs, LinearGradient, Stop } from 'react-native-svg'
import Path from './animated-path'
import { Constants } from './util'
import Grid from './grid'

class LineChart extends PureComponent {

    state = {
        width: 0,
        height: 0,
    }

    _onLayout(event) {
        const { nativeEvent: { layout: { height, width } } } = event
        this.setState({ height, width })
    }

    _createLine(dataPoints, yAccessor, xAccessor) {
        const { curve } = this.props

        return shape.line()
            .x(xAccessor)
            .y(yAccessor)
            .defined(value => typeof value === 'number')
            (dataPoints)
    }

    render() {

        const {
                  dataPoints,
                  style,
                  animate,
                  animationDuration,
                  showGrid,
                  numberOfTicks,
                  contentInset: {
                      top    = 0,
                      bottom = 0,
                      left   = 0,
                      right  = 0,
                  },
                  gridMax,
                  gridMin,
                  renderDecorator,
                  extras,
                  renderExtra,
                  shadowOffset,
                  gridProps,
                  svg,
                  shadowSvg,
                  renderGradient,
                  breakpointGradient,
              } = this.props

        const { width, height } = this.state

        if (dataPoints.length === 0) {
            return <View style={ style }/>
        }

        const extent = array.extent([ ...dataPoints])
        const ticks  = array.ticks(extent[ 0 ], extent[ 1 ], numberOfTicks)

        //invert range to support svg coordinate system
        const y = scale.scaleLinear()
            .domain(extent)
            .range([ height - bottom, top ])

        const x = scale.scaleLinear()
            .domain([ 0, dataPoints.length - 1 ])
            .range([ left, width - right ])

        const line = this._createLine(
            dataPoints,
            value => y(value),
            (value, index) => x(index),
        )

        const shadow = this._createLine(
            dataPoints,
            value => y(value - shadowOffset),
            (value, index) => x(index),
        )
        
        const breakPointGridProps = {
          x1: 0,
          y1: y(breakpointGradient.breakpoint),
          x2: 768,
          y2: y(breakpointGradient.breakpoint),
          strokeDasharray: [4,2],
          stroke: 'rgba(138, 138, 143, 0.25)'
        }
        
        const renderBreakPointGradient = (id, options) => {
          
          const offsetCalc = (breakpoint) => {
            let bp = y(breakpoint);
            let ymax = y(extent[0]);
            let off = ymax ? (bp/ymax) : 0.0001;
            off = off < 0.0001 ? 0.0001 : off;
            return off;
          }
          const offset = (breakpoint) => {
            return (offsetCalc(breakpoint)-0.0001).toString();
          }
          
          const offsetEnd = (breakpoint) => {
            return offsetCalc(breakpoint).toString();
          }
          
          return (<LinearGradient id={ id } x1={ '0%' } y1={ '0' } x2={ '0%' } y2={ '100%' }>
            <Stop offset={ '0' } stopColor={ options.colorAbove } stopOpacity={ 1 }/>
            <Stop offset={ offset(options.breakpoint) } stopColor={ options.colorAbove } stopOpacity={ 1 }/>
            <Stop offset={ offsetEnd(options.breakpoint) } stopColor={ options.colorBelow } stopOpacity={ 1 }/>
          </LinearGradient>)
        }
        
        const getStroke = () => {
          if (breakpointGradient) {
            return 'url(#breakpointGradient)';
          } else if (renderGradient) {
            return 'url(#gradient)';
          } else {
            return svg.stroke
          }
        }
        
        return (
            <View style={style}>
                <View style={{ flex: 1 }} onLayout={event => this._onLayout(event)}>
                    <Svg style={{ flex: 1 }}>
                        {
                            showGrid &&
                            <Grid
                                y={ y }
                                ticks={ ticks }
                                gridProps={ breakpointGradient ? breakPointGridProps : gridProps }
                            />
                        }
                        {
                            <Defs>
                                { renderGradient && renderGradient({ id: 'gradient', width, height, x, y }) }
                                { breakpointGradient && renderBreakPointGradient('breakpointGradient', breakpointGradient) }
                            </Defs>
                        }
                        <Path
                            { ...svg }
                            d={line}
                            stroke={getStroke()}
                            fill={ 'none' }
                            animate={animate}
                            animationDuration={animationDuration}
                        />
                        <Path
                            strokeWidth={ 5 }
                            { ...shadowSvg }
                            d={shadow}
                            fill={'none'}
                            animate={animate}
                            animationDuration={animationDuration}
                        />
                        { dataPoints.map((value, index) => renderDecorator({ x, y, value, index })) }
                        { extras.map((item, index) => renderExtra({ x, y, item, index, width, height })) }
                    </Svg>
                </View>
            </View>
        )
    }
}

LineChart.propTypes = {
    dataPoints: PropTypes.arrayOf(PropTypes.number).isRequired,
    svg: PropTypes.object,
    shadowSvg: PropTypes.object,
    shadowWidth: PropTypes.number,
    shadowOffset: PropTypes.number,
    style: PropTypes.any,
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    curve: PropTypes.func,
    contentInset: PropTypes.shape({
        top: PropTypes.number,
        left: PropTypes.number,
        right: PropTypes.number,
        bottom: PropTypes.number,
    }),
    numberOfTicks: PropTypes.number,
    showGrid: PropTypes.bool,
    gridMin: PropTypes.number,
    gridMax: PropTypes.number,
    extras: PropTypes.array,
    gridProps: PropTypes.object,
    renderDecorator: PropTypes.func,
    renderExtra: PropTypes.func,
    renderGradient: PropTypes.func,
    ...Constants.gridProps,
}

LineChart.defaultProps = {
    svg: {},
    shadowSvg: {},
    shadowOffset: 3,
    width: 100,
    height: 100,
    curve: shape.curveCardinal,
    contentInset: {},
    numberOfTicks: 10,
    showGrid: true,
    gridMin: 0,
    gridMax: 0,
    extras: [],
    ...Constants.gridDefaultProps,
    renderDecorator: () => {
    },
    renderExtra: () => {
    },
}

export default LineChart
