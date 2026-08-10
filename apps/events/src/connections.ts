/**
 * The subscription registry: which sockets asked for which topics.
 *
 * Deliberately free of `ws` and of any transport type — it takes a `Sink`,
 * which is anything with a `send`. That is what makes it testable without
 * opening a socket, and it is the seam `@12-apps/realtime` will plug into when
 * this app becomes a thin runner over the package (12-16).
 *
 * It performs **no authorization**. It relays exactly the topics a connection
 * names, and deciding who may name what belongs to the API process — which is
 * much easier to keep true when the code that could authorize is not here.
 */

export interface Sink {
  send(payload: string): void;
}

export interface Envelope {
  topic: string;
  event: string;
  data: unknown;
}

export class Connections {
  readonly #topics = new Map<string, Set<Sink>>();
  readonly #bySink = new Map<Sink, Set<string>>();

  /** Subscribe a sink to a topic. Repeat calls are idempotent. */
  subscribe(sink: Sink, topic: string): void {
    let sinks = this.#topics.get(topic);
    if (!sinks) {
      sinks = new Set();
      this.#topics.set(topic, sinks);
    }
    sinks.add(sink);

    let topics = this.#bySink.get(sink);
    if (!topics) {
      topics = new Set();
      this.#bySink.set(sink, topics);
    }
    topics.add(topic);
  }

  /** Unsubscribe a sink from one topic. */
  unsubscribe(sink: Sink, topic: string): void {
    const sinks = this.#topics.get(topic);
    if (sinks) {
      sinks.delete(sink);
      // Drop the empty set rather than leaving it: a long-lived gateway
      // otherwise accumulates one Map entry per topic ever subscribed to, which
      // is unbounded when topics carry an id.
      if (sinks.size === 0) this.#topics.delete(topic);
    }
    const topics = this.#bySink.get(sink);
    if (topics) {
      topics.delete(topic);
      if (topics.size === 0) this.#bySink.delete(sink);
    }
  }

  /** Forget a sink entirely. Call this on close, or the maps leak. */
  drop(sink: Sink): void {
    const topics = this.#bySink.get(sink);
    if (!topics) return;
    for (const topic of [...topics]) this.unsubscribe(sink, topic);
    this.#bySink.delete(sink);
  }

  /** Deliver an envelope to every sink subscribed to its topic. */
  publish(envelope: Envelope): number {
    const sinks = this.#topics.get(envelope.topic);
    if (!sinks) return 0;
    const payload = JSON.stringify(envelope);
    let delivered = 0;
    for (const sink of sinks) {
      // One broken socket must not stop delivery to the rest.
      try {
        sink.send(payload);
        delivered += 1;
      } catch {
        this.drop(sink);
      }
    }
    return delivered;
  }

  /** Topics a sink currently holds — for tests and diagnostics. */
  topicsFor(sink: Sink): string[] {
    return [...(this.#bySink.get(sink) ?? [])];
  }

  get topicCount(): number {
    return this.#topics.size;
  }
}
