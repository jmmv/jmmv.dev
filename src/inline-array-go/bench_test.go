package main

import (
	"fmt"
	"testing"
)

func BenchmarkSumTree(b *testing.B) {
	for i := 2; i < inlineValues*2; i++ {
		b.Run(fmt.Sprintf("%d", i), func(b *testing.B) {
			tree := makeBalancedTree(i, 1000000)
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				sumTree(tree)
			}
		})
	}
}
