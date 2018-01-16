import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Path } from 'react-native-svg'
import * as interpolate from 'd3-interpolate-path'

class AnimatedPath extends Component {

    constructor(props) {
        super(props)
        this.state = { d: props.d }
    }

    componentWillReceiveProps(props) {
        const { d: newD, animate } = props
        const { d: oldD }          = this.props

        if(this.currentD === undefined) {
            this.currentD = oldD;
        }

        this.newD = newD

        if (newD === oldD) {
            return
        }

        if (!animate || newD === null || oldD === null) {
            return
        }

        this.newD         = newD
        this.interpolator = interpolate.interpolatePath(this.currentD, newD)

        this._animate()
    }

    componentWillUnmount() {
        cancelAnimationFrame(this.animation)
    }
    
    shouldComponentUpdate(nextProps, nextState) {
        const { animate } = nextProps;
        if (animate) {
            return false;
        }
        return true;
    }

    _animate(start) {
        cancelAnimationFrame(this.animation)
        this.animation = requestAnimationFrame((timestamp) => {
            if (!start) {
                start = timestamp
            }

            // Get the delta on how far long in our animation we are.
            let delta = (timestamp - start) / this.props.animationDuration

            // If we're above 1 then our animation should be complete.
            if (delta > 1) {
                delta = 1;
            }

            const d = this.interpolator(delta)
            this.component.setNativeProps({ d })
            this.currentD = d;

            if (delta == 1) {
                return;
            }

            // Update our state with the new tween value and then jump back into
            // this loop.
            this.setState(this.state, () => {
                this._animate(start)
            })
        })
    }

    render() {
        return (
            <Path
                ref={ref => this.component = ref}
                {...this.props}
            />
        )
    }
}

AnimatedPath.propTypes = {
    animate: PropTypes.bool,
    animationDuration: PropTypes.number,
    renderPlaceholder: PropTypes.func,
    ...Path.propTypes,
}

AnimatedPath.defaultProps = {
    animate: true,
    animationDuration: 300,
    renderPlaceholder: () => null,
}

export default AnimatedPath
