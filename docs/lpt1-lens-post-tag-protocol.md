# Lens Post Tag Protocol Specification

|                         |        |
| :---------------------- | :----- |
| **Version**             | 0.1    |
| **Protocol Identifier** | LPT-1  |
| **Tag Prefix**          | `lpt1` |
| **Status**              | Draft  |

## 1. Abstract

The Lens Post Tag Protocol defines a machine-readable convention for representing application identity, topic hierarchy, external data sources, and external item identifiers in Lens post metadata.

LPT-1 encodes each attribute as an independently queryable value in the `lens.tags` array. The protocol is designed to work with Lens metadata constraints and the current Lens backend tag-filtering implementation.

The protocol supports:

- Application-level classification
- Hierarchical topics
- External source identification
- External item identification
- Exact-any, exact-all, and prefix-based queries
- Coexistence with ordinary, non-protocol tags

The protocol does not authenticate tag claims or establish global ownership of application, topic, or source names.

## 2. Versioning

This document is specification version 0.1.

The `lpt1/` prefix identifies the first LPT wire format. Compatible revisions of this specification may continue using `lpt1/`.

Any future revision that introduces incompatible syntax or semantics MUST use a new prefix, such as `lpt2/`.

Consumers MUST ignore unknown protocol versions unless they explicitly support them.

## 3. Normative Language

The terms MUST, MUST NOT, REQUIRED, SHOULD, SHOULD NOT, MAY, and OPTIONAL are to be interpreted as normative requirements.

- **MUST** and **MUST NOT** indicate mandatory protocol requirements.
- **SHOULD** and **SHOULD NOT** indicate recommended behavior that may be ignored only when there is a clear reason.
- **MAY** indicates optional behavior.

## 4. Examples

A Firefly post referring to a Polymarket World Cup event:

```json
{
    "lens": {
        "tags": [
            "lpt1/app/firefly",
            "lpt1/topic/worldcup26",
            "lpt1/topic/polymarket",
            "lpt1/topic/polymarket/event",
            "lpt1/source/polymarket",
            "lpt1/item/fifwc-arg-egy-2026-07-07"
        ]
    }
}
```

A Firefly post referring to a user's Polymarket position on a specific market. The post declares an additional, more specific topic (`polymarket/position`) while still referencing the same external item:

```json
{
    "lens": {
        "tags": [
            "lpt1/app/firefly",
            "lpt1/topic/worldcup26",
            "lpt1/topic/polymarket",
            "lpt1/topic/polymarket/event",
            "lpt1/topic/polymarket/position",
            "lpt1/source/polymarket",
            "lpt1/item/btc-updown-5m-1780540200"
        ]
    }
}
```

## 5. Lens Compatibility Constraints

An LPT-1 producer MUST observe the following constraints:

- A post metadata object MUST contain no more than 20 unique tags.
- A complete LPT-1 tag MUST contain no more than 50 ASCII characters.
- Every tag in the `lens.tags` array MUST be unique.
- LPT-1 tags MUST use lowercase ASCII.
- An LPT-1 tag MUST NOT contain leading or trailing whitespace.

The current Lens tag query interface supports one of the following modes per tag filter:

- `oneOf` — match any of the supplied values (exact-any)
- `all` — match all of the supplied values (exact-all)
- `oneOfPrefix` — match any value with the supplied lexical prefix

A tag filter accepts between 1 and 10 query values.

Only one query mode may be supplied in a single tag filter.

## 6. Tag Types

LPT-1 defines four tag types:

```
Application tag: lpt1/app/<app-slug>
Topic tag:       lpt1/topic/<topic-path>
Source tag:      lpt1/source/<source-slug>
Item tag:        lpt1/item/<item-key>
```

### 6.1 Application Tag

An application tag identifies the application classification declared by the producer.

```
lpt1/app/firefly
```

### 6.2 Topic Tag

A topic tag identifies a topic or a hierarchical topic path.

```
lpt1/topic/polymarket
lpt1/topic/polymarket/event
lpt1/topic/sports/football
```

Topic segments MUST be ordered from the broadest topic to the most specific topic.

### 6.3 Source Tag

A source tag identifies the external system, protocol, marketplace, service, or dataset referenced by the post — for example, the Polymarket prediction market. The item it refers to is identified separately by an item tag.

```
lpt1/source/polymarket
```

### 6.4 Item Tag

An item tag identifies a specific external item.

```
lpt1/item/btc-updown-5m-1780540200
lpt1/item/h/qzltb22lvj4jtk2f2x7umzo2oz
```

An item tag is not globally unique by itself. Consumers MUST combine it with the corresponding source tag when querying a specific external item.

## 7. Syntax

The protocol syntax is:

```
app-tag     = "lpt1/app/"    app-slug
topic-tag   = "lpt1/topic/"  topic-segment [ "/" topic-segment ... ]
source-tag  = "lpt1/source/" source-slug
item-tag    = "lpt1/item/"   item-key

app-slug      = segment
topic-segment = segment
source-slug   = segment
item-key      = direct-item-key / hashed-item-key

direct-item-key  = segment                ; a single segment (no "/")
hashed-item-key  = "h/" 1*26BASE32        ; literal "h/" marker + 26 Base32 chars
```

A normal segment MUST match:

```
[a-z0-9]+(?:[-_][a-z0-9]+)*
```

The Base32 alphabet is RFC 4648 lowercase (`a–z`, `2–7`). The Base32 portion of a hashed item key MUST match:

```
[a-z2-7]{26}
```

A complete hashed item tag therefore matches:

```
lpt1/item/h/[a-z2-7]{26}
```

Because a direct item key is a single segment, it cannot contain `/` and is therefore structurally distinct from the `h/`-prefixed hashed form.

## 8. General Syntax Requirements

All LPT-1 tags MUST comply with the following rules:

1. The complete tag MUST contain between 1 and 50 ASCII characters.
2. The complete tag MUST be lowercase.
3. `/` MUST only be used as the structural delimiter defined by this specification.
4. Empty path segments are invalid.
5. Leading or trailing separators are invalid.
6. Repeated separators are invalid.
7. An application tag MUST contain exactly one application slug.
8. A topic tag MUST contain one or more topic segments.
9. A source tag MUST contain exactly one source slug.
10. An item tag MUST contain exactly one item key.
11. A direct item key MUST NOT use the reserved hashed form (`h/` followed by 26 Base32 characters).
12. Tags MUST NOT contain leading or trailing whitespace.
13. Every tag string in the metadata array MUST be unique.

## 9. Length Limits

The maximum variable lengths are determined by the 50-character complete-tag limit.

### Application Tag

```
Prefix:                       lpt1/app/   (9 characters)
Maximum application slug:     41 characters
```

### Topic Tag

```
Prefix:                       lpt1/topic/   (11 characters)
Maximum complete topic path:  39 characters
```

The topic-path limit includes all topic segments and `/` delimiters.

### Source Tag

```
Prefix:                  lpt1/source/   (12 characters)
Maximum source slug:     38 characters
```

### Direct Item Tag

```
Prefix:                  lpt1/item/   (10 characters)
Maximum direct item key: 40 characters
```

### Hashed Item Tag

A hashed item tag has a fixed length of 38 characters:

```
lpt1/item/   (10)   +   h/   (2)   +   26 Base32 characters   =   38
```

External identifiers MUST NOT be truncated to satisfy the direct item length limit. The hashed item-key procedure MUST be used instead.

## 10. Application Slugs

An application publisher SHOULD select one stable application slug.

```
Application name: Firefly
Application slug: firefly
Application tag:  lpt1/app/firefly
```

Changing an application's display name SHOULD NOT change its application slug.

Application tags are self-declared and can be copied or spoofed by another producer.

Consumers requiring authenticated Lens application provenance MUST use the Lens application-address filter. They MAY combine the address filter with an LPT-1 application tag.

## 11. Topic Hierarchy

A topic path consists of segments ordered from broadest to most specific.

```
polymarket/event
```

A producer publishing a topic path MUST include every ancestor of the most specific topic.

For the topic `polymarket/event`, the producer MUST include:

```
lpt1/topic/polymarket
lpt1/topic/polymarket/event
```

For the topic `sports/football/premier-league`, the producer MUST include:

```
lpt1/topic/sports
lpt1/topic/sports/football
lpt1/topic/sports/football/premier-league
```

This requirement is called **parent closure**.

Parent closure allows consumers to retrieve an entire topic branch using an exact query for its parent topic.

A producer MAY assign multiple topic paths to one post. Parent closure MUST be applied independently to every assigned topic path.

## 12. External Source

An external source MUST be represented separately from an external item identifier.

```
lpt1/source/polymarket
```

Separating source and item tags provides the following properties:

- Posts referencing a source can be queried independently of individual items.
- Item identifiers retain the full 40-character direct-encoding budget.
- Identical item identifiers from different sources can be distinguished.
- Hashed identifiers can include the source slug in their hash input.

A source slug SHOULD remain stable even if the source changes its display name.

## 13. Direct Item Keys

A source system's canonical item identifier MAY be used directly as the item key only when all of the following conditions are satisfied:

- It matches the segment grammar.
- It is already lowercase.
- It contains no unsupported characters.
- It does not use the reserved hashed form (`h/` + 26 Base32).
- It is no longer than 40 ASCII characters.

```
Canonical item identifier: btc-updown-5m-1780540200
Source tag:                lpt1/source/polymarket
Item tag:                  lpt1/item/btc-updown-5m-1780540200
```

A producer MUST NOT lowercase, rewrite, escape, or truncate an external identifier solely to make it eligible for direct encoding.

If the canonical identifier does not already satisfy the direct-encoding requirements, the producer MUST use a hashed item key.

## 14. Hashed Item Keys

A hashed item key provides a deterministic representation for identifiers that:

- Exceed 40 characters
- Contain uppercase characters
- Contain whitespace
- Contain Unicode
- Contain unsupported punctuation
- Use the reserved `h/` hashed form
- Otherwise fail the direct item-key grammar

The hash input MUST be constructed as follows:

```
hash-input =
  UTF-8(source-slug)
  || 0x00
  || UTF-8(source system's canonical item identifier)
```

The item key MUST then be calculated as follows:

```
digest   = SHA-256(hash-input)

encoded  = lowercase unpadded RFC 4648 Base32 encoding of digest

item-key = "h/" + first 26 characters of encoded

item-tag = "lpt1/item/" + item-key
```

The resulting item key contains a 130-bit digest prefix.

The source slug is included in the hash input. Therefore, identical item identifiers from different sources produce different hashed item keys.

Producers MUST use the exact canonical identifier supplied or defined by the source system. Producers MUST NOT hash a display name, localized value, URL alias, or other non-canonical representation when a canonical identifier is available.

Producers and consumers MUST agree on both:

- The canonical source slug
- The source system's canonical item identifier

The original item identifier SHOULD be retained elsewhere in the post metadata when clients need to display or independently verify it.

## 15. Hash Test Vector

Given:

```
Source slug:                    polymarket
Canonical item identifier:      btc-updown-5m-1780540200
```

The hash input is:

```
UTF-8("polymarket")
|| 0x00
|| UTF-8("btc-updown-5m-1780540200")
```

The resulting item tag is:

```
lpt1/item/h/qzltb22lvj4jtk2f2x7umzo2oz
```

The identifier in this test vector is eligible for direct encoding. A conforming producer would therefore publish:

```
lpt1/item/btc-updown-5m-1780540200
```

The hashed value is provided only as an implementation test vector.

## 16. Producer Requirements

A conforming LPT-1 producer:

1. MUST include exactly one application tag.
2. MAY include one or more topic paths.
3. MUST include every ancestor of every declared topic path.
4. MUST include a source tag and an item tag when referring to a specific external item.
5. MAY include a source tag without an item tag when referring to a source generally.
6. MUST NOT include an item tag without sufficient source context.
7. MUST validate every LPT-1 tag before publishing.
8. MUST keep the complete `lens.tags` array within the Lens limit of 20 unique tags.
9. MUST use the hashed item-key procedure when direct encoding is not valid.
10. MUST NOT truncate canonical item identifiers.
11. SHOULD order tags deterministically as follows:

```
Application tag
Topic tags from broadest to most specific
Source tag
Item tag
Non-protocol tags
```

12. SHOULD avoid publishing redundant or semantically equivalent topic paths when the tag limit is constrained.

## 17. Consumer Requirements

A conforming LPT-1 consumer:

1. MUST treat only valid tags beginning with `lpt1/` as LPT-1 tags.
2. MUST validate tags against the syntax in this specification.
3. MUST treat all tag claims as untrusted metadata.
4. MUST use exact matching for normal application, topic, source, and item lookup.
5. MUST query a specific external item using both its source tag and item tag.
6. MUST use the same deterministic item-key algorithm as producers.
7. MUST NOT interpret malformed tags as valid LPT-1 tags.
8. MUST NOT interpret unknown protocol versions as LPT-1.
9. SHOULD validate query values locally before submitting them to the Lens API.
10. SHOULD ignore malformed LPT-1 tags without rejecting the complete post.

## 18. Query Examples

Consumers SHOULD use the structured metadata tag filter rather than a general text-search query.

### Firefly Posts

```
filter: {
  metadata: {
    tags: {
      oneOf: ["lpt1/app/firefly"]
    }
  }
}
```

### Firefly Posts with Authenticated Application Provenance

```
filter: {
  apps: ["0x..."]
  metadata: {
    tags: {
      oneOf: ["lpt1/app/firefly"]
    }
  }
}
```

### All Polymarket Posts

```
filter: {
  metadata: {
    tags: {
      oneOf: ["lpt1/topic/polymarket"]
    }
  }
}
```

### Polymarket Event Posts

```
filter: {
  metadata: {
    tags: {
      oneOf: ["lpt1/topic/polymarket/event"]
    }
  }
}
```

### Posts Referencing Polymarket as a Source

```
filter: {
  metadata: {
    tags: {
      oneOf: ["lpt1/source/polymarket"]
    }
  }
}
```

### A Specific Polymarket Item

```
filter: {
  metadata: {
    tags: {
      all: [
        "lpt1/source/polymarket",
        "lpt1/item/btc-updown-5m-1780540200"
      ]
    }
  }
}
```

### Firefly Posts About a Specific Item

```
filter: {
  metadata: {
    tags: {
      all: [
        "lpt1/app/firefly",
        "lpt1/source/polymarket",
        "lpt1/item/btc-updown-5m-1780540200"
      ]
    }
  }
}
```

### Posts in Either of Two Topics

```
filter: {
  metadata: {
    tags: {
      oneOf: [
        "lpt1/topic/polymarket",
        "lpt1/topic/sports"
      ]
    }
  }
}
```

### Lexical Topic Prefix Query

```
filter: {
  metadata: {
    tags: {
      oneOfPrefix: ["lpt1/topic/polymarket"]
    }
  }
}
```

## 19. Invalid and Discouraged Values

### Missing Namespace

```
Firefly
```

Reason: The value is not namespaced and is not lowercase.

### Incorrect Delimiter Structure

```
lpt1_app_firefly
```

Reason: The value does not use the required slash-delimited structure.

### Colon Delimiters

```
lpt1:app:firefly
```

Reason: Colons may be interpreted as text-query syntax and do not follow the protocol grammar.

### Hyphenated Namespace

```
lpt1-app-firefly
```

Reason: Hyphenated words may generate additional component lexemes.

### Whitespace

```
lpt1/app/fire fly
```

Reason: Whitespace splits the value into multiple searchable tokens.

### Unsupported Unicode Segment

```
lpt1/topic/预测市场
```

Reason: Unicode may be valid Lens tag content, but it is outside the interoperable LPT-1 grammar.

### Source Embedded in an Item Tag

```
lpt1/item/polymarket/btc-updown-5m-1780540200
```

Reason: Item tags contain exactly one item key. The source MUST use a separate source tag.

### Oversized Direct Item Key

```
lpt1/item/<item-key-longer-than-40-characters>
```

Reason: The complete tag exceeds the length limit. A hashed item key MUST be used.

### Empty Topic Segment

```
lpt1/topic/polymarket/
```

Reason: The final topic segment is empty.

### Reserved Hash Form Used Directly

```
lpt1/item/h/qzltb22lvj4jtk2f2x7umzo2oz
```

Reason: Direct item keys MUST NOT use the `h/` + 26 Base32 hashed form. This form is reserved for hashed item keys.

## 20. Prohibited Segment Characters

LPT-1 segments MUST NOT contain:

- Whitespace
- Unicode characters
- Periods
- Colons
- Commas
- Hash signs
- Ampersands
- Vertical bars
- Exclamation marks
- Parentheses
- Angle brackets
- Asterisks
- Quotes
- Backslashes
- Forward slashes inside a segment

Some of these characters are token separators. Others have special meaning in PostgreSQL text-search queries and may cause incorrect matches or query errors.

## 21. User Interface Guidance

LPT-1 tags are machine-readable metadata tags, not user-facing hashtags.

User interfaces SHOULD hide tags beginning with `lpt1/` from ordinary hashtag displays unless the interface is specifically presenting structured protocol metadata.

Applications MAY display human-readable labels derived from LPT-1 tags, but they SHOULD NOT modify the underlying protocol values.

## 22. Security Considerations

LPT-1 tags are self-declared and do not provide authentication.

A malicious publisher may:

- Claim another application's slug
- Use misleading topic tags
- Claim an unrelated source
- Associate a post with an incorrect external item
- Publish deliberately malformed protocol-like tags

Consumers MUST NOT use an application tag as proof that a post was published by a specific Lens application.

Authenticated application provenance MUST be established using the Lens application-address filter or another trusted provenance mechanism.

Applications SHOULD validate source and item relationships against authoritative source data before presenting them as verified.

Hashing prevents oversized or unsupported identifiers from entering the tag syntax. It does not prove that an identifier exists or that the post's claim is accurate.

## 23. Compatibility and Migration

Consumers implementing LPT-1 MUST ignore unsupported protocol prefixes.

If an incompatible protocol version is introduced, it MUST use a new prefix.

```
lpt2/
```

During a migration period, a producer MAY publish tags for multiple protocol versions if:

- Every version's tags are valid
- The complete metadata tag array remains within the Lens tag limit
- Duplicate semantic classifications do not create ambiguity for consumers

## 24. Implementation Notes

LPT-1 uses slash-delimited ASCII values because the current Lens backend indexes metadata tags using PostgreSQL's `simple` text-search configuration.

A value such as:

```
lpt1/item/btc-updown-5m-1780540200
```

is preserved as one searchable lexeme under the intended backend profile.

This makes exact-any, exact-all, and lexical-prefix queries predictable for valid LPT-1 values.

Implementations should remain aware that the current backend stores a flattened text-search representation rather than preserving original tag-array boundaries in the search index.

A future backend may provide native exact-tag storage using a PostgreSQL `text[]` column or a normalized tag relation. Such an implementation may coexist with the existing text-search index for prefix searching.
