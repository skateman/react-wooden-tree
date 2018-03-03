import * as React from 'react';
import { SelectButton, SelectButtonOnChange } from './SelectButton';
import { ExpandButton, ExpandButtonOnChange } from './ExpandButton';

/**
 * Interface for the node's state property.
 */
interface NodeState {
    checked?: boolean;
    disabled?: boolean;
    expanded?: boolean;
    selected?: boolean;
}

/**
 * Interface for all data required from the tree root.
 */
export interface ParentData {
    // Checkbox
    checkboxOnChange: SelectButtonOnChange;
    expandOnChange: ExpandButtonOnChange;
    showCheckbox: boolean;

    // Icons
    showIcon?: boolean;                 // < Determines if the icons are showed in nodes.
    showImage?: boolean;                // < Determines if images are preferred to the icons.
    nodeIcon?: string;                  // < Default icon for nodes without it.
    checkedIcon?: string;               // < The checkbox-checked icon.
    uncheckedIcon?: string;             // < The checkbox-unchecked icon.
    partiallyCheckedIcon?: string;      // < The checkbox-partially selected icon.
    collapseIcon?: string;              // < The icon for collapsing parents.
    expandIcon?: string;                // < The icon for expanding parents.
    emptyIcon?: string;                 // < TODO: The icon for empty something.
    loadingIcon?: string;               // < TODO: The loading icon when loading data with ajax.
    selectedIcon?: string;              // < TODO: The icon for selected nodes.
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

    // Styling
    icon?: string;
    image?: string;

    // Private
    parentData?: ParentData;
    initialized?: boolean;

    // TODO All of these
    selectable?: boolean;
    selectedIcon?: string;
    classes?: string;
}

/**
 * @class Node
 * @extends React.Component
 *
 * Displays a node and communicates with submodules and tree.
 */
export class Node extends React.Component<NodeProps, {}> {
    /**
     * Used for default values.
     */
    public static defaultProps: NodeProps;

    /**
     * Creates the Node[] components from given nodes.
     *
     * @param {NodeProps[]} nodes The nodes to render.
     * @param {ParentData} parentData The parent data to pass.
     * @returns {JSX.Element[]} The array of JSX elements with nodes.
     */
    public static renderSublist(nodes: NodeProps[], parentData: ParentData): JSX.Element[] {
        if (nodes) {
            let elements: JSX.Element[] = [];
            for (let i = 0; i < nodes.length; i++) {
                elements.push(
                    <Node
                        key={nodes[i].id}
                        parentData={parentData}
                        {...nodes[i]}
                    />
                );
            }
            return elements;
        } else { return null; }
    }

    /**
     * Renders the tree element.
     *
     * @returns {JSX.Element}
     */
    public render () {
        // Indent class
        let NodeClasses = 'indent-' + this.getItemIndentSize();

        // Checkbox
        const checkbox = !this.props.hideCheckbox && this.props.parentData.showCheckbox ? (
            <SelectButton
                onChange={this.handleCheckChange}
                checked={this.props.state.checked}
                checkedIcon={this.props.parentData.checkedIcon}
                partiallyCheckedIcon={this.props.parentData.partiallyCheckedIcon}
                uncheckedIcon={this.props.parentData.uncheckedIcon}
            />
        ) : null;

        // Dropdown button if not displayed added padding
        let openButton: JSX.Element;
        if ( this.props.nodes.length > 0 ) {
            openButton = (
                <ExpandButton
                    onChange={this.handleOpenChange}
                    expanded={this.props.state.expanded}
                    expandIcon={this.props.parentData.expandIcon}
                    collapseIcon={this.props.parentData.collapseIcon}
                />
            );
        } else {
            openButton = null;
            NodeClasses += ' NoOpenButton';
        }

        // Icon
        let icon: JSX.Element = null;
        if ( this.props.parentData.showIcon ) {
            if ( this.props.parentData.showImage && this.props.image ) {
                icon = <img className={'NodeIconImage'} src={this.props.image}/>;
            } else if ( this.props.icon ) {
                icon = <i className={this.props.icon}/>;
            } else {
                icon = <i className={this.props.parentData.nodeIcon}/>;
            }
        }

        // Children
        const sublist = this.props.state.expanded ? (
            Node.renderSublist(this.props.nodes, this.props.parentData)
        ) : null;

        return (
            <React.Fragment>
                <li className={NodeClasses} id={this.props.id}>
                    {openButton}
                    {checkbox}
                    {icon}
                    {this.props.text}
                </li>
                {sublist}
            </React.Fragment>
        );
    }

    /**
     * Constructor.
     * @param {NodeProps} props
     */
    private constructor(props: NodeProps) {
        super(props);

        this.handleCheckChange = this.handleCheckChange.bind(this);
        this.handleOpenChange = this.handleOpenChange.bind(this);
    }

    /**
     * Own checkbox handler.
     * @param {boolean} checked Contains the input field value.
     */
    private handleCheckChange(checked: boolean): void {
        if ( this.props.checkable ) {
            this.props.parentData.checkboxOnChange(checked, this.props.id);
        }
    }

    /**
     * Handles open event.
     * @param {boolean} expanded True on expand false on collapse.
     */
    private handleOpenChange(expanded: boolean): void {
        this.props.parentData.expandOnChange(this.props.id, expanded);
    }

    /**
     * Returns the computed padding size for the current list item for indent.
     * @returns {number} The computed padding level.
     */
    private getItemIndentSize(): number {
        return (this.props.id.split('.').length - 1);
    }
}

/**
 * Node default values.
 */
Node.defaultProps = {
    id: '',
    text: '',
    nodes: [],
    state: {
        checked: false,
        expanded: false,
        disabled: false,
        selected: false
    },

    checkable: true,
    hideCheckbox: false,

    // Styling
    icon: null,
    image: null,

    // Private
    parentData: null,
    initialized: false,

    // TODO All of these
    selectable: true,
    selectedIcon: '',
    classes: ''
};