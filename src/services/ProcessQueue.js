/**
 * ProcessQueue - A hybrid Map/Queue data structure for managing ordered processes with lookup capability
 *
 * Features:
 * - Constant-time get/has/delete operations (Map-like interface)
 * - FIFO queue with positional insert capabilities
 * - Preserves insertion order for iteration
 * - Supports inserting processes after specific parent processes
 *
 * Usage:
 * - Insert at head: enqueue(key, value, { after: null })
 * - Insert at tail: enqueue(key, value) or enqueue(key, value, {})
 * - Insert after specific key: enqueue(key, value, { after: 'parent-key' })
 */
export default class ProcessQueue {
    /** Private state */
    #store = new Map(); // key → value/promise
    #order = []; // [key, key, …] (head is index 0)
    #levels = new Map(); // key → level mapping

    /* =========================================================================
     Basic Map interface
     ========================================================================= */
    get size () { return this.#order.length; }
    has (key) { return this.#store.has(key); }
    get (key) { return this.#store.get(key); }

    /** Remove a specific key (queue + map) */
    delete (key) {
        if (!this.#store.delete(key)) return false;
        const i = this.#order.indexOf(key);

        if (i !== -1) this.#order.splice(i, 1);
        this.#levels.delete(key);

        return true;
    }

    /** Clear all entries */
    clear () {
        this.#store.clear();
        this.#order.length = 0;
        this.#levels.clear();
    }

    /**
     * Set the level for a specific process key
     * @param {string} key - The process key
     * @param {number} level - The level to assign to the process
     */
    setLevelToProcess (key, level) {
        this.#levels.set(key, level);
    }

    /* =========================================================================
     Queue helpers
     ========================================================================= */
    /** FIFO pop ➜ { key, value } or undefined if empty */
    dequeue () {
        if (this.#order.length === 0) return;
        const key = this.#order.shift();
        const value = this.#store.get(key);

        this.#store.delete(key);

        return { key, value };
    }

    /** Look at the first entry without removing it */
    peek () {
        const key = this.#order[0];

        return key ? { key, value: this.#store.get(key) } : undefined;
    }

    /** Check if a key is the first in the queue, optionally filtered by process level */
    isFirst (key, processLevel) {
        if (processLevel !== undefined) {
            // Find the first key that matches the specified level
            const firstKeyAtLevel = this.#order.find(k => this.#levels.get(k) === processLevel);

            return firstKeyAtLevel === key;
        }

        return this.#order[0] === key;
    }

    /** Get iterator of keys in insertion order */
    keys () { return this.#order.values(); }

    /** Get iterator of [key, value] pairs in insertion order */
    [Symbol.iterator] () { return this.#order.map(k => [k, this.#store.get(k)])[Symbol.iterator](); }

    /* =========================================================================
     Insertion
     ========================================================================= */
    /**
   * Enqueue a value with optional positional insertion.
   * @param {string}   key
   * @param {*}        value
   * @param {Object}   [opts]
   * @param {string|null} [opts.after] - Insert directly *after* this key
   *                                   - null: insert at head (unshift)
   *                                   - undefined: insert at tail (push) - default
   *                                   - string: insert after the specified key
   * @returns {*} The value that was enqueued (existing value if key already exists)
   */
    enqueue (key, value, { after } = {}) {
    // Deduplication: if key already exists, return existing value
        if (this.#store.has(key)) {
            return this.#store.get(key);
        }

        // 1. Store in map
        this.#store.set(key, value);

        // 2. Handle insertion order
        if (after === null) {
            // Insert at head
            this.#order.unshift(key);
        } else if (after && this.#store.has(after)) {
            // Insert after specified key
            const i = this.#order.indexOf(after);

            if (i !== -1) {
                this.#order.splice(i + 1, 0, key);
            } else {
                // Fallback: parent key not found in order, append to tail
                console.warn(`ProcessQueue: Parent key '${after}' not found in order, appending '${key}' to tail`);
                this.#order.push(key);
            }
        } else if (after && !this.#store.has(after)) {
            // Parent key doesn't exist, warn and append to tail
            console.warn(`ProcessQueue: Parent key '${after}' not found, appending '${key}' to tail`);
            this.#order.push(key);
        } else {
            // Default: insert at tail
            this.#order.push(key);
        }

        return value;
    }

    /**
   * Legacy compatibility method - behaves like Map.set()
   * @param {string} key
   * @param {*} value
   * @returns {ProcessQueue} this instance for chaining
   */
    set (key, value) {
        this.enqueue(key, value);

        return this;
    }

    /* =========================================================================
     Debugging and inspection
     ========================================================================= */
    /** Get current queue state for debugging */
    getDebugInfo () {
        return {
            size: this.size,
            order: [...this.#order],
            keys: [...this.#store.keys()],
            levels: Object.fromEntries(this.#levels),
            isEmpty: this.size === 0
        };
    }

    /** Get all entries as array of [key, value] pairs in order */
    entries () {
        return this.#order.map(key => [key, this.#store.get(key)]);
    }

    /** Get all values in insertion order */
    values () {
        return this.#order.map(key => this.#store.get(key));
    }
}
