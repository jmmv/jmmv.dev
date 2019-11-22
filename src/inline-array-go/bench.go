package main

// inlineValues specifies how many array values will be allocated directly
// inside the Node struct.
const inlineValues = 4

// Node contains the data of an integer node in a tree and all descendents.
type node struct {
	value     int
	children  []*node
	children0 [inlineValues]*node
}

// newNode creates a new Node with the given value.
func newNode(v int) *node {
	n := &node{value: v}
	n.children = n.children0[:0]
	return n
}

// addChild adds a given node as a child of this node.
func (n *node) AddChild(child *node) {
	n.children = append(n.children, child)
}

// makeBalancedTree creates a balanced tree where each node has at most width
// children and where the whole tree has exactly nnodes nodes.
func makeBalancedTree(width int, nnodes int) *node {
	queue := make([]*node, 0, nnodes)

	root := newNode(1)
	queue = append(queue, root)
	nnodes--

	i := 0
	for nnodes > 0 {
		n := queue[i]
		if len(n.children) < width {
			n2 := newNode(1)
			n.AddChild(n2)
			queue = append(queue, n2)
			nnodes--
		} else {
			i++
		}
	}

	return root
}

// sumTree walks a tree depth-first and sums all the values within it.
func sumTree(n *node) int {
	total := n.value
	for _, n := range n.children {
		total += sumTree(n)
	}
	return total
}
