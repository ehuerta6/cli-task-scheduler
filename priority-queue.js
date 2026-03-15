const PRIORITY_VALUE = { high: 3, medium: 2, low: 1 };

export class PriorityQueue {
  #heap = [];

  get size() {
    return this.#heap.length;
  }

  push(task) {
    this.#heap.push(task);
    this.#bubbleUp(this.#heap.length - 1);
  }

  peek() {
    return this.#heap[0] ?? null;
  }

  pop() {
    if (this.#heap.length === 0) return null;

    this.#swap(0, this.#heap.length - 1);

    const top = this.#heap.pop();

    this.#bubbleDown(0);

    return top;
  }

  toArray() {
    return [...this.#heap];
  }

  fromArray(arr) {
    this.#heap = [...(Array.isArray(arr) ? arr : [])];
    const lastParent = Math.floor(this.#heap.length / 2) - 1;
    for (let i = lastParent; i >= 0; i--) {
      this.#bubbleDown(i);
    }
  }

  #priority(task) {
    return PRIORITY_VALUE[task.priority] ?? 0;
  }

  #swap(i, j) {
    [this.#heap[i], this.#heap[j]] = [this.#heap[j], this.#heap[i]];
  }

  #bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);

      if (
        this.#priority(this.#heap[parent]) >= this.#priority(this.#heap[index])
      ) {
        break;
      }

      this.#swap(parent, index);
      index = parent;
    }
  }

  #bubbleDown(index) {
    const length = this.#heap.length;

    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let largest = index;

      if (
        left < length &&
        this.#priority(this.#heap[left]) > this.#priority(this.#heap[largest])
      ) {
        largest = left;
      }

      if (
        right < length &&
        this.#priority(this.#heap[right]) > this.#priority(this.#heap[largest])
      ) {
        largest = right;
      }

      if (largest === index) break;

      this.#swap(index, largest);
      index = largest;
    }
  }
}
