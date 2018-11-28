import * as React from 'react';
import { Node, NodeProps, ParentData } from './Node';
import './Tree.css';
import { defVal } from './Helpers';
// @ts-ignore
import keydown, { Keys } from 'react-keydown';

/**
 * Constants for key catch and identification
 */
const { ENTER, UP, DOWN, LEFT, RIGHT, HOME, END } = Keys;

export interface TreeProps {
    data: NodeProps[];                  // < The definitions of the tree nodes.

    // Checkbox
    showCheckbox?: boolean;             // < Option: whenever the checkboxes are displayed.
    hierarchicalCheck?: boolean;        // < If enabled parent and children are reflecting each other changes.
    checkboxFirst?: boolean;            // < Determines if the node icon or the checkbox is the first.

    // Selection
    multiSelect?: boolean;              // < Determines if multiple nodes can be selected.
    preventDeselect?: boolean;          // < Determines if can be deselected all nodes.
    allowReselect?: boolean;            // < Used with preventDeselect allows to fire selected event on selected node.

    // Icons
    showIcon?: boolean;                 // < Determines if the icons are showed in nodes.
    showImage?: boolean;                // < Determines if images are preferred to the icons.
    nodeIcon?: string;                  // < Default icon for nodes without it.
    checkedIcon?: string;               // < The checkbox-checked icon.
    uncheckedIcon?: string;             // < The checkbox-unchecked icon.
    partiallyCheckedIcon?: string;      // < The checkbox-partially selected icon.
    collapseIcon?: string;              // < The icon for collapsing parents.
    expandIcon?: string;                // < The icon for expanding parents.
    loadingIcon?: string;               // < The loading icon when loading data with ajax.
    errorIcon?: string;                 // < The icon displayed when lazyLoading went wrong.
    selectedIcon?: string;              // < The icon for selected nodes.

    // Styling
    changedCheckboxClass?: string;      // < Extra class for the changed checkbox nodes.
    selectedClass?: string;             // < Extra class for the selected nodes.

    // Accessibility
    treeLabelId?: string;               // < Gives the ID to he element, where the tree function is described.
    accessibility?: boolean;            // < If enabled then generates accessibility elements as well.

    // Callbacks
    /**
     * All changes made in the tree will be propagated upwards.
     * Every time the tree changes the node's data the callback will be fired.
     *
     * @param {string} nodeId The node's nodeId.
     * @param {string} dataType The currently changed information.
     * @param {boolean} newValue The newly assigned value.
     */
    onDataChange: (nodeId: string, dataType: string, newValue: any) => void;

    /**
     * The function which will be called when a lazily loadable node is
     * expanded first time.
     *
     * @param {NodeProps} node The node which children has to be loaded.
     * @returns {Promise<NodeProps[]>} Promise about the children of the given node.
     */
    lazyLoad?: (node: NodeProps) => Promise<NodeProps[]>;
}

export interface TreeState {}

export class Tree extends React.Component<TreeProps, TreeState> {
    /**
     * Used for default values.
     */
    public static defaultProps: TreeProps;

    /**
     * This structure contains all the data that nodes need from the
     * tree component root like settings and callback functions.
     */
    private readonly parentData: ParentData;

    /**
     * Indicates if there is a node currently selected and which one.
     * Needed to uncheck node if user selects another.
     * Not needed when multi-select is enabled.
     */
    private selectedNode: string;

    /**
     * Stores the currently focused node id.
     */
    private focusedNodeId: string;

    /**
     * Generates the IDs and states for all nodes recursively.
     * The IDs are crucial for the tree to work.
     * The state is needed to avoid not defined exceptions.
     * The accessibility needed to be able change focus by keyboard.
     *
     * @param {NodeProps[]} tree The tree to fill the IDs up.
     * @param {string} parentID The parent nodeId of the current nodes. For root left this param out.
     * @param {boolean} accessibility Set true if want to browse the tree by keyboard. Generates refs.
     * @returns {NodeProps[]} The new filled tree.
     */
    public static initTree(tree: NodeProps[], parentID: string = '', accessibility: boolean = false): NodeProps[] {
        let treeCopy = tree.slice();

        for (let i = 0; i < treeCopy.length; i++) {
            if ( parentID === '' ) {
                treeCopy[i].nodeId = i.toString();
            } else {
                treeCopy[i].nodeId = parentID + '.' + i;
            }

            if ( treeCopy[i].state == null ) {
                treeCopy[i].state = {};
            }

            if ( accessibility ) {
                treeCopy[i].reference = React.createRef();
            }

            treeCopy[i].state = {
                checked: defVal(treeCopy[i].state.checked, false),
                expanded: defVal(treeCopy[i].state.expanded, false),
                disabled: defVal(treeCopy[i].state.disabled, false),
                selected: defVal(treeCopy[i].state.selected, false),
            };

            if ( treeCopy[i].nodes ) {
                treeCopy[i].nodes = Tree.initTree(treeCopy[i].nodes, treeCopy[i].nodeId, accessibility);
            }
        }
        return treeCopy;
    }

    /**
     * Splits the nodeId to array of integers which give the exact position in the tree.
     *
     * @param nodeId The nodeId to split to array of integers.
     * @return Array of integers.
     */
    public static nodeIdSplit(nodeId: string): number[] {
        return nodeId.split('.').map(function(id: string) {
            return parseInt(id, 10);
        });
    }

    /**
     * Searches trough the tree or subtree in attr field for the given string.
     * Only works if the nodeSelector can be applied on the tree.
     *
     * @param {NodeProps[]} tree The tree in which the function will search.
     * @param nodeID The id of the parent node (pass null if want to search the whole tree).
     * @param attrName The name of the attribute to search in.
     * @param searchString The string to search for.
     * @return string[] Array of ID's where the string is present.
     */
    public static nodeSearch(tree: NodeProps[], nodeID: string, attrName: string, searchString: string): string[] {
        let findInID: string[] = [];

        if ( !nodeID ) {
            for (let i = 0; i < tree.length; i++) {
                findInID = findInID.concat(this.nodeSearch(tree, tree[i].nodeId, attrName, searchString));
            }
            return findInID;
        }

        let rootNode = this.nodeSelector(tree, nodeID);

        if ( rootNode.nodes ) {
            for (let i = 0; i < rootNode.nodes.length; i++) {
                let node = rootNode.nodes[i];
                findInID = this.nodeSearch(tree, node.nodeId, attrName, searchString);
            }
        }

        if ( rootNode.attr && rootNode.attr[attrName] && rootNode.attr[attrName] === searchString ) {
            findInID.push(rootNode.nodeId);
        }

        return findInID;
    }

    /**
     * Searches for the node by nodeId, and returns it.
     * Search is done by walking the tree by index numbers got form the nodeId.
     *
     * @param {NodeProps[]} tree The tree which to look in the node for.
     * @param {string} nodeId The nodeId of the searched node.
     * @returns {NodeProps}
     * @warning Doesn't checks the validity of the nodeId.
     */
    public static nodeSelector(tree: NodeProps[], nodeId: string): NodeProps {
        let path = Tree.nodeIdSplit(nodeId);

        let node = tree[path[0]];
        for (let i = 1; i < path.length; i++) {
            node = node.nodes[path[i]];
        }

        return node;
    }

    /**
     * Searches for the node's parent from nodeId, and returns it.
     * Search is done by walking the tree by index numbers got form the nodeId.
     * If the nodeId is top level node then returns the node for that id.
     *
     * @param {NodeProps[]} tree The tree which to look in the node for.
     * @param {string} nodeId The nodeId of the searched node.
     * @returns {NodeProps} The parent node.
     * @warning Doesn't checks the validity of the nodeId.
     */
    public static parentNodeSelector(tree: NodeProps[], nodeId: string): NodeProps {
        let path = Tree.nodeIdSplit(nodeId);

        let node = tree[path[0]];
        for (let i = 1; i < path.length - 1; i++) {
            node = node.nodes[path[i]];
        }

        return node;
    }

    /**
     * Searches the node's siblings and returns them (included the given node).
     * If the nodeId is top level, then returns all top level nodes.
     *
     * @param {NodeProps[]} tree The tree in which too look for the nodes.
     * @param {string} nodeId The node ID to get the siblings for.
     * @returns {NodeProps[]} The node siblings, given node included.
     */
    public static siblingsNodeSelector(tree: NodeProps[], nodeId: string): NodeProps[] {
        let path = Tree.nodeIdSplit(nodeId);

        if ( path.length === 1 ) {
            return tree;
        }

        return Tree.parentNodeSelector(tree, nodeId).nodes;
    }

    /**
     * Sets the focus on the given node. Validates.
     *
     * @param {NodeProps} node The node to set focus to.
     */
    public static setFocus(node: NodeProps): void {
        node.reference.current.focus();
    }

    /**
     * Updates the given node's reference in the tree.
     *
     * @param {NodeProps[]} tree Where the node will be updated.
     * @param {NodeProps} node The node to put reference in the tree.
     * @returns The new tree.
     * @warning Doesn't checks the validity of the node's nodeId.
     */
    public static nodeUpdater(tree: NodeProps[], node: NodeProps): NodeProps[] {
        let newTree: NodeProps[] = [...tree];

        let path: number[] = node.nodeId.split('.').map(function(nodeId: string) {
            return parseInt(nodeId, 10);
        });

        // If top element
        if ( path.length === 1 ) {
            newTree[path[0]] = node;
            return newTree;
        }

        // Otherwise select the parent
        let tempNode = newTree[path[0]];
        for (let i = 1; i < path.length - 1; i++) {
            tempNode = tempNode.nodes[path[i]];
        }

        // Update the correct child (last index in the path)
        tempNode.nodes[path[ path.length - 1 ]] = node;

        return newTree;
    }

    /**
     * Helper function: Checks the node.
     *
     * @param {NodeProps} node The node to change.
     * @param {boolean} value The new value of the checked field.
     * @returns {NodeProps} The changed node.
     */
    public static nodeChecked(node: NodeProps, value: boolean): NodeProps {
        return {...node, state: {...node.state, checked: value} };
    }

    /**
     * Helper function: Expands or collapses the node.
     *
     * @param {NodeProps} node The node to change.
     * @param {boolean} value The new value of the expanded field.
     * @returns {NodeProps} The changed node.
     */
    public static nodeExpanded(node: NodeProps, value: boolean): NodeProps {
        return {...node, state: {...node.state, expanded: value} };
    }

    /**
     * Helper function: Disables or enables the node.
     *
     * @param {NodeProps} node The node to change.
     * @param {boolean} value The new value of the disabled field.
     * @returns {NodeProps} The changed node.
     */
    public static nodeDisabled(node: NodeProps, value: boolean): NodeProps {
        return {...node, state: {...node.state, disabled: value} };
    }

    /**
     * Helper function: Selects or deselects the node.
     *
     * @param {NodeProps} node The node to change.
     * @param {boolean} value The new value of the selected field.
     * @returns {NodeProps} The changed node.
     */
    public static nodeSelected(node: NodeProps, value: boolean): NodeProps {
        return {...node, state: {...node.state, selected: value} };
    }

    /**
     * Helper function: Updates the children of the node.
     *
     * @param {NodeProps} node The node to change.
     * @param {boolean} nodes The new children of the node.
     * @returns {NodeProps} The changed node.
     */
    public static nodeChildren(node: NodeProps, nodes: NodeProps[]): NodeProps {
        return {...node, nodes: nodes};
    }

    /**
     * Helper function: Updates the loading state of the node.
     *
     * @param {NodeProps} node The node to change.
     * @param {boolean} value The new loading value.
     * @returns {NodeProps} The changed node.
     */
    public static nodeLoading(node: NodeProps, value: boolean): NodeProps {
        return {...node, loading: value};
    }

    /**
     * Recursively gets the max depth of the tree.
     *
     * @param {NodeProps[]} nodes The root node of the tree.
     * @returns {number} The max depth of the tree.
     */
    private static getDepth(nodes: NodeProps[]): number {
        let depth = 0;
        if (nodes) {
            for (let i = 0; i < nodes.length; i++) {
                let newDepth = Tree.getDepth(nodes[i].nodes);
                if ( depth < newDepth) {
                    depth = newDepth;
                }
            }
        }
        return 1 + depth;
    }

    /**
     * Generates the css classes for indenting the nodes.
     *
     * @param {number} depth Max depth of the tree. This is how many classes will be generated.
     * @returns {string} CSS: .indent-X{padding-left:X*15px}
     */
    private static generateIndentCSS(depth: number): string {
        let cssRules: string = '';
        let indentSize = 18;
        for (let i = 1; i < depth; i++) {
            cssRules += '.indent-' + i + '{padding-left:' + indentSize * i + 'px}';
        }
        return cssRules;
    }

    /**
     * Returns the last visible child to a node. Meaning the visually last
     * node which is under the given node.
     *
     * @param node The node to get the last visible child.
     * @returns {NodeProps} The last expanded node.
     */
    private static getLastVisible(node: NodeProps): NodeProps {
        if ( !node.state.expanded ) {
            return node;
        }

        return Tree.getLastVisible(node.nodes[node.nodes.length - 1]);
    }

    /**
     * If the node is initialized by the rules (X.Y.Z...) then gets the previous
     * id to the node. If the node is the first node, then returns the same.
     *
     * If the node is not top level and is first among the siblings, then the parent
     * node is returned.
     *
     * @param {string} nodeId The nodeId to get previous node for.
     * @param {NodeProps[]} tree The tree to search the previous node.
     * @return The previous nodeId.
     */
    private static previousNode(tree: NodeProps[], nodeId: string): string {
        let path = Tree.nodeIdSplit(nodeId);

        // Top level
        if ( path.length === 1 ) {
            if ( path[0] > 0 ) {
                // Check recursively if the previous node is expanded
                // and return the last node od the previous node.
                return Tree.getLastVisible(Tree.nodeSelector(tree, String(path[0] - 1))).nodeId;
            } else {
                return nodeId;
            }
        }

        // Not top level
        if ( path[path.length - 1] > 0 ) {
            path[path.length - 1] -= 1; // Move to previous

            // Check recursively if the previous node is expanded
            // and return the last node od the previous node.
            return Tree.getLastVisible(Tree.nodeSelector(tree, path.join('.'))).nodeId;
        } else {
            path.splice(-1, 1); // Move to parent node
            return String(path.join('.'));
        }
    }

    /**
     * If the node is initialized by the rules (X.Y.Z...) then gets the next
     * id to the node. If the node is the last, then returns the same.
     *
     * If the node is not top level and is last among the siblings, then the next
     * to parent node is returned.
     *
     * @param {NodeProps[]} tree The tree in which the nodes are stored.
     * @param {string} nodeId The nodeId to get the next node for.
     * @param {boolean} recursive If set true then its called recursive and wont jum into children.
     * @return The next nodeId.
     */
    private static nextNode(tree: NodeProps[], nodeId: string, recursive: boolean = false): string {
        if ( !recursive ) {
            // If has child, then return the first.
            let node = Tree.nodeSelector(tree, nodeId);
            if (node.state.expanded && node.nodes) {
                return node.nodes[0].nodeId;
            }
        }

        // Select the next sibling node
        let path = Tree.nodeIdSplit(nodeId);

        // Top level
        if ( path.length === 1 ) {
            if ( path[0] < tree.length - 1 ) {
                return String(path[0] + 1);
            } else {
                return nodeId;
            }
        }

        let parentNode = this.parentNodeSelector(tree, nodeId);

        // Not top level
        if ( path[path.length - 1] < parentNode.nodes.length - 1 ) {
            path[path.length - 1] += 1; // Move to next
            return String(path.join('.'));
        } else {
            return Tree.nextNode(tree, parentNode.nodeId, true);
        }

    }

    /**
     * Renders the tree element.
     *
     * @returns {JSX.Element}
     */
    public render(): JSX.Element {

        let areaLabel = null;
        if ( this.props.treeLabelId ) {
            areaLabel = {'aria-labelledby': this.props.treeLabelId};
        }

        return (
            <React.Fragment>
                <ul
                    className="Tree"
                    {...areaLabel}
                    role={'tree'}
                >
                    {Node.renderSublist(this.props.data, this.parentData)}
                </ul>
                <style>
                    {Tree.generateIndentCSS(Tree.getDepth(this.props.data))}
                </style>
            </React.Fragment>
        );
    }

    /**
     * Captures keydown events and allows to navigate trough the tree.
     * @param event The keydown event.
     */
    @keydown(ENTER, UP, DOWN, LEFT, RIGHT, HOME, END, 106)
    // @ts-ignore
    private keyDown(event: keydown) {
        let node: NodeProps = null;

        switch ( event.which ) {
            case ENTER:
                node = Tree.nodeSelector(this.props.data, this.focusedNodeId);
                this.changeSelect(node);
                break;
            case UP:
                this.focusedNodeId = Tree.previousNode(this.props.data, this.focusedNodeId);
                node = Tree.nodeSelector(this.props.data, this.focusedNodeId);
                Tree.setFocus(node);
                break;
            case DOWN:
                this.focusedNodeId = Tree.nextNode(this.props.data, this.focusedNodeId);
                node = Tree.nodeSelector(this.props.data, this.focusedNodeId);
                Tree.setFocus(node);
                break;
            case LEFT:
                node = Tree.nodeSelector(this.props.data, this.focusedNodeId);
                this.changeExpand(node, false);
                break;
            case RIGHT:
                node = Tree.nodeSelector(this.props.data, this.focusedNodeId);
                this.changeExpand(node, true);
                break;
            case HOME:
                this.focusedNodeId = this.props.data[0].nodeId;
                node = Tree.nodeSelector(this.props.data, this.focusedNodeId);
                Tree.setFocus(node);
                break;
            case END:
                this.focusedNodeId = this.props.data[this.props.data.length - 1].nodeId;
                node = Tree.nodeSelector(this.props.data, this.focusedNodeId);
                Tree.setFocus(node);
                break;
            case 106:
                let siblings = Tree.siblingsNodeSelector(this.props.data, this.focusedNodeId);
                for ( let sibling of siblings ) {
                    this.changeExpand(sibling, true);
                }
                break;
            default:
                console.error('Invalid key in keydown event.');
        }
    }

    /**
     * Constructor.
     * @param {TreeProps} props
     */
    private constructor(props: TreeProps) {
        super(props);

        // Default values
        this.selectedNode = null;

        // The default focus is on the first node.
        this.focusedNodeId = this.props.data[0].nodeId;

        this.changeCheckbox = this.changeCheckbox.bind(this);
        this.changeExpand = this.changeExpand.bind(this);
        this.changeSelect = this.changeSelect.bind(this);
        this.lazyLoad = this.lazyLoad.bind(this);
        this.initSelectedNode = this.initSelectedNode.bind(this);

        this.parentData = {
            // Callbacks
            checkboxOnChange: this.changeCheckbox,
            expandOnChange: this.changeExpand,
            selectOnChange: this.changeSelect,
            onLazyLoad: this.lazyLoad,
            showCheckbox: this.props.showCheckbox,
            initSelectedNode: this.initSelectedNode,

            // Icons
            showIcon: this.props.showIcon,
            showImage: this.props.showImage,
            nodeIcon: this.props.nodeIcon,
            checkedIcon: this.props.checkedIcon,
            uncheckedIcon: this.props.uncheckedIcon,
            partiallyCheckedIcon: this.props.partiallyCheckedIcon,
            collapseIcon: this.props.collapseIcon,
            expandIcon: this.props.expandIcon,
            loadingIcon: this.props.loadingIcon,
            errorIcon: this.props.errorIcon,
            selectedIcon: this.props.selectedIcon,

            // Styling
            changedCheckboxClass: this.props.changedCheckboxClass,
            selectedClass: this.props.selectedClass,

            // Accessibility
            accessibility: this.props.accessibility,

            // Other
            checkboxFirst: this.props.checkboxFirst,
        };
    }

    /**
     * Uses recurse to update all parent if a checkbox is changed.
     * Iterates over all children to determine the parent state.
     *
     * @param {boolean} checked The new state of the child.
     * @param {NodeProps} node The child node.
     */
    private parentCheckboxChange(checked: boolean, node: NodeProps): void {
        let idArr = node.nodeId.split('.');

        // Root node
        if ( idArr.length === 1 ) { return; }

        // Others:
        idArr.splice(-1, 1);
        const parentID = idArr.join('.');
        let parentNode = Tree.nodeSelector(this.props.data, parentID);

        let state = false;
        let checkedCounter = 0;
        for (let i = 0; i < parentNode.nodes.length; i++) {
            let currState = parentNode.nodes[i].state.checked;

            // If even one is partially selected then the parent will be too.
            if ( currState === null ) {
                state = null;
                break;

            // Otherwise we start to count the number of selected boxes.
            } else if ( currState === true ) {
                checkedCounter++;
            }
        }

        // If stayed unselected then was no partially selected.
        if ( state === false ) {
            if (checkedCounter === parentNode.nodes.length) {
                state = true;
            } else if (checkedCounter > 0) {
                state = null;
            }
        }

        if ( parentNode.state.checked !== state ) {
            this.props.onDataChange(parentNode.nodeId, 'state.checked', state);
        }

        return this.parentCheckboxChange(state, parentNode);
    }

    /**
     * Changes the sate of the node and all children recursively.
     * Calls onDataChange for each change.
     *
     * @param {boolean} checked The new state of the node.
     * @param {NodeProps} node The node to change the state.
     * @param {boolean} directlyChanged Defines if changed by user or just the recursive call.
     */
    private nodeCheckboxChange(checked: boolean, node: NodeProps, directlyChanged: boolean = false): void {
        this.props.onDataChange(node.nodeId, 'state.checked', checked);

        if ( directlyChanged && this.props.hierarchicalCheck ) {
            this.parentCheckboxChange(checked, node);
        }

        if ( node.nodes ) {
            if ( this.props.hierarchicalCheck ) {

                // Set checkbox state for all children nodes.
                for (let i = 0; i < node.nodes.length; i++) {
                    this.nodeCheckboxChange(checked, node.nodes[i]);
                }
            }
        }
    }

    /**
     * Handles checkbox change if made on checkbox.
     *
     * @param {NodeProps} node The node which checkbox was changed.
     * @param {boolean} checked The checkbox new state.
     */
    private changeCheckbox(node: NodeProps, checked: boolean): void {
        if ( node.checkable === undefined ) {
            node.checkable = Node.defaultProps.checkable;
        }

        if ( !node.checkable || node.state.disabled ) {
            return;
        }

        this.nodeCheckboxChange(checked, node, true);
    }

    /**
     * Handles the expanding and collapsing elements.
     * Passes to the onDataChange function.
     *
     * @param {NodeProps} node The node which has changed.
     * @param {boolean} expanded The new expanded state
     */
    private changeExpand(node: NodeProps, expanded: boolean): void {
        if ( node.lazyLoad && !node.nodes ) {
            this.lazyLoad(node.nodeId);
        }

        this.props.onDataChange(node.nodeId, 'state.expanded', expanded);
    }

    /**
     * When constructing the node this function is called if the node is selected.
     * If more than one node is selected and multi-select is not allowed then the first one
     * will be kept, the others will be unselected.
     *
     * @param {string} nodeId The nodeId of the currently rendering node.
     */
    private initSelectedNode(nodeId: string): void {
        if ( !this.props.multiSelect ) {
            if ( this.selectedNode != null ) {
                this.props.onDataChange(nodeId, 'state.selected', false);
            } else {
                this.selectedNode = nodeId;
            }
        }
    }

    /**
     * If node is selected then checks if multi-select is active.
     * If not active and another node is currently selected, then deselects it.
     * Calls the callback for change the selected nodes.
     *
     * If preventDeselect is active then all deselecting actions are skipped.
     *
     * @param {NodeProps} node The node which was selected/deselected.
     */
    private changeSelect(node: NodeProps): void {
        if ( node.selectable === undefined ) {
            node.selectable = Node.defaultProps.selectable;
        }

        if ( !node.selectable || node.state.disabled ) {
            return;
        }

        let selected = !node.state.selected;

        // Preventing deselect but if re-select is active then simulating select.
        if ( this.props.preventDeselect && !selected ) {
            if ( this.props.allowReselect ) {
                this.props.onDataChange(node.nodeId, 'state.selected', true);
            }
        } else if ( !this.props.multiSelect && selected ) {

            // Deselect previous
            if ( this.selectedNode != null ) {
                this.props.onDataChange(this.selectedNode, 'state.selected', false);
            }
            // Select the new
            this.props.onDataChange(node.nodeId, 'state.selected', true);
            this.selectedNode = node.nodeId;

        } else {
            this.props.onDataChange(node.nodeId, 'state.selected', selected);
            this.selectedNode = null;
        }
    }

    /**
     * Handles when node has to be loaded. This occur once for node if expanded.
     *
     * @param {string} nodeId The node nodeId which is about lazy load.
     */
    private lazyLoad(nodeId: string): void {
        let node = Tree.nodeSelector(this.props.data, nodeId);

        // If not function defined return empty and set to error
        if ( this.props.lazyLoad == null ) {
            this.props.onDataChange(nodeId, 'nodes', []);
            this.props.onDataChange(nodeId, 'loading', null);
            return;
        }

        // Add loading icon
        this.props.onDataChange(nodeId, 'loading', true);

        this.props.lazyLoad(node).then((data: NodeProps[]) => {
            this.props.onDataChange(nodeId, 'nodes', data);

            // Remove loading icon
            this.props.onDataChange(nodeId, 'loading', false);
        }, () => {
            // Add error icon
            this.props.onDataChange(nodeId, 'loading', null);
        });
    }
}

/**
 * Tree default values.
 */
Tree.defaultProps = {
    data: [],

    // Checkbox
    showCheckbox: false,
    hierarchicalCheck: false,
    checkboxFirst: true,

    // Selection
    multiSelect: false,
    preventDeselect: false,
    allowReselect: false,

    // Icons
    showIcon: true,
    showImage: true,
    nodeIcon: 'fa fa-ban',
    checkedIcon: 'fa fa-check-square',
    uncheckedIcon: 'fa fa-square-o',
    partiallyCheckedIcon: 'fa fa-square',
    collapseIcon: 'fa fa-angle-down',
    expandIcon: 'fa fa-angle-right',
    loadingIcon: 'fa fa-spinner fa-spin',
    errorIcon: 'fa-exclamation-triangle',
    selectedIcon: 'fa fa-check',

    // Styling
    changedCheckboxClass: 'changed-checkbox',
    selectedClass: 'selected',

    // Accessibility
    treeLabelId: '',
    accessibility: true,

    // Callbacks
    onDataChange: null,
    lazyLoad: null,
};
