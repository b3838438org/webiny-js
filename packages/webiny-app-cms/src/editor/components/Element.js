//@flow
import * as React from "react";
import { Transition } from "react-transition-group";
import { compose, pure, withHandlers, withProps, setDisplayName } from "recompose";
import { connect } from "webiny-app-cms/editor/redux";
import isEqual from "lodash/isEqual";
import { getPlugin } from "webiny-plugins";
import { renderPlugins } from "webiny-app/plugins";
import {
    dragStart,
    dragEnd,
    activateElement,
    highlightElement
} from "webiny-app-cms/editor/actions";
import { getElementProps, getElement } from "webiny-app-cms/editor/selectors";
import Draggable from "./Draggable";
import type { ElementType } from "webiny-app-cms/types";
import {
    defaultStyle,
    ElementContainer,
    transitionStyles,
    typeStyle
} from "./Element/ElementStyled";

declare type ElementProps = {
    className?: string,
    active: boolean,
    dragStart: Function,
    dragEnd: Function,
    element: ElementType,
    highlight: boolean,
    onClick: Function,
    onMouseOver: Function,
    renderDraggable: Function,
    plugin: Object,
    beginDrag: Function,
    endDrag: Function,
    dragging: boolean
};

const Element = pure(
    ({
        plugin,
        renderDraggable,
        element,
        highlight,
        active,
        onMouseOver,
        beginDrag,
        endDrag,
        className = ""
    }: ElementProps) => {
        if (!plugin) {
            return null;
        }

        return (
            <Transition in={true} timeout={250} appear={true}>
                {state => (
                    <ElementContainer
                        id={element.id}
                        onMouseOver={onMouseOver}
                        highlight={highlight}
                        active={active}
                        style={{ ...defaultStyle, ...transitionStyles[state] }}
                        className={"webiny-cms-element-container"}
                    >
                        <div className={["innerWrapper", className].filter(c => c).join(" ")}>
                            <Draggable
                                target={plugin.target}
                                beginDrag={beginDrag}
                                endDrag={endDrag}
                            >
                                {renderDraggable}
                            </Draggable>
                            {plugin.render({ element })}
                        </div>
                        {/*
                        <div className="add-element add-element--above">+</div>
                        <div className="add-element add-element--below">+</div>
                        */}
                    </ElementContainer>
                )}
            </Transition>
        );
    }
);

export default compose(
    setDisplayName("Element"),
    connect(
        (state, props) => {
            return {
                ...getElementProps(state, props),
                element: getElement(state, props.id)
            };
        },
        { dragStart, dragEnd, activateElement, highlightElement },
        null,
        { areStatePropsEqual: isEqual }
    ),
    withProps(({ element }) => ({
        plugin: element ? getPlugin(element.type) : null
    })),
    withHandlers({
        beginDrag: ({ plugin, element, dragStart }) => () => {
            const data = { id: element.id, type: element.type, path: element.path };
            setTimeout(() => {
                dragStart({ element: data });
            });
            return { ...data, target: plugin.target };
        },
        endDrag: ({ dragEnd }) => (props, monitor) => {
            dragEnd({ element: monitor.getItem() });
        },
        onClick: ({ element, active, activateElement }) => () => {
            if (element.type === "cms-element-document") {
                return;
            }
            if (!active) {
                activateElement({ element: element.id });
            }
        },
        onMouseOver: ({ element, highlight, highlightElement }) => e => {
            if (element.type === "cms-element-document") {
                return;
            }

            e.stopPropagation();
            if (!highlight) {
                highlightElement({ element: element.id });
            }
        }
    }),
    withHandlers({
        renderDraggable: ({ element, plugin, onClick }) => ({ connectDragSource }) => {
            return connectDragSource(
                <div className={"type " + typeStyle}>
                    <div className="background" onClick={onClick} />
                    <div className={"element-holder"} onClick={onClick}>
                        {renderPlugins("cms-element-action", { element, plugin })}
                        <span>{plugin.name.replace("cms-element-", "")}</span>
                    </div>
                </div>
            );
        }
    })
)(Element);
