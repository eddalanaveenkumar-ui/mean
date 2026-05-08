/**
 * DSA Roadmap — Complete Data Structure
 * Each node has: id, title, category, coordinates, subtopics, connections
 */

// Color palette for categories
export const CATEGORY_COLORS = {
  foundations: { bg: '#3b82f6', glow: 'rgba(59,130,246,0.3)', text: '#dbeafe' },
  dataStructures: { bg: '#10b981', glow: 'rgba(16,185,129,0.3)', text: '#d1fae5' },
  algorithms: { bg: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', text: '#ede9fe' },
  advanced: { bg: '#ef4444', glow: 'rgba(239,68,68,0.3)', text: '#fee2e2' },
};

export const DSA_NODES = [
  // ═══════════════════════════════════════
  // SECTION 1: BASIC FOUNDATIONS
  // ═══════════════════════════════════════
  {
    id: 'foundations',
    title: '1. Basic Foundations',
    category: 'foundations',
    x: 100, y: 60,
    isSection: true,
    subtopics: [
      { name: 'Variables', desc: 'Storing and manipulating data' },
      { name: 'Loops', desc: 'for, while, do-while iterations' },
      { name: 'Functions', desc: 'Reusable blocks of code' },
      { name: 'Recursion', desc: 'Functions calling themselves' },
      { name: 'Time Complexity', desc: 'How fast an algorithm runs' },
      { name: 'Space Complexity', desc: 'How much memory it uses' },
    ],
    complexity: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
  },

  // ═══════════════════════════════════════
  // SECTION 2: DATA STRUCTURES
  // ═══════════════════════════════════════
  {
    id: 'arrays',
    title: 'Arrays',
    category: 'dataStructures',
    x: 100, y: 220,
    order: 1,
    subtopics: [
      { name: 'Traversal', desc: 'Visiting every element' },
      { name: 'Insertion', desc: 'Adding elements at any position' },
      { name: 'Deletion', desc: 'Removing elements' },
      { name: 'Rotation', desc: 'Shifting elements left/right' },
      { name: 'Prefix Sum', desc: 'Cumulative sum arrays' },
      { name: 'Sliding Window', desc: 'Fixed/variable size window technique' },
      { name: "Kadane's Algorithm", desc: 'Maximum subarray sum in O(n)' },
      { name: 'Two Pointers', desc: 'Optimizing with start/end pointers' },
    ],
  },
  {
    id: 'strings',
    title: 'Strings',
    category: 'dataStructures',
    x: 380, y: 220,
    order: 2,
    subtopics: [
      { name: 'String Matching', desc: 'Finding patterns in text' },
      { name: 'Palindrome', desc: 'Strings that read same forwards & backwards' },
      { name: 'Anagrams', desc: 'Rearranging letters to form words' },
      { name: 'Pattern Searching', desc: 'Efficient substring search' },
      { name: 'Rabin-Karp', desc: 'Hash-based pattern matching' },
      { name: 'KMP', desc: 'Knuth-Morris-Pratt algorithm' },
      { name: 'Z Algorithm', desc: 'Linear time pattern matching' },
    ],
  },
  {
    id: 'linkedlist',
    title: 'Linked List',
    category: 'dataStructures',
    x: 660, y: 220,
    order: 6,
    subtopics: [
      { name: 'Singly Linked List', desc: 'Nodes with next pointer' },
      { name: 'Doubly Linked List', desc: 'Nodes with next & prev pointers' },
      { name: 'Circular Linked List', desc: 'Last node points to first' },
    ],
    algorithms: ['Reverse', 'Detect Cycle', 'Merge Lists', 'Find Middle', 'Remove Nth Node'],
  },
  {
    id: 'stack',
    title: 'Stack',
    category: 'dataStructures',
    x: 940, y: 220,
    order: 7,
    subtopics: [
      { name: 'Push', desc: 'Add element to top' },
      { name: 'Pop', desc: 'Remove element from top' },
      { name: 'Infix to Postfix', desc: 'Expression conversion' },
      { name: 'Balanced Parentheses', desc: 'Check valid brackets' },
      { name: 'Monotonic Stack', desc: 'Maintaining sorted order' },
      { name: 'Next Greater Element', desc: 'Find next larger element' },
    ],
  },
  {
    id: 'queue',
    title: 'Queue',
    category: 'dataStructures',
    x: 1220, y: 220,
    order: 8,
    subtopics: [
      { name: 'Simple Queue', desc: 'FIFO data structure' },
      { name: 'Circular Queue', desc: 'Wrap-around queue' },
      { name: 'Deque', desc: 'Double-ended queue' },
      { name: 'Priority Queue', desc: 'Elements with priority' },
    ],
    algorithms: ['BFS', 'Sliding Window Maximum'],
  },
  {
    id: 'hashmap',
    title: 'HashMap',
    category: 'dataStructures',
    x: 100, y: 400,
    order: 9,
    subtopics: [
      { name: 'Hash Tables', desc: 'Key-value storage' },
      { name: 'Frequency Counting', desc: 'Count occurrences' },
      { name: 'Collision Handling', desc: 'Chaining & open addressing' },
      { name: 'HashSet', desc: 'Unique element storage' },
      { name: 'HashMap', desc: 'Key-value pairs' },
    ],
  },
  {
    id: 'trees',
    title: 'Trees',
    category: 'dataStructures',
    x: 380, y: 400,
    order: 10,
    subtopics: [
      { name: 'Binary Tree', desc: 'Each node has at most 2 children' },
      { name: 'BST', desc: 'Binary Search Tree — sorted structure' },
      { name: 'AVL Tree', desc: 'Self-balancing BST' },
      { name: 'Segment Tree', desc: 'Range query data structure' },
      { name: 'Fenwick Tree', desc: 'Binary Indexed Tree' },
      { name: 'Trie', desc: 'Prefix tree for strings' },
    ],
    algorithms: ['Traversals (In/Pre/Post)', 'DFS', 'Height', 'Diameter', 'LCA', 'Serialization'],
  },
  {
    id: 'heap',
    title: 'Heap',
    category: 'dataStructures',
    x: 660, y: 400,
    order: 11,
    subtopics: [
      { name: 'Min Heap', desc: 'Smallest element at root' },
      { name: 'Max Heap', desc: 'Largest element at root' },
    ],
    algorithms: ['Heapify', 'Insert/Delete', 'Heap Sort', 'Priority Queue Problems'],
  },
  {
    id: 'graphs',
    title: 'Graphs',
    category: 'dataStructures',
    x: 940, y: 400,
    order: 12,
    subtopics: [
      { name: 'Directed Graph', desc: 'Edges have direction' },
      { name: 'Undirected Graph', desc: 'Edges are bidirectional' },
      { name: 'Weighted Graph', desc: 'Edges have weights' },
      { name: 'DAG', desc: 'Directed Acyclic Graph' },
    ],
    algorithms: ['BFS', 'DFS', 'Dijkstra', 'Bellman Ford', 'Floyd Warshall', 'Topological Sort', 'MST', "Kruskal's", "Prim's", 'Union Find'],
  },
  {
    id: 'trie',
    title: 'Trie',
    category: 'dataStructures',
    x: 1220, y: 400,
    subtopics: [
      { name: 'Prefix Search', desc: 'Find words starting with prefix' },
      { name: 'Autocomplete', desc: 'Suggest completions' },
      { name: 'Word Search', desc: 'Search in dictionary' },
    ],
  },

  // ═══════════════════════════════════════
  // SECTION 3: ALGORITHMS
  // ═══════════════════════════════════════
  {
    id: 'searching',
    title: 'Searching',
    category: 'algorithms',
    x: 100, y: 580,
    order: 5,
    subtopics: [
      { name: 'Linear Search', desc: 'Check every element — O(n)' },
      { name: 'Binary Search', desc: 'Divide and conquer — O(log n)' },
      { name: 'Ternary Search', desc: 'Split into 3 parts' },
    ],
    complexity: ['O(log n)'],
  },
  {
    id: 'sorting',
    title: 'Sorting',
    category: 'algorithms',
    x: 380, y: 580,
    order: 4,
    subtopics: [
      { name: 'Bubble Sort', desc: 'Compare adjacent elements — O(n²)' },
      { name: 'Selection Sort', desc: 'Find min and swap — O(n²)' },
      { name: 'Insertion Sort', desc: 'Insert in sorted position — O(n²)' },
      { name: 'Merge Sort', desc: 'Divide & merge — O(n log n)' },
      { name: 'Quick Sort', desc: 'Partition around pivot — O(n log n)' },
      { name: 'Heap Sort', desc: 'Using heap structure — O(n log n)' },
      { name: 'Counting Sort', desc: 'Non-comparison — O(n+k)' },
      { name: 'Radix Sort', desc: 'Digit by digit — O(nk)' },
    ],
  },
  {
    id: 'recursion-backtracking',
    title: 'Recursion & Backtracking',
    category: 'algorithms',
    x: 660, y: 580,
    order: 3,
    subtopics: [
      { name: 'N Queens', desc: 'Place N queens on NxN board' },
      { name: 'Sudoku Solver', desc: 'Fill 9x9 grid following rules' },
      { name: 'Rat in Maze', desc: 'Find path from source to destination' },
      { name: 'Permutations', desc: 'All possible arrangements' },
      { name: 'Subsets', desc: 'All possible subsets (power set)' },
    ],
  },
  {
    id: 'greedy',
    title: 'Greedy Algorithms',
    category: 'algorithms',
    x: 940, y: 580,
    order: 13,
    subtopics: [
      { name: 'Activity Selection', desc: 'Max non-overlapping activities' },
      { name: 'Huffman Coding', desc: 'Optimal prefix codes' },
      { name: 'Fractional Knapsack', desc: 'Maximize value with weight limit' },
      { name: 'Job Scheduling', desc: 'Schedule jobs to minimize delay' },
    ],
  },
  {
    id: 'dp',
    title: 'Dynamic Programming',
    category: 'algorithms',
    x: 1220, y: 580,
    order: 15,
    isImportant: true,
    subtopics: [
      { name: 'Memoization', desc: 'Top-down with caching' },
      { name: 'Tabulation', desc: 'Bottom-up table filling' },
      { name: 'Knapsack', desc: '0/1 and unbounded variants' },
      { name: 'LIS', desc: 'Longest Increasing Subsequence' },
      { name: 'LCS', desc: 'Longest Common Subsequence' },
      { name: 'Matrix Chain', desc: 'Optimal parenthesization' },
      { name: 'DP on Trees', desc: 'Dynamic programming on tree structures' },
      { name: 'Bitmask DP', desc: 'DP using bitmask subsets' },
    ],
  },
  {
    id: 'graph-algos',
    title: 'Graph Algorithms',
    category: 'algorithms',
    x: 100, y: 760,
    subtopics: [
      { name: 'BFS', desc: 'Breadth-First Search' },
      { name: 'DFS', desc: 'Depth-First Search' },
      { name: 'Dijkstra', desc: 'Shortest path — weighted graph' },
      { name: 'Bellman Ford', desc: 'Shortest path — negative edges' },
      { name: 'Floyd Warshall', desc: 'All-pairs shortest paths' },
      { name: 'A*', desc: 'Heuristic-based pathfinding' },
      { name: 'Topological Sort', desc: 'Linear ordering of DAG' },
    ],
  },
  {
    id: 'bit-manipulation',
    title: 'Bit Manipulation',
    category: 'algorithms',
    x: 380, y: 760,
    subtopics: [
      { name: 'XOR', desc: 'Exclusive OR operations' },
      { name: 'AND / OR', desc: 'Bitwise logical operations' },
      { name: 'Left Shift / Right Shift', desc: 'Multiply/divide by powers of 2' },
      { name: 'Bitmasking', desc: 'Subset representation with bits' },
    ],
  },

  // ═══════════════════════════════════════
  // SECTION 4: ADVANCED DSA
  // ═══════════════════════════════════════
  {
    id: 'advanced',
    title: '4. Advanced DSA',
    category: 'advanced',
    x: 660, y: 760,
    isSection: true,
    subtopics: [
      { name: 'Segment Tree', desc: 'Range queries & updates' },
      { name: 'Fenwick Tree', desc: 'Binary Indexed Tree' },
      { name: 'Sparse Table', desc: 'Immutable range min/max queries' },
      { name: 'DSU (Union Find)', desc: 'Disjoint Set operations' },
      { name: 'Red Black Tree', desc: 'Self-balancing BST' },
      { name: 'B Tree', desc: 'Multi-way search tree' },
      { name: 'Suffix Array', desc: 'Sorted suffixes for pattern matching' },
      { name: 'Suffix Tree', desc: 'Compressed trie of all suffixes' },
    ],
  },
];

// ═══════════════════════════════════════
// CONNECTIONS (arrows between nodes)
// Learning order: Arrays→Strings→Recursion→Sorting→Searching→LinkedList→Stack→Queue→HashMap→Trees→Heap→Graphs→Greedy→Backtracking→DP→Advanced
// ═══════════════════════════════════════
export const DSA_CONNECTIONS = [
  // Foundations → Data Structures
  { from: 'foundations', to: 'arrays', label: 'Start Here' },

  // Learning order connections
  { from: 'arrays', to: 'strings', label: '1→2' },
  { from: 'strings', to: 'recursion-backtracking', label: '2→3' },
  { from: 'recursion-backtracking', to: 'sorting', label: '3→4' },
  { from: 'sorting', to: 'searching', label: '4→5' },
  { from: 'searching', to: 'linkedlist', label: '5→6' },
  { from: 'linkedlist', to: 'stack', label: '6→7' },
  { from: 'stack', to: 'queue', label: '7→8' },
  { from: 'queue', to: 'hashmap', label: '8→9' },
  { from: 'hashmap', to: 'trees', label: '9→10' },
  { from: 'trees', to: 'heap', label: '10→11' },
  { from: 'heap', to: 'graphs', label: '11→12' },
  { from: 'graphs', to: 'greedy', label: '12→13' },
  { from: 'greedy', to: 'dp', label: '13→15' },
  { from: 'dp', to: 'advanced', label: '15→Advanced' },

  // Cross-connections (related topics)
  { from: 'trees', to: 'trie', label: 'Related', dashed: true },
  { from: 'graphs', to: 'graph-algos', label: 'Algorithms', dashed: true },
  { from: 'dp', to: 'bit-manipulation', label: 'Bitmask DP', dashed: true },
];

// Best learning order
export const LEARNING_ORDER = [
  'arrays', 'strings', 'recursion-backtracking', 'sorting', 'searching',
  'linkedlist', 'stack', 'queue', 'hashmap', 'trees', 'heap', 'graphs',
  'greedy', 'recursion-backtracking', 'dp', 'advanced', 'graph-algos'
];
