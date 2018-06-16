/// <reference path="../@types/index.d.ts" />

export default function<DT = any> () {
    let _head: LinkedNode<DT>, _tail: LinkedNode<DT>;
    let _count: number = 0;

    this.head = (): LinkedNode<DT> => {
        return _head;
    }

    this.tail = (): LinkedNode<DT> => {
        return _tail;
    }

    this.count = (): number => {
        return _count;
    }

    this.addHead = (data: DT): LinkedNode<DT> => {
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

    this.addTail = (data: DT): LinkedNode<DT> => {
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
        var a = [];

        var node = _head;
        while (node !== undefined) {
            a.push(node.data);
            node = node.next;
        }
        return a;
    }
}
