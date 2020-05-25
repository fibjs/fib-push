export interface LinkedNode<T = any> {
    data: T;
    next?: LinkedNode;
    prev?: LinkedNode;
}
export default interface Link<DT> {
    (): void;
    head(): LinkedNode<DT>;
    tail(): LinkedNode<DT>;
    count(): number;
    addHead(data: any): LinkedNode<DT>;
    addTail(data: any): LinkedNode<DT>;
    remove(node: LinkedNode<DT>): number;
    toJSON(): DT[];
}
export default function Link<DT = any>(this: Link<DT>): void;
