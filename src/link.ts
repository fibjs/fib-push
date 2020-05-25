export interface LinkedNode<T = any> {
    data: T;
    next?: LinkedNode;
    prev?: LinkedNode;
}

export default interface Link<DT> {
    (): void
    head(): LinkedNode<DT>;
    tail(): LinkedNode<DT>;
    count(): number;
    addHead(data: any): LinkedNode<DT>;
    addTail(data: any): LinkedNode<DT>;
    remove(node: LinkedNode<DT>): number;
    toJSON(): DT[];
}

export default function Link<DT = any>(this: Link<DT>) {
    let _head: LinkedNode<DT>,
        _tail: LinkedNode<DT>;
    let _count: number = 0;

    this.head = () => _head;
    this.tail = () => _tail;
    this.count = (): number => _count;
    
    this.addHead = (data: DT) => {
        const node: LinkedNode<DT> = {
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
        const node: LinkedNode<DT> = {
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

    this.remove = (node: LinkedNode<DT>): number => {
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
