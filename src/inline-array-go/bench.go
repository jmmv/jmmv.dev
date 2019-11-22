package main

import (
	"fmt"
	"time"
)

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

// makeBalancedTree creates a tree of a given depth, with each node containing
// as many children as given in width.
func makeBalancedTree(depth int, width int) *node {
	node := newNode(1)
	if depth > 0 {
		for i := 0; i < width; i++ {
			node.AddChild(makeBalancedTree(depth-1, width))
		}
	}
	return node
}

// sumTree walks a tree depth-first and sums all the values within it.
func sumTree(n *node) int {
	total := n.value
	for _, n := range n.children {
		total += sumTree(n)
	}
	return total
}

func main() {
	before := time.Now()
	tree := makeBalancedTree(12, 4)
	fmt.Printf("Allocation: %v\n", time.Since(before))

	before = time.Now()
	fmt.Printf("Total: %d\n", sumTree(tree))
	fmt.Printf("Addition: %v\n", time.Since(before))
}
