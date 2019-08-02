export default function<DT = any> (
    this: FibPushNS.Link
) {
    let _head: FibPushNS.LinkedNode<DT>,
        _tail: FibPushNS.LinkedNode<DT>;
    let _count: number = 0;

    this.head = () => _head;
    this.tail = () => _tail;
    this.count = (): number => _count;
    
    this.addHead = (data: DT) => {
        const node: FibPushNS.LinkedNode<DT> = {
            next: _head,
            data: data
        };

        if (_head)
            _head.prev = node;
        else
            _tail = node;

        _head = node;

        _count++;

        return node;
    };

    this.addTail = (data: DT) => {
        const node: FibPushNS.LinkedNode<DT> = {
            prev: _tail,
            data: data
        };

        if (_tail)
            _tail.next = node;
        else
            _head = node;

        _tail = node;

        _count++;

        return node;
    };

    this.remove = (node: FibPushNS.LinkedNode<DT>): number => {
        if (_head === node)
            _head = node.next;
        else
            node.prev.next = node.next;

        if (_tail === node)
            _tail = node.prev;
        else
            node.next.prev = node.prev;

        _count--;

        return _count;
    };

    this.toJSON = (): DT[] => {
        const a = [];

        let node = _head;
        while (node !== undefined) {
            a.push(node.data);
            node = node.next;
        }
        return a;
    }
}
