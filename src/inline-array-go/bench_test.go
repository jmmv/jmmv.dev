package main

import (
	"fmt"
	"testing"
)

func fillTree(n *node, nnodes i) {
	if nnodes > 0 {

	}
}

func BenchmarkSumTree(b *testing.B) {
	for i := 1; i < inlineValues*2; i++ {
		b.Run(fmt.Sprintf("%d", i), func(b *testing.B) {
			tree := makeBalancedTree(12, i)
			sumTree(tree)
		})
	}
}
