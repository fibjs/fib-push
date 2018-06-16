### Link

Link is one simple linkedList.

#### Sample

```javascript
// Return `Link`'s first node
var headNode = link.head()

// add one node with **data** as head to `Link`, and return it
var headNode = link.addHead('foo')
var headNode = link.addHead({foo: 'bar')

// Return `Link`'s last Node
var tailNode = link.tail()
// add one node as tail to `Link`, and return it
var listCount = link.addTail('foo')
var listCount = link.addTail({foo: 'bar')

// remove node in `Link`, then return count of `Link`
var node = link.tail()
link.remove(node)

// return all node in `Link` as list
var nodeList = link.toJSON()
```
---
