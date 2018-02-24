import * as React from 'react';
import { defVal } from './Helpers';
import { SelectButton, SelectButtonOnChange, SelectButtonState } from './SelectButton';
import { ExpandButton, ExpandButtonOnChange } from './ExpandButton';

/**
 * Interface for the node's state property.
 */
interface NodeState {
    checked?: SelectButtonState;
    disabled?: boolean;
    expanded?: boolean;
    selected?: boolean;
}

export interface ParentData {
    checkboxOnChange: SelectButtonOnChange;
    expandOnChange: ExpandButtonOnChange;
    showCheckbox: boolean;
}

/**
 * Node properties interface.
 */
export interface NodeProps {
    id?: string;
    text: string;
    nodes?: NodeProps[];
    state?: NodeState;
    checkable?: boolean;
    hideCheckbox?: boolean;

    // TODO
    icon?: string;
    image?: string;
    selectedIcon?: string;
    color?: string;
    backColor?: string;
    iconColor?: string;
    selectable?: boolean;
    classes?: string;

    // Private
    parentData?: ParentData;
    initialized?: boolean;
}

/**
 * Initializes the given children nodes.
 *
 * @param {NodeProps[]} children The children to initialize.
 * @param {string} parentID The parent ID to compute children IDs
 * @param {ParentData} parentData The required data from parent.
 * @constructor
 */
export function NodeChildrenFactory(children: NodeProps[], parentID: string, parentData: ParentData): void {
    // Check if exists
    if ( children == null ) { return; }

    for (let i = 0; i < children.length; i++) {
        let node = children[i];

        if ( parentID === '' ) {
            node.id = i.toString();
        } else {
            node.id = parentID + '.' + i;
        }

        node.state = NodeStateFactory(node.state);
        node.checkable = defVal(node.checkable, true);
        node.hideCheckbox = defVal(node.hideCheckbox, false);
        node.nodes = defVal(node.nodes, []);

        // Private
        node.parentData = parentData;
        node.initialized = false;

        // Check if the node is expanded, if so then we have to initialize its children too
        if ( node.state.expanded ) {
            NodeChildrenFactory(node.nodes, node.id, parentData);
            node.initialized = true;
        }
    }
}

/**
 * Generates a new state from given values or by default all values false.
 *
 * @param {NodeState} state The already existing state. Top priority value.
 * @returns {NodeState} The new filled state (if no value in the node then default)
 * @constructor
 */
function NodeStateFactory(state: NodeState): NodeState {
    if ( state != null) {
        return {
            checked: defVal(state.checked, SelectButtonState.Unselected),
            disabled: defVal(state.disabled, false),
            expanded: defVal(state.expanded, false),
            selected: defVal(state.selected, false)
        };
    } else {
        return {checked: SelectButtonState.Unselected, disabled: false, expanded: false, selected: false};
    }
}

/**
 * @class Node
 * @extends React.Component
 *
 * Displays a node and communicates with submodules and tree.
 */
export class Node extends React.Component<NodeProps, {}> {

    /**
     * Constructor.
     * @param {NodeProps} props
     */
    constructor(props: NodeProps) {
        super(props);

        this.handleCheckChange = this.handleCheckChange.bind(this);
        this.handleOpenChange = this.handleOpenChange.bind(this);
    }

    /**
     * Own checkbox handler.
     * @param {boolean} checked Contains the input field value.
     */
    handleCheckChange(checked: boolean): void {
        if ( this.props.checkable ) {
            this.props.parentData.checkboxOnChange(checked, this.props.id);
        }
    }

    /**
     * Handles open event.
     * @param {boolean} expanded True on expand false on collapse.
     */
    handleOpenChange(expanded: boolean): void {
        this.props.parentData.expandOnChange(this.props.id, expanded);
    }

    /**
     * Returns the computed padding size for the current list item for indent.
     * @returns {number} The computed padding level.
     */
    getItemIndentSize(): number {
        return (this.props.id.split('.').length - 1);
    }

    render () {
        const checkbox = !this.props.hideCheckbox && this.props.parentData.showCheckbox ? (
            <SelectButton onChange={this.handleCheckChange} checked={this.props.state.checked} />
        ) : null;

        // Dropdown button if not displayed added padding
        let openButton: JSX.Element;
        let noOpenButtonPadding: string;
        if ( this.props.nodes.length > 0 ) {
            openButton = <ExpandButton onChange={this.handleOpenChange} expanded={this.props.state.expanded}/>;
            noOpenButtonPadding = '';
        } else {
            openButton = null;
            noOpenButtonPadding = 'NoOpenButtonPadding';
        }

        const indentCLass = 'indent-' + this.getItemIndentSize();

        const sublist = this.props.state.expanded ? (
            NodeRenderSublist(this.props.nodes)
        ) : null;

        return (
            <React.Fragment>
                <li className={indentCLass + ' ' + noOpenButtonPadding}>
                    {openButton}
                    {checkbox}
                    {this.props.text}
                </li>
                {sublist}
            </React.Fragment>
        );
    }
}

/**
 * Creates the Node[] components from given nodes.
 *
 * @param {NodeProps[]} nodes The nodes to render.
 * @returns {JSX.Element[]} The array of JSX elements with nodes.
 */
export function NodeRenderSublist(nodes: NodeProps[]): JSX.Element[] {
    if (nodes) {
        let elements: JSX.Element[] = [];
        for (let i = 0; i < nodes.length; i++) {
            elements.push(
                <Node
                    key={nodes[i].id}
                    {...nodes[i]}
                />
            );
        }
        return elements;
    } else { return null; }
}
