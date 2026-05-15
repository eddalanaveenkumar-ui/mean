// Topic-specific TOON diagram templates for offline/fallback mode
// Each returns raw TOON string with real teaching content

const TOPIC_TEMPLATES = {
  // ═══ DSA ═══
  'array': `---
type: config
topic: Arrays
category: dsa
---
type: diagram
title: Array — Contiguous Memory Storage
width: 600
height: 320
>element
  kind: text
  x: 300
  y: 22
  label: Array: Fixed-size, indexed data structure
  color: #c4b5fd
  fontSize: 14
  bold: true
  anchor: middle
  step: 0
>element
  kind: text
  x: 30
  y: 55
  label: Index:
  color: #888
  fontSize: 10
  step: 0
>element
  kind: text
  x: 100
  y: 55
  label: 0        1        2        3        4
  color: #a78bfa
  fontSize: 10
  mono: true
  step: 0
>element
  kind: box
  x: 80
  y: 65
  w: 70
  h: 50
  label: 10
  color: #8b5cf6
  step: 1
>element
  kind: box
  x: 160
  y: 65
  w: 70
  h: 50
  label: 25
  color: #8b5cf6
  step: 1
>element
  kind: box
  x: 240
  y: 65
  w: 70
  h: 50
  label: 37
  color: #8b5cf6
  step: 1
>element
  kind: box
  x: 320
  y: 65
  w: 70
  h: 50
  label: 42
  color: #8b5cf6
  step: 2
>element
  kind: box
  x: 400
  y: 65
  w: 70
  h: 50
  label: 58
  color: #8b5cf6
  step: 2
>element
  kind: text
  x: 30
  y: 150
  label: Key Properties:
  color: #f59e0b
  fontSize: 12
  bold: true
  step: 3
>element
  kind: text
  x: 30
  y: 172
  label: • O(1) access by index
  color: #ccc
  fontSize: 11
  step: 3
>element
  kind: text
  x: 30
  y: 192
  label: • O(n) insert/delete (shifting)
  color: #ccc
  fontSize: 11
  step: 3
>element
  kind: text
  x: 30
  y: 212
  label: • Fixed size in static arrays
  color: #ccc
  fontSize: 11
  step: 4
>element
  kind: text
  x: 300
  y: 172
  label: Memory Layout:
  color: #10b981
  fontSize: 12
  bold: true
  step: 4
>element
  kind: text
  x: 300
  y: 192
  label: [0x100][0x104][0x108][0x10C]
  color: #34d399
  fontSize: 10
  mono: true
  step: 4
>element
  kind: text
  x: 300
  y: 212
  label: Contiguous memory → fast cache access
  color: #888
  fontSize: 10
  step: 4
>element
  kind: highlight
  x: 275
  y: 90
  r: 40
  color: #f59e0b
  step: 5
---
type: step
title: What is an Array?
index: -1
code: int arr[5] = {10, 25, 37, 42, 58};
explain: An array is a collection of elements stored in contiguous (side-by-side) memory locations. Each element is accessed using an index starting from 0.
example: Think of numbered mailboxes in a row — each box has a number and holds one item.
chat: 👋 Let's learn Arrays! Imagine a row of numbered boxes, each holding a value.
---
type: step
title: Accessing Elements — O(1)
index: 0
code: arr[2] → 37  // Direct jump using base + offset
explain: Array access is O(1) because the computer calculates the exact memory address using base_address + (index × element_size). No scanning needed!
example: Like knowing your locker number — you walk straight to it, no searching.
chat: The magic of arrays! arr[2] gives 37 instantly because the CPU calculates the address directly.
---
type: step
title: Adding More Elements
index: 1
code: arr[3] = 42; arr[4] = 58;
explain: Elements are stored one after another in memory. Adding to the end is fast, but inserting in the middle requires shifting everything after it.
example: Like inserting a person in a queue — everyone behind them has to step back.
chat: See how 42 and 58 fill the next boxes? That's O(1) at the end. But inserting at index 1? O(n) shifting!
---
type: step
title: Key Properties
index: -1
code: Access: O(1) | Search: O(n) | Insert: O(n)
explain: Arrays give instant access by index but searching for a value requires scanning. Insert/delete at arbitrary positions costs O(n) due to shifting.
example: Fast to grab book #3 from a shelf, but slow to find which shelf has "Harry Potter."
chat: ⚡ Key insight: Arrays trade flexibility for speed. O(1) access is their superpower!
---
type: step
title: Memory & When to Use
index: -1
code: // Use when: fixed size, frequent reads, rare inserts
explain: Arrays use contiguous memory, which is cache-friendly and fast. Use them when you know the size upfront and mostly read data. For frequent inserts, consider linked lists.
example: Use an array for a fixed playlist, but a linked list for a dynamic to-do list.
chat: 🎯 Remember: Arrays = fast reads, slow inserts. Choose wisely based on your use case!`,

  'linked_list': `---
type: config
topic: Linked List
category: dsa
---
type: diagram
title: Singly Linked List — Dynamic Chain
width: 600
height: 300
>element
  kind: text
  x: 300
  y: 20
  label: Linked List: Nodes connected by pointers
  color: #c4b5fd
  fontSize: 14
  bold: true
  anchor: middle
  step: 0
>element
  kind: box
  x: 20
  y: 70
  w: 100
  h: 50
  label: 10
  sublabel: HEAD
  color: #8b5cf6
  step: 1
>element
  kind: arrow
  x1: 120
  y1: 95
  x2: 155
  y2: 95
  color: #8b5cf6
  step: 1
>element
  kind: box
  x: 155
  y: 70
  w: 100
  h: 50
  label: 20
  color: #8b5cf6
  step: 2
>element
  kind: arrow
  x1: 255
  y1: 95
  x2: 290
  y2: 95
  color: #8b5cf6
  step: 2
>element
  kind: box
  x: 290
  y: 70
  w: 100
  h: 50
  label: 30
  color: #8b5cf6
  step: 3
>element
  kind: arrow
  x1: 390
  y1: 95
  x2: 425
  y2: 95
  color: #8b5cf6
  step: 3
>element
  kind: pill
  x: 425
  y: 78
  w: 80
  h: 35
  label: NULL
  color: #ef4444
  step: 3
>element
  kind: text
  x: 20
  y: 160
  label: Node Structure:
  color: #f59e0b
  fontSize: 12
  bold: true
  step: 4
>element
  kind: box
  x: 20
  y: 175
  w: 80
  h: 35
  label: Data
  color: #10b981
  step: 4
>element
  kind: box
  x: 105
  y: 175
  w: 80
  h: 35
  label: Next →
  color: #3b82f6
  step: 4
>element
  kind: text
  x: 300
  y: 160
  label: Complexity:
  color: #f59e0b
  fontSize: 12
  bold: true
  step: 5
>element
  kind: text
  x: 300
  y: 180
  label: • Insert at head: O(1)
  color: #ccc
  fontSize: 11
  step: 5
>element
  kind: text
  x: 300
  y: 198
  label: • Search: O(n)
  color: #ccc
  fontSize: 11
  step: 5
>element
  kind: text
  x: 300
  y: 216
  label: • No random access
  color: #ccc
  fontSize: 11
  step: 5
---
type: step
title: What is a Linked List?
index: -1
code: struct Node { int data; Node* next; };
explain: A linked list is a chain of nodes where each node stores data AND a pointer to the next node. Unlike arrays, nodes are NOT in contiguous memory.
example: Like a treasure hunt — each clue tells you where the next clue is hidden.
chat: 👋 Linked Lists are like a chain! Each link knows where the next one is.
---
type: step
title: The HEAD Node
index: 0
code: Node* head = new Node(10);
explain: HEAD is the entry point — the first node. You MUST start here to reach any other node. Losing the head means losing the entire list!
example: Like the first page of a book — without it, you can't find anything.
chat: The HEAD node (10) is our starting point. Everything begins here!
---
type: step
title: Building the Chain
index: 1
code: head->next = new Node(20); // Link nodes
explain: Each node's "next" pointer connects to the following node. This creates a one-way chain. You can only traverse forward in a singly linked list.
example: Like a conga line — each person holds the shoulders of the person in front.
chat: See the arrows? Each node points to the next. That's how we traverse!
---
type: step
title: Node Structure
index: -1
code: [Data | Next] → [Data | Next] → NULL
explain: Each node has two parts: the DATA it stores and the NEXT pointer. The last node points to NULL, marking the end of the list.
example: Each train car has cargo (data) and a coupler (next) connecting to the next car.
chat: A node = Data + Pointer. Simple but powerful! NULL means "end of the line."
---
type: step
title: Why Use Linked Lists?
index: -1
code: Insert head: O(1) | Search: O(n) | No fixed size
explain: Linked lists shine at dynamic insertions — just change pointers! No shifting needed. But you sacrifice random access. Use when size is unknown or insertions are frequent.
example: Easy to add a new car to a train, but finding car #50 means walking through all of them.
chat: ⚡ Key: O(1) insert at head, O(n) search. Arrays give O(1) access. Choose based on your needs!`,

  'binary_search_tree': `---
type: config
topic: Binary Search Tree
category: dsa
---
type: diagram
title: BST — Ordered Binary Tree
width: 600
height: 320
>element
  kind: text
  x: 300
  y: 18
  label: Binary Search Tree: Left < Root < Right
  color: #c4b5fd
  fontSize: 14
  bold: true
  anchor: middle
  step: 0
>element
  kind: circle
  x: 300
  y: 70
  r: 25
  label: 50
  color: #8b5cf6
  fontSize: 14
  step: 1
>element
  kind: line
  x1: 280
  y1: 90
  x2: 200
  y2: 130
  color: #8b5cf6
  step: 2
>element
  kind: line
  x1: 320
  y1: 90
  x2: 400
  y2: 130
  color: #8b5cf6
  step: 2
>element
  kind: circle
  x: 200
  y: 150
  r: 22
  label: 30
  color: #3b82f6
  fontSize: 13
  step: 2
>element
  kind: circle
  x: 400
  y: 150
  r: 22
  label: 70
  color: #10b981
  fontSize: 13
  step: 2
>element
  kind: line
  x1: 185
  y1: 168
  x2: 140
  y2: 200
  color: #3b82f6
  step: 3
>element
  kind: line
  x1: 215
  y1: 168
  x2: 260
  y2: 200
  color: #3b82f6
  step: 3
>element
  kind: circle
  x: 140
  y: 220
  r: 20
  label: 20
  color: #3b82f6
  fontSize: 12
  step: 3
>element
  kind: circle
  x: 260
  y: 220
  r: 20
  label: 40
  color: #3b82f6
  fontSize: 12
  step: 3
>element
  kind: text
  x: 30
  y: 280
  label: Search 40: 50→30→40 ✓  O(log n)
  color: #f59e0b
  fontSize: 11
  mono: true
  step: 4
>element
  kind: text
  x: 350
  y: 280
  label: Left < Parent < Right
  color: #10b981
  fontSize: 11
  bold: true
  step: 4
---
type: step
title: What is a BST?
index: -1
code: Rule: left.val < node.val < right.val
explain: A Binary Search Tree keeps elements ordered — every left child is smaller than parent, every right child is larger. This enables fast searching.
example: Like a dictionary — you don't read every word, you jump to the right half based on alphabetical order.
chat: 👋 BST = organized tree! Left is always smaller, right is always bigger.
---
type: step
title: The Root Node
index: 0
code: Node* root = new Node(50);
explain: The root (50) is the top of the tree. Every search, insert, or delete starts here. The root divides all values into two halves.
example: Like the main entrance of a building — every journey starts here.
chat: 50 is our root. Everything smaller goes left, everything bigger goes right!
---
type: step
title: Building the Tree
index: 1
code: insert(30); insert(70); // 30 < 50 → left, 70 > 50 → right
explain: 30 is less than 50, so it goes LEFT. 70 is greater, so it goes RIGHT. This ordering rule is maintained at every level.
example: Like sorting mail — letters A-M go left, N-Z go right.
chat: See? 30 went left (smaller) and 70 went right (bigger). The tree stays sorted!
---
type: step
title: Deeper Levels
index: 2
code: insert(20); insert(40); // 20<30→left, 40>30→right
explain: 20 is less than 50 AND less than 30, so it goes left-left. 40 is less than 50 but greater than 30, so left-right. Each comparison halves the search space.
example: Like 20 Questions — each answer eliminates half the possibilities.
chat: The tree grows deeper! Each level adds more precision to our organization.
---
type: step
title: Searching — O(log n)
index: -1
code: search(40): 50→left→30→right→40 ✓ (3 steps!)
explain: To find 40: start at 50 (40<50, go left), then 30 (40>30, go right), found 40! Only 3 comparisons instead of scanning all 5 elements. That's O(log n).
example: Like binary search in a phone book — flip to middle, decide which half, repeat.
chat: ⚡ BST search = O(log n)! We found 40 in just 3 steps instead of checking all 5. That's the power of ordered trees!`,
};

// Match topic text to a template key
function matchTopic(topic) {
  const t = topic.toLowerCase();
  if (/\barray\b/i.test(t)) return 'array';
  if (/linked.?list/i.test(t)) return 'linked_list';
  if (/binary.?search.?tree|bst\b/i.test(t)) return 'binary_search_tree';
  return null;
}

export function getTopicTemplate(topic) {
  const key = matchTopic(topic);
  return key ? TOPIC_TEMPLATES[key] : null;
}
