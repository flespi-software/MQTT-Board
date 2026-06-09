// Pure helpers for the subscriber's tree-based topic filter (list mode).
// Kept framework-free so they can be unit tested in isolation.

// Fixed (non-wildcard) prefix of an MQTT subscription topic: the segments before the
// first '+' or '#' wildcard. Used to auto-expand the filter tree down to those segments.
// e.g. 'flespi/message/gw/devices/#' -> 'flespi/message/gw/devices', 'flespi/#' -> 'flespi'.
export function fixedTopicPrefix (topic) {
  const segments = []
  for (const segment of String(topic == null ? '' : topic).split('/')) {
    if (segment === '#' || segment === '+') { break }
    segments.push(segment)
  }
  return segments.join('/')
}

// True when `topic` is `candidate` itself or a descendant of it ('candidate/...').
export function isTopicOrDescendant (topic, candidate) {
  return topic === candidate || topic.startsWith(`${candidate}/`)
}

// True when `topic` matches any selected filter topic (each filter covers a topic + its
// descendants); combined with logical OR. An empty selection matches nothing here — callers
// decide that "no selection" means "show everything".
export function topicMatchesFilter (topic, selectedTopics) {
  return selectedTopics.some(selected => isTopicOrDescendant(topic, selected))
}

// True when `nodeTopic` lies on the path to `prefix` (an ancestor of it) or equals it.
// Used to seed the filter tree's expanded nodes along the subscription's fixed prefix.
export function isExpandAncestor (nodeTopic, prefix) {
  return !!prefix && (prefix === nodeTopic || prefix.startsWith(`${nodeTopic}/`))
}

// Coerce a persisted splitter ratio to a valid number, falling back when it is null/NaN
// (JSON serializes NaN as null, so an old corrupt value can come back as null).
export function sanitizeRatio (value, fallback) {
  return typeof value === 'number' && !isNaN(value) ? value : fallback
}
