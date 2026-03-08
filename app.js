
(function (root, factory) {
  const exported = factory(root);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  } else {
    root.GCSEMarkerApp = exported;
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const STORAGE_KEY = "gcse_english_github_pages_answer_v12";

  function hasDocument() {
    return typeof document !== "undefined";
  }

  function $(id) {
    return hasDocument() ? document.getElementById(id) : null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function uniqueArray(values) {
    return Array.from(new Set((values || []).filter(Boolean)));
  }

  function normaliseText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[^a-z0-9'"\s-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normaliseToken(token) {
    return String(token || "")
      .toLowerCase()
      .replace(/[^a-z0-9'-]+/g, "")
      .trim();
  }

  function simpleStem(token) {
    let t = normaliseToken(token);
    if (t.length > 5 && t.endsWith("ing")) {
      t = t.slice(0, -3);
    } else if (t.length > 4 && t.endsWith("ied")) {
      t = t.slice(0, -3) + "y";
    } else if (t.length > 4 && t.endsWith("ed")) {
      t = t.slice(0, -2);
    } else if (t.length > 4 && t.endsWith("ly")) {
      t = t.slice(0, -2);
    } else if (t.length > 4 && t.endsWith("es")) {
      t = t.slice(0, -2);
    } else if (t.length > 3 && t.endsWith("s")) {
      t = t.slice(0, -1);
    }
    return t;
  }

  function tokenizeFallback(text) {
    return normaliseText(text)
      .replace(/["']/g, " ")
      .replace(/-/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function buildTokenRecordsFallback(text) {
    return tokenizeFallback(text).map(function (token) {
      return {
        text: token,
        norm: normaliseToken(token),
        lemma: normaliseToken(token),
        stem: simpleStem(token),
        pos: "",
        type: "word"
      };
    });
  }

  function buildNgrams(tokens, size) {
    const grams = [];
    const list = tokens || [];
    if (!Array.isArray(list) || list.length < size) return grams;
    for (let i = 0; i <= list.length - size; i += 1) {
      grams.push(list.slice(i, i + size).join(" "));
    }
    return grams;
  }

  function setOverlapRatio(listA, setB) {
    if (!listA.length) return 0;
    let overlap = 0;
    listA.forEach(function (item) {
      if (setB.has(item)) overlap += 1;
    });
    return overlap / listA.length;
  }

  function tokenBigramDice(tokensA, tokensB) {
    const a = buildNgrams(tokensA, 2);
    const b = buildNgrams(tokensB, 2);
    if (!a.length && !b.length) {
      return tokensA.join(" ") === tokensB.join(" ") ? 1 : 0;
    }
    if (!a.length || !b.length) return 0;
    const setB = new Set(b);
    let overlap = 0;
    a.forEach(function (item) {
      if (setB.has(item)) overlap += 1;
    });
    return (2 * overlap) / (a.length + b.length);
  }

  function longestCommonRun(tokensA, tokensB) {
    const a = tokensA || [];
    const b = tokensB || [];
    const dp = Array(b.length + 1).fill(0);
    let best = 0;
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = b.length; j >= 1; j -= 1) {
        if (a[i - 1] === b[j - 1]) {
          dp[j] = dp[j - 1] + 1;
          if (dp[j] > best) best = dp[j];
        } else {
          dp[j] = 0;
        }
      }
    }
    return best;
  }

  function containsPhrase(text, phrase) {
    const haystack = " " + normaliseText(text) + " ";
    const needle = " " + normaliseText(phrase) + " ";
    if (!needle.trim()) return false;
    return haystack.indexOf(needle) !== -1;
  }

  function wordBoundaryRegex(phrase) {
    const escaped = String(phrase || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|\\s)" + escaped + "(?=$|\\s)", "i");
  }

  function phraseHits(text, list) {
    const source = normaliseText(text);
    return uniqueArray((list || []).filter(function (phrase) {
      const normal = normaliseText(phrase);
      if (!normal) return false;
      return wordBoundaryRegex(normal).test(source);
    }));
  }

  function detectQuotedSegments(text) {
    const segments = [];
    const source = String(text || "");
    const regex = /(?:^|[\s(])(?:["“”]|[‘’'])([^"“”'‘’]{1,220}?)(?:["“”]|[‘’'])(?=$|[\s),.;:!?])/g;
    let match;
    while ((match = regex.exec(source)) !== null) {
      const content = (match[1] || "").trim();
      if (!content) continue;
      const tokens = tokenizeFallback(content);
      segments.push({ text: content, wordCount: tokens.length });
    }
    return segments;
  }

  function mapArrayById(list) {
    const out = {};
    (list || []).forEach(function (item) {
      out[item.id] = item;
    });
    return out;
  }

  function buildMethodAliasList(methodAliases) {
    const out = [];
    Object.keys(methodAliases || {}).forEach(function (canonical) {
      methodAliases[canonical].forEach(function (alias) {
        out.push({ canonical: canonical, alias: alias, normal: normaliseText(alias) });
      });
    });
    out.sort(function (a, b) {
      return b.normal.length - a.normal.length;
    });
    return out;
  }

  function buildAdapters(rootObj, options) {
    const opts = options || {};
    const compromiseFn = opts.compromise || (typeof rootObj.nlp === "function" ? rootObj.nlp : null);
    const FuseCtor = opts.Fuse || rootObj.Fuse || null;
    let wink = null;
    const winkBundle = opts.wink || rootObj.__GCSE_WINK__ || null;

    if (winkBundle && winkBundle.instance) {
      wink = winkBundle.instance;
    } else if (winkBundle && winkBundle.winkNLP && winkBundle.model) {
      try {
        const nlp = winkBundle.winkNLP(winkBundle.model);
        wink = { nlp: nlp, its: nlp.its, as: nlp.as };
      } catch (error) {
        wink = null;
      }
    }

    return {
      compromise: compromiseFn,
      wink: wink,
      Fuse: FuseCtor
    };
  }

  function splitSentences(text, adapters) {
    const raw = String(text || "");
    if (adapters && adapters.wink) {
      try {
        const doc = adapters.wink.nlp.readDoc(raw);
        const out = doc.sentences().out();
        if (Array.isArray(out) && out.length) {
          return out.map(function (item) { return String(item || "").trim(); }).filter(Boolean);
        }
      } catch (error) {
        // fall through
      }
    }
    if (adapters && adapters.compromise) {
      try {
        const doc = adapters.compromise(raw);
        const out = doc.sentences().out("array");
        if (Array.isArray(out) && out.length) {
          return out.map(function (item) { return String(item || "").trim(); }).filter(Boolean);
        }
      } catch (error) {
        // fall through
      }
    }
    return raw
      .split(/(?<=[.!?])\s+|\n+/)
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function getTokenRecords(text, adapters) {
    const raw = String(text || "");
    if (adapters && adapters.wink) {
      try {
        const doc = adapters.wink.nlp.readDoc(raw);
        const values = doc.tokens().out(adapters.wink.its.value);
        const lemmas = doc.tokens().out(adapters.wink.its.lemma);
        const stems = doc.tokens().out(adapters.wink.its.stem);
        const poses = doc.tokens().out(adapters.wink.its.pos);
        let types = [];
        try {
          types = doc.tokens().out(adapters.wink.its.type);
        } catch (error) {
          types = [];
        }

        const out = [];
        for (let i = 0; i < values.length; i += 1) {
          const norm = normaliseToken(values[i]);
          if (!norm || !/[a-z0-9]/.test(norm)) continue;
          out.push({
            text: values[i],
            norm: norm,
            lemma: normaliseToken(lemmas[i] || values[i]),
            stem: normaliseToken(stems[i] || simpleStem(values[i])),
            pos: poses[i] || "",
            type: types[i] || "word"
          });
        }
        if (out.length) return out;
      } catch (error) {
        // fall through
      }
    }
    return buildTokenRecordsFallback(raw);
  }

  function makeStemSet(records) {
    const stems = new Set();
    (records || []).forEach(function (record) {
      stems.add(record.stem || simpleStem(record.norm || record.text));
      stems.add(record.lemma || record.norm || record.text);
      stems.add(record.norm || record.text);
    });
    return stems;
  }

  function recordsToTokens(records) {
    return (records || []).map(function (record) {
      return record.norm || record.text;
    }).filter(Boolean);
  }

  function recordsToStems(records) {
    return (records || []).map(function (record) {
      return record.stem || record.lemma || record.norm || record.text;
    }).filter(Boolean);
  }

  function termScore(textNorm, stemSet, term) {
    const phrase = normaliseText(term);
    if (!phrase) return 0;
    if (containsPhrase(textNorm, phrase)) return 1;
    const termTokens = tokenizeFallback(phrase).map(simpleStem);
    if (!termTokens.length) return 0;
    let overlap = 0;
    termTokens.forEach(function (token) {
      if (stemSet.has(token)) overlap += 1;
    });
    const ratio = overlap / termTokens.length;
    if (termTokens.length === 1) return ratio === 1 ? 0.96 : 0;
    if (ratio === 1) return 0.92;
    if (ratio >= 0.8) return 0.82;
    if (ratio >= 0.66) return 0.68;
    return 0;
  }

  function findApproxHits(textNorm, records, list, threshold) {
    const cutOff = typeof threshold === "number" ? threshold : 0.72;
    const stemSet = makeStemSet(records);
    const hits = [];
    (list || []).forEach(function (item) {
      const score = termScore(textNorm, stemSet, item);
      if (score >= cutOff) hits.push(item);
    });
    return uniqueArray(hits);
  }

  function startsWithCue(text, cues) {
    const norm = normaliseText(text);
    return (cues || []).some(function (cue) {
      return new RegExp("^" + normaliseText(cue).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s|$)").test(norm);
    });
  }

  function startsWithNeutralLink(text, cues) {
    const norm = normaliseText(text);
    return (cues || []).some(function (cue) {
      const safe = normaliseText(cue).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp("^" + safe + "(\\s|$)").test(norm);
    });
  }

  function grammarLabelSupported(methodName, quoteTexts, adapters) {
    if (!["adjective", "verb", "noun", "adverb"].includes(methodName)) return false;
    const joined = (quoteTexts || []).join(" ");
    const records = getTokenRecords(joined, adapters);
    if (!records.length) return false;
    if (methodName === "adjective") {
      return records.some(function (record) { return record.pos === "ADJ"; }) ||
        /\bblurred\b|\bmisty\b|\bhorribly\b|\bwet\b|\bblack\b|\bgreasy\b|\bsickening\b|\bmeaningless\b/.test(normaliseText(joined));
    }
    if (methodName === "verb") {
      return records.some(function (record) { return record.pos === "VERB" || record.pos === "AUX"; }) ||
        /\boozing\b|\bstifled\b|\bstaring\b|\bturned\b|\bresolve\b/.test(normaliseText(joined));
    }
    if (methodName === "noun") {
      return records.some(function (record) { return record.pos === "NOUN" || record.pos === "PROPN"; });
    }
    if (methodName === "adverb") {
      return records.some(function (record) { return record.pos === "ADV"; });
    }
    return false;
  }

  function buildExtractResources(config, adapters) {
    const extractRecords = getTokenRecords(config.sourceExtract, adapters);
    const extractTokens = recordsToTokens(extractRecords);
    const extractStems = recordsToStems(extractRecords);
    const extract4GramSet = new Set(buildNgrams(extractTokens, 4));
    const extract3GramSet = new Set(buildNgrams(extractTokens, 3));
    const extractSentences = splitSentences(config.sourceExtract, adapters).map(function (sentence) {
      const records = getTokenRecords(sentence, adapters);
      return {
        text: sentence,
        norm: normaliseText(sentence),
        records: records,
        tokens: recordsToTokens(records),
        stems: recordsToStems(records)
      };
    });

    return {
      text: config.sourceExtract,
      norm: normaliseText(config.sourceExtract),
      records: extractRecords,
      tokens: extractTokens,
      stems: extractStems,
      stemSet: new Set(extractStems.concat(extractTokens)),
      grams4: extract4GramSet,
      grams3: extract3GramSet,
      sentences: extractSentences
    };
  }

  function createMarker(config, rules, options) {
    const adapters = buildAdapters(root, options);
    const groupMap = mapArrayById(config.contentGroups);
    const quoteMap = mapArrayById(config.quoteBank);
    const threadMap = mapArrayById(config.conceptThreads || []);
    const methodAliasList = buildMethodAliasList(rules.methodAliases || {});
    const extract = buildExtractResources(config, adapters);
    let helperModel = null;

    const fuzzy = buildFuzzyHelpers();

    function buildFuzzyHelpers() {
      if (!adapters.Fuse) {
        return { quoteFuse: null, anchorFuse: {}, supportedFuse: null };
      }
      const Fuse = adapters.Fuse;
      const quoteFuse = new Fuse((config.quoteBank || []).map(function (q) {
        return { id: q.id, text: q.text, group: q.group };
      }), {
        keys: ["text"],
        includeScore: true,
        threshold: (rules.fuzzyThresholds || {}).quoteSearchMaxScore || 0.33,
        ignoreLocation: true
      });

      const anchors = {};
      Object.keys(config.anchorComments || {}).forEach(function (label) {
        anchors[label] = new Fuse((config.anchorComments[label] || []).map(function (text, index) {
          return { id: label + "_" + index, text: text, label: label };
        }), {
          keys: ["text"],
          includeScore: true,
          threshold: (rules.fuzzyThresholds || {}).anchorSearchMaxScore || 0.36,
          ignoreLocation: true
        });
      });

      const supported = [];
      (config.contentGroups || []).forEach(function (group) {
        (group.supportedEffects || []).forEach(function (item) {
          supported.push({ kind: "effect", text: item, group: group.id });
        });
        (group.supportedInterpretations || []).forEach(function (item) {
          supported.push({ kind: "interpretation", text: item, group: group.id });
        });
      });

      const supportedFuse = new Fuse(supported, {
        keys: ["text"],
        includeScore: true,
        threshold: (rules.fuzzyThresholds || {}).effectSearchMaxScore || 0.31,
        ignoreLocation: true
      });

      return { quoteFuse: quoteFuse, anchorFuse: anchors, supportedFuse: supportedFuse };
    }

    function fuzzyQuoteMatches(textNorm) {
      if (!fuzzy.quoteFuse || !textNorm) return [];
      const results = fuzzy.quoteFuse.search(textNorm).slice(0, 5);
      return uniqueArray(results.filter(function (result) {
        return typeof result.score === "number" && result.score <= ((rules.fuzzyThresholds || {}).quoteSearchMaxScore || 0.33);
      }).map(function (result) { return result.item.id; })).map(function (id) {
        return quoteMap[id];
      }).filter(Boolean);
    }

    function anchorSearch(textNorm, label) {
      const index = fuzzy.anchorFuse ? fuzzy.anchorFuse[label] : null;
      if (!index || !textNorm) return [];
      return index.search(textNorm).slice(0, 3);
    }

    function supportedFuzzySearch(textNorm, groupIds) {
      if (!fuzzy.supportedFuse || !textNorm) return [];
      const allowed = new Set(groupIds || []);
      return fuzzy.supportedFuse.search(textNorm).filter(function (result) {
        return !allowed.size || allowed.has(result.item.group);
      }).slice(0, 8);
    }

    function getQuoteMatches(textNorm, records) {
      const stemSet = makeStemSet(records);
      const directHits = [];
      config.quoteBank.forEach(function (quote) {
        const score = termScore(textNorm, stemSet, quote.text);
        if (score >= 0.82) directHits.push({ id: quote.id, score: score, text: quote.text });
      });
      const fuzzyHits = fuzzyQuoteMatches(textNorm);
      const ids = uniqueArray(directHits.map(function (hit) { return hit.id; }).concat(fuzzyHits.map(function (item) { return item.id; })));
      return ids.map(function (id) { return quoteMap[id]; }).filter(Boolean);
    }

    function getGroupMatches(textNorm, records, matchedQuotes) {
      const groups = new Set((matchedQuotes || []).map(function (quote) { return quote.group; }));
      const stemSet = makeStemSet(records);
      config.contentGroups.forEach(function (group) {
        const candidateTerms = [].concat(group.terms || [], group.supportedEffects || [], group.supportedInterpretations || []);
        let best = 0;
        candidateTerms.forEach(function (term) {
          const score = termScore(textNorm, stemSet, term);
          if (score > best) best = score;
        });
        if (best >= 0.72) groups.add(group.id);
      });
      return Array.from(groups);
    }

    function getAllowedPools(quoteIds, groupIds) {
      const effects = [];
      const interpretations = [];
      const methods = [];
      const groups = new Set(groupIds || []);
      (quoteIds || []).forEach(function (id) {
        const quote = quoteMap[id];
        if (!quote) return;
        (quote.supportedEffects || []).forEach(function (item) { effects.push(item); });
        (quote.supportedInterpretations || []).forEach(function (item) { interpretations.push(item); });
        (quote.supportedMethods || []).forEach(function (item) { methods.push(item); });
        groups.add(quote.group);
      });
      Array.from(groups).forEach(function (id) {
        const group = groupMap[id];
        if (!group) return;
        (group.supportedEffects || []).forEach(function (item) { effects.push(item); });
        (group.supportedInterpretations || []).forEach(function (item) { interpretations.push(item); });
        (group.supportedMethods || []).forEach(function (item) { methods.push(item); });
      });
      return {
        effects: uniqueArray(effects),
        interpretations: uniqueArray(interpretations),
        methods: uniqueArray(methods)
      };
    }

    function getContextGroupPairs(groupIds) {
      const ids = new Set(groupIds || []);
      return (config.contrastBridges || []).filter(function (pair) {
        return ids.has(pair[0]) && ids.has(pair[1]);
      });
    }

    function detectMethodMentions(textNorm) {
      const mentions = [];
      methodAliasList.forEach(function (entry) {
        if (containsPhrase(textNorm, entry.alias)) {
          mentions.push(entry);
        }
      });
      return uniqueArray(mentions.map(function (item) { return item.canonical; })).map(function (canonical) {
        return {
          canonical: canonical,
          aliases: methodAliasList.filter(function (entry) {
            return entry.canonical === canonical && containsPhrase(textNorm, entry.alias);
          }).map(function (entry) { return entry.alias; })
        };
      });
    }

    function detectGroundedProfile(textNorm, records, quoteIds, groupIds) {
      const pools = getAllowedPools(quoteIds, groupIds);
      let supportedEffectHits = findApproxHits(textNorm, records, pools.effects, 0.72);
      let supportedInterpretationHits = findApproxHits(textNorm, records, pools.interpretations, 0.72);
      const interpretiveSignalHits = phraseHits(textNorm, rules.interpretivePhrases || []);
      const comparisonHits = phraseHits(textNorm, rules.comparisonTerms || []);
      const writerChoiceHits = phraseHits(textNorm, rules.writerChoicePhrases || []);
      const bridgeHits = getContextGroupPairs(groupIds);
      const fuzzySupported = supportedFuzzySearch(textNorm, groupIds);

      fuzzySupported.forEach(function (hit) {
        if (!hit.item || typeof hit.score !== "number") return;
        if (hit.score <= ((rules.fuzzyThresholds || {}).effectSearchMaxScore || 0.31)) {
          if (hit.item.kind === "effect") supportedEffectHits.push(hit.item.text);
          if (hit.item.kind === "interpretation") supportedInterpretationHits.push(hit.item.text);
        }
      });

      if (comparisonHits.length && bridgeHits.length) {
        supportedInterpretationHits.push("contrast between outside and inside");
      }
      if ((groupIds || []).indexOf("magical_outside") !== -1 && /(luxury|luxurious|wealth|wealthy|glamour|glamorous|richer|distance)/.test(textNorm)) {
        supportedInterpretationHits.push("distance from wealth");
      }
      if ((groupIds || []).indexOf("blank_passengers") !== -1 && /(alienat|dehuman|individuality|anonymous|merged together|merge together|loss of identity|loss of individuality)/.test(textNorm)) {
        supportedInterpretationHits.push("dehumanisation / alienation");
      }
      if ((groupIds || []).indexOf("smell_heat") !== -1 && /(emotional suffocation|physical and emotional suffocation|oppressive|trapped|inescapable|smothering|pressing in)/.test(textNorm)) {
        supportedInterpretationHits.push("physical and emotional suffocation");
      }
      if ((groupIds || []).indexOf("magical_outside") !== -1 && /(escape|escapism|fantasy|imaginat|imaginative|dreamlike|unreal|idealised|idealized|relief)/.test(textNorm)) {
        supportedInterpretationHits.push("brief escape");
      }

      const combined = uniqueArray([].concat(
        supportedEffectHits,
        supportedInterpretationHits,
        interpretiveSignalHits
      ));
      const specificEffectHits = uniqueArray((combined || []).filter(function (item) {
        return (rules.specificEffectTerms || []).indexOf(item) !== -1;
      }));
      const highEffectHits = uniqueArray((combined || []).filter(function (item) {
        return (rules.highResolutionEffectTerms || []).indexOf(item) !== -1;
      }));
      const literalEffectHits = uniqueArray((combined || []).filter(function (item) {
        return (rules.literalEffectTerms || []).indexOf(item) !== -1;
      }));

      return {
        supportedEffectHits: uniqueArray(supportedEffectHits),
        supportedInterpretationHits: uniqueArray(supportedInterpretationHits),
        interpretiveSignalHits: uniqueArray(interpretiveSignalHits),
        comparisonHits: uniqueArray(comparisonHits),
        writerChoiceHits: uniqueArray(writerChoiceHits),
        specificEffectHits: uniqueArray(specificEffectHits),
        highEffectHits: uniqueArray(highEffectHits),
        literalEffectHits: uniqueArray(literalEffectHits),
        bridgeHits: bridgeHits
      };
    }

    function detectGenericSignals(textNorm, isFirstUnit) {
      const severeGenericHits = phraseHits(textNorm, rules.genericEffectPhrasesSevere || []);
      const mildGenericHits = phraseHits(textNorm, rules.genericFramesMild || []);
      const featureHits = phraseHits(textNorm, rules.featureSpottingPhrases || []);
      const genericOpening = isFirstUnit && phraseHits(textNorm, rules.genericOpenings || []).length > 0;
      const neutralLink = startsWithNeutralLink(textNorm, rules.neutralLinkingPhrases || []);

      if (/help(s)? the reader/.test(textNorm) && severeGenericHits.indexOf("helps the reader imagine") === -1) {
        severeGenericHits.push("helps the reader imagine");
      }
      if (/create(s)? (a )?certain atmosphere/.test(textNorm) && severeGenericHits.indexOf("creates a certain atmosphere") === -1) {
        severeGenericHits.push("creates a certain atmosphere");
      }
      if (/shows what the journey is like/.test(textNorm) && severeGenericHits.indexOf("shows what the journey is like") === -1) {
        severeGenericHits.push("shows what the journey is like");
      }

      return {
        severeGenericHits: uniqueArray(severeGenericHits),
        mildGenericHits: uniqueArray(mildGenericHits),
        featureHits: uniqueArray(featureHits),
        genericOpening: genericOpening,
        neutralLink: neutralLink
      };
    }

    function detectHedging(textNorm) {
      const softHits = [];
      const hardHits = [];
      (rules.softHedges || []).forEach(function (item) {
        const normal = normaliseText(item);
        if (!normal) return;
        if (wordBoundaryRegex(normal).test(textNorm)) softHits.push(item);
      });
      (rules.hardUncertainty || []).forEach(function (item) {
        const normal = normaliseText(item);
        if (!normal) return;
        if (wordBoundaryRegex(normal).test(textNorm)) hardHits.push(item);
      });
      return {
        softHits: uniqueArray(softHits),
        hardHits: uniqueArray(hardHits)
      };
    }

    function detectContradictions(textNorm, hedging) {
      const hits = [];
      const certaintyHits = phraseHits(textNorm, rules.certaintyTerms || []);
      if (certaintyHits.length && hedging.softHits.length) {
        hits.push("certainty mixed with hedging");
      }
      (rules.contradictionPatterns || []).forEach(function (pair) {
        if (pair.every(function (item) { return containsPhrase(textNorm, item); })) {
          hits.push(pair.join(" + "));
        }
      });
      if (/but maybe not|or maybe not/.test(textNorm)) {
        hits.push("direct contradiction");
      }
      return uniqueArray(hits);
    }

    function detectUnsupportedInterpretation(textNorm, grounded, methodMentions, groupIds, anchorProfile) {
      const hits = [];
      const directHits = phraseHits(textNorm, rules.unsupportedInterpretationPhrases || []);
      const abstractHits = phraseHits(textNorm, rules.unsupportedAbstractTerms || []);
      const hasGroundedMeaning = grounded.supportedEffectHits.length + grounded.supportedInterpretationHits.length > 0;
      const strongGrounding = grounded.highEffectHits.length > 0 || grounded.supportedInterpretationHits.length > 0 || grounded.writerChoiceHits.length > 0;
      const hasSymbolLanguage = /symbol|symbolism|symbolises|symbolizes|represents/.test(textNorm);
      const hasMetaphorLanguage = /metaphor|metaphorical/.test(textNorm);

      directHits.forEach(function (item) { hits.push(item); });

      if (abstractHits.length && !hasGroundedMeaning && (hasSymbolLanguage || hasMetaphorLanguage)) {
        hits.push("unsupported abstract reading");
      }
      if (/mud/.test(textNorm) && /(emotion|emotional|society|corruption|spiritual|moral)/.test(textNorm) && (hasSymbolLanguage || hasMetaphorLanguage)) {
        hits.push("invented symbolism around mud");
      }
      if (/windows?/.test(textNorm) && /(transformation|transition|spiritual)/.test(textNorm) && (hasSymbolLanguage || hasMetaphorLanguage)) {
        hits.push("invented symbolism around windows");
      }
      if (/society/.test(textNorm) && /(judge|judging|judgement|judgment|corruption|force)/.test(textNorm)) {
        hits.push("unsupported social claim");
      }
      if ((methodMentions || []).some(function (item) { return item.canonical === "symbolism"; }) && !strongGrounding) {
        hits.push("unsupported symbolism label");
      }
      if (/(hallucinat|monster|zombie|nightmare|something bad is going to happen|end of the world)/.test(textNorm)) {
        hits.push("invented or misread meaning");
      }
      if (/(poor and struggling in life|poverty|poor and struggling)/.test(textNorm) && !/(wealth|luxur|rich|distance from wealth)/.test(textNorm)) {
        hits.push("unsupported poverty claim");
      }
      if (/(dangerous|threatening)/.test(textNorm) && /(nightmare|monster|zombie|something bad)/.test(textNorm)) {
        hits.push("unsupported danger reading");
      }
      if (anchorProfile && anchorProfile.unsupported > 0.62 && !strongGrounding) {
        hits.push("anchor bank matched unsupported reading");
      }

      if (strongGrounding && hits.length === 1 && (/distance from wealth|alienat|dehuman|escap|fantasy|suffocat|oppress|drain|disconnect|claustrophob|anonymous|merged together/).test(textNorm)) {
        // grounded inference should survive if it clearly grows from the wording
        return [];
      }
      return uniqueArray(hits);
    }

    function evaluateMethodUse(textNorm, methodMentions, contextQuotes, groupIds, grounded) {
      const comparisonHits = phraseHits(textNorm, rules.comparisonTerms || []);
      const correct = [];
      const loose = [];
      const serious = [];
      const generic = [];
      const available = getAllowedPools((contextQuotes || []).map(function (quote) { return quote.id; }), groupIds);
      const hasMeaning = grounded.specificEffectHits.length > 0 || grounded.supportedInterpretationHits.length > 0 || grounded.highEffectHits.length > 0;
      const quoteTexts = (contextQuotes || []).map(function (item) { return item.text; });

      (methodMentions || []).forEach(function (mention) {
        const name = mention.canonical;
        let supported = false;
        let looseOnly = false;

        if (name === "contrast") {
          supported = (
            (comparisonHits.length > 0 && getContextGroupPairs(groupIds).length > 0) ||
            (((/\bcontrast\b|\bjuxtaposition\b/).test(textNorm) || comparisonHits.length > 0) && (/\boutside\b|\binside\b|\bbus\b/).test(textNorm))
          );
        } else if (["adjective", "verb", "noun", "adverb"].includes(name)) {
          supported = available.methods.indexOf(name) !== -1 || grammarLabelSupported(name, quoteTexts, adapters);
        } else if (name === "description") {
          looseOnly = true;
        } else if (name === "imagery" || name === "sensory") {
          supported = available.methods.indexOf(name) !== -1;
          looseOnly = !supported;
        } else if (name === "simile") {
          supported = /\bas if\b|\blike\b/.test(textNorm);
        } else if (name === "personification") {
          supported = false;
        } else if (name === "symbolism") {
          supported = false;
        } else if (name === "punctuation") {
          supported = /semicolon|dash|ellipsis|punctuation|sentence form|long sentence/.test(textNorm);
        } else {
          supported = available.methods.indexOf(name) !== -1;
        }

        if (supported && hasMeaning) {
          correct.push(name);
        } else if ((rules.looseMethodTerms || []).indexOf(name) !== -1 && hasMeaning) {
          loose.push(name);
        } else if (looseOnly && hasMeaning) {
          loose.push(name);
        } else if ((rules.looseMethodTerms || []).indexOf(name) !== -1) {
          generic.push(name);
        } else {
          serious.push(name);
        }
      });

      return {
        correct: uniqueArray(correct),
        loose: uniqueArray(loose),
        serious: uniqueArray(serious),
        generic: uniqueArray(generic)
      };
    }

    function computeCopyMetricsFromRecords(records) {
      const tokens = recordsToTokens(records);
      const stems = recordsToStems(records);
      const grams4 = buildNgrams(tokens, 4);
      const grams3 = buildNgrams(tokens, 3);
      let bestSentenceDice = 0;
      extract.sentences.forEach(function (sentence) {
        const score = tokenBigramDice(tokens, sentence.tokens);
        if (score > bestSentenceDice) bestSentenceDice = score;
      });
      const extractTokenOverlap = stems.length ? stems.filter(function (token) {
        return extract.stemSet.has(token);
      }).length / stems.length : 0;

      return {
        tokens: tokens,
        stems: stems,
        wholeDice: tokenBigramDice(tokens, extract.tokens),
        ratio4: setOverlapRatio(grams4, extract.grams4),
        ratio3: setOverlapRatio(grams3, extract.grams3),
        bestSentenceDice: bestSentenceDice,
        extractTokenOverlap: extractTokenOverlap,
        longestRun: longestCommonRun(tokens, extract.tokens)
      };
    }

    function buildSentenceSkeleton(text, index) {
      const norm = normaliseText(text);
      const records = getTokenRecords(text, adapters);
      const tokens = recordsToTokens(records);
      const quotedSegments = detectQuotedSegments(text);
      const strongVerbHits = phraseHits(norm, rules.analysisVerbsStrong || []);
      const weakVerbHits = phraseHits(norm, rules.analysisVerbsWeak || []);
      const genericSignals = detectGenericSignals(norm, index === 0);
      const specificEffectHits = phraseHits(norm, rules.specificEffectTerms || []);
      const referential = startsWithCue(text, rules.referentialCues || []);
      const neutralLink = startsWithNeutralLink(text, rules.neutralLinkingPhrases || []);
      const quoteHeavy = quotedSegments.reduce(function (sum, item) { return sum + item.wordCount; }, 0) >= 7 || quotedSegments.length >= 2;
      const hasEvidenceLike = quotedSegments.length > 0 || /blurred and misty|opal and silver|fairy palaces|horribly wet|black, greasy mud|sickening smell|warm humanity|almost stifled|meaningless, staring face|staring in front|same expression|oozing/.test(norm);

      return {
        text: text,
        norm: norm,
        records: records,
        tokens: tokens,
        wordCount: tokens.length,
        quotedSegments: quotedSegments,
        quoteHeavy: quoteHeavy,
        startsReferential: referential,
        startsNeutral: neutralLink,
        hasEvidenceLike: hasEvidenceLike,
        strongVerbHits: strongVerbHits,
        weakVerbHits: weakVerbHits,
        genericSignals: genericSignals,
        specificEffectHits: specificEffectHits
      };
    }

    function buildAnalysisUnits(answerText) {
      const sentences = splitSentences(answerText, adapters).map(function (sentence, index) {
        return buildSentenceSkeleton(sentence, index);
      });
      const units = [];
      const maxCarry = ((rules.unitMergeRules || {}).maxCarrySentences) || 3;
      const shortEvidenceWords = ((rules.unitMergeRules || {}).shortEvidenceWords) || 22;

      for (let i = 0; i < sentences.length; i += 1) {
        const current = sentences[i];
        const unit = { sentences: [current] };

        for (let carry = 1; carry < maxCarry && i + carry < sentences.length; carry += 1) {
          const next = sentences[i + carry];
          const last = unit.sentences[unit.sentences.length - 1];

          const currentLooksLikeLead = (
            last.hasEvidenceLike &&
            (
              last.quoteHeavy ||
              last.wordCount <= shortEvidenceWords ||
              (!last.strongVerbHits.length && !last.specificEffectHits.length && !last.weakVerbHits.length)
            )
          );

          const currentLooksLikeFraming = !last.hasEvidenceLike &&
            last.wordCount <= 22 &&
            (last.specificEffectHits.length > 0 || /(clash between|pattern of|movement from|built around|contrast between|turns .* into|illusion and reality|fantasy and reality)/.test(last.norm));

          const nextLooksLikeFollowUp = (
            next.startsReferential ||
            next.strongVerbHits.length > 0 ||
            next.weakVerbHits.length > 0 ||
            next.specificEffectHits.length > 0 ||
            next.startsNeutral ||
            (next.genericSignals.severeGenericHits.length + next.genericSignals.mildGenericHits.length > 0 && !next.quoteHeavy)
          );

          const nextLooksLikeCarryEvidence = currentLooksLikeFraming && next.hasEvidenceLike;

          if ((currentLooksLikeLead && nextLooksLikeFollowUp) || nextLooksLikeCarryEvidence) {
            unit.sentences.push(next);
            i += 1;
          } else {
            break;
          }
        }
        units.push(unit);
      }
      return units;
    }

    function detectThreadHits(textNorm, groupIds, grounded) {
      const hits = [];
      const combined = uniqueArray([].concat(
        grounded.supportedEffectHits || [],
        grounded.supportedInterpretationHits || [],
        grounded.highEffectHits || [],
        grounded.comparisonHits || [],
        grounded.writerChoiceHits || []
      ));
      (config.conceptThreads || []).forEach(function (thread) {
        const groupHit = (thread.groups || []).some(function (group) {
          return (groupIds || []).indexOf(group) !== -1;
        });
        const directTermHit = (thread.terms || []).some(function (term) {
          return containsPhrase(textNorm, term);
        });
        const groundedTermHit = combined.some(function (item) {
          return (thread.terms || []).indexOf(item) !== -1;
        });
        const score = (groupHit ? 1 : 0) + (directTermHit ? 1 : 0) + (groundedTermHit ? 1 : 0);

        if (thread.id === "contrast_fantasy_reality") {
          if ((grounded.comparisonHits || []).length && groupHit) {
            hits.push(thread.id);
          } else if (score >= 3) {
            hits.push(thread.id);
          }
        } else if (score >= 2) {
          hits.push(thread.id);
        }
      });
      return uniqueArray(hits);
    }

    function detectAnchorProfile(textNorm) {
      const labels = Object.keys(config.anchorComments || {});
      const scores = {};
      labels.forEach(function (label) {
        const results = anchorSearch(textNorm, label);
        if (results.length) {
          const best = results[0];
          scores[label] = 1 - clamp(best.score || 1, 0, 1);
        } else {
          scores[label] = 0;
        }
      });
      return scores;
    }

    function classifyUnit(unitObj, previousUnit, unitIndex) {
      const sentenceTexts = unitObj.sentences.map(function (item) { return item.text; });
      const text = sentenceTexts.join(" ");
      const norm = normaliseText(text);
      const records = getTokenRecords(text, adapters);
      const tokens = recordsToTokens(records);
      const directQuotes = getQuoteMatches(norm, records);
      let groupIds = getGroupMatches(norm, records, directQuotes);

      const startsReferential = unitObj.sentences[0] && unitObj.sentences[0].startsReferential;
      const hasDirectEvidence = directQuotes.length > 0;
      if (startsReferential && !hasDirectEvidence && previousUnit && previousUnit.contextQuoteIds.length) {
        groupIds = uniqueArray(groupIds.concat(previousUnit.groupIds || []));
      }

      const contextQuoteIds = hasDirectEvidence
        ? directQuotes.map(function (quote) { return quote.id; })
        : (startsReferential && previousUnit ? previousUnit.contextQuoteIds.slice() : []);
      const contextQuotes = contextQuoteIds.map(function (id) { return quoteMap[id]; }).filter(Boolean);

      const grounded = detectGroundedProfile(norm, records, contextQuoteIds, groupIds);
      const anchorProfile = detectAnchorProfile(norm);
      const strongVerbHits = phraseHits(norm, rules.analysisVerbsStrong || []);
      const weakVerbHits = phraseHits(norm, rules.analysisVerbsWeak || []);
      const genericSignals = detectGenericSignals(norm, unitIndex === 0);
      const weakEvaluativeHits = phraseHits(norm, rules.weakEvaluativePhrases || []);
      const shallowTemplateHits = phraseHits(norm, rules.shallowEffectPhrases || []);
      const simpleValidHits = phraseHits(norm, rules.simpleValidAnalysisPhrases || []);
      const hedging = detectHedging(norm);
      const contradictions = detectContradictions(norm, hedging);
      const methodMentions = detectMethodMentions(norm);
      const unsupported = detectUnsupportedInterpretation(norm, grounded, methodMentions, groupIds, anchorProfile);
      const methodEval = evaluateMethodUse(norm, methodMentions, contextQuotes, groupIds, grounded);
      const threadHits = detectThreadHits(norm, groupIds, grounded);
      const quoteInfo = detectQuotedSegments(text);
      const quoteWordCount = quoteInfo.reduce(function (sum, item) { return sum + item.wordCount; }, 0);
      const copyMetrics = computeCopyMetricsFromRecords(records);

      const hasEvidenceCarrier = hasDirectEvidence || (startsReferential && previousUnit && previousUnit.contextQuoteIds.length > 0);
      const hasReferenceOnly = groupIds.length > 0 && !hasEvidenceCarrier;
      const hasSpecificEffect = grounded.specificEffectHits.length > 0 || simpleValidHits.length > 0;
      const hasHighEffect = grounded.highEffectHits.length > 0;
      const hasSupportedInterpretation = grounded.supportedInterpretationHits.length > 0;
      const hasInterpretiveSignal = grounded.interpretiveSignalHits.length > 0 || grounded.comparisonHits.length > 0;
      const hasWriterChoice = grounded.writerChoiceHits.length > 0;
      const commentaryTokens = records.filter(function (record) {
        return !extract.stemSet.has(record.stem) && !extract.stemSet.has(record.norm);
      }).length;
      const commentaryDensity = tokens.length ? commentaryTokens / tokens.length : 0;
      const severeGenericCount = genericSignals.severeGenericHits.length;
      const mildGenericCount = genericSignals.mildGenericHits.length;
      const softHedgeCount = hedging.softHits.length;
      const hardUncertaintyCount = hedging.hardHits.length;
      const weakAnchorScore = anchorProfile.weak || 0;
      const simpleAnchorScore = anchorProfile.simple || 0;
      const clearAnchorScore = anchorProfile.clear || 0;
      const developedAnchorScore = anchorProfile.developed || 0;
      const perceptiveAnchorScore = anchorProfile.perceptive || 0;
      const unsupportedAnchorScore = anchorProfile.unsupported || 0;
      const analysisLanguage = strongVerbHits.length > 0 ||
        weakVerbHits.length > 0 ||
        hasWriterChoice ||
        grounded.comparisonHits.length > 0 ||
        /seem|seems|feel|feels|reflects|mirrors|conveys|reveals|shows how/.test(norm);
      const meaningfulCommentary = commentaryDensity >= 0.15 || analysisLanguage || hasSpecificEffect || hasSupportedInterpretation || hasWriterChoice || (methodMentions.length > 0 && (hasSpecificEffect || hasSupportedInterpretation || hasWriterChoice));
      const quoteDump = hasDirectEvidence &&
        quoteWordCount >= 10 &&
        !meaningfulCommentary &&
        !hasSpecificEffect &&
        !hasSupportedInterpretation &&
        !hasInterpretiveSignal;
      const copiedUnit = (
        copyMetrics.bestSentenceDice >= (rules.copyThresholds || {}).sentenceDice ||
        (copyMetrics.extractTokenOverlap >= 0.92 && commentaryDensity < 0.08)
      ) &&
        commentaryDensity < 0.12 &&
        !meaningfulCommentary;
      const featureSpotting = (
        methodMentions.length > 0 &&
        !hasSupportedInterpretation &&
        !hasWriterChoice &&
        !hasHighEffect &&
        !hasSpecificEffect &&
        (severeGenericCount > 0 || genericSignals.featureHits.length > 0 || weakEvaluativeHits.length > 0)
      ) || (
        genericSignals.featureHits.length > 0 &&
        !hasSupportedInterpretation &&
        !hasHighEffect &&
        !hasWriterChoice &&
        !hasSpecificEffect
      );
      const quoteHeavyNoComment = hasDirectEvidence && commentaryDensity < 0.13 && !analysisLanguage && !hasWriterChoice && !(methodMentions.length > 0 && (hasSpecificEffect || hasSupportedInterpretation));
      const onlyLiteral = hasSpecificEffect && !hasSupportedInterpretation && !hasHighEffect && !hasInterpretiveSignal && !hasWriterChoice;
      const overlyLongEvidence = quoteWordCount > (((rules.unitMergeRules || {}).maxQuoteWordsForSelective || 8) + 2);
      const tooManyQuotes = directQuotes.length > 3 || quoteWordCount > 14;
      const shallowComment = (
        hasEvidenceCarrier &&
        (shallowTemplateHits.length > 0 || (weakEvaluativeHits.length > 0 && !hasHighEffect && !hasSupportedInterpretation && !hasWriterChoice) || weakAnchorScore > 0.62) &&
        !hasSupportedInterpretation &&
        !hasHighEffect &&
        !hasWriterChoice
      );

      const analysisFragments = clamp(
        (hasSpecificEffect ? 1 : 0) +
        (hasSupportedInterpretation ? 1 : 0) +
        ((hasWriterChoice || grounded.comparisonHits.length > 0 || strongVerbHits.length > 0 || simpleValidHits.length > 0) ? 1 : 0),
        0,
        3
      );

      const listingLike = hasDirectEvidence &&
        directQuotes.length >= 2 &&
        commentaryDensity < 0.28 &&
        !strongVerbHits.length &&
        !weakVerbHits.length &&
        !hasWriterChoice &&
        !(methodMentions.length > 0 && (hasSpecificEffect || hasSupportedInterpretation)) &&
        analysisFragments <= 1 &&
        !hasSpecificEffect &&
        !hasSupportedInterpretation;

      let qualityScore = 0;
      if (hasEvidenceCarrier) qualityScore += 0.56;
      if (hasSpecificEffect) qualityScore += 0.5;
      if (hasSupportedInterpretation) qualityScore += 1.02;
      if (hasHighEffect) qualityScore += 0.56;
      if (hasInterpretiveSignal) qualityScore += 0.24;
      if (hasWriterChoice) qualityScore += 0.48;
      if (strongVerbHits.length) qualityScore += 0.34;
      if (weakVerbHits.length && (hasSpecificEffect || hasSupportedInterpretation)) qualityScore += 0.08;
      if (threadHits.length) qualityScore += 0.22 * Math.min(threadHits.length, 2);
      if (simpleAnchorScore > 0.56) qualityScore += 0.12;
      if (clearAnchorScore > 0.58) qualityScore += 0.18;
      if (developedAnchorScore > 0.58) qualityScore += 0.28;
      if (perceptiveAnchorScore > 0.62) qualityScore += 0.34;
      if (methodEval.correct.length) qualityScore += 0.18;
      if (commentaryDensity >= 0.22) qualityScore += 0.2;

      qualityScore -= severeGenericCount * 0.56;
      qualityScore -= mildGenericCount * 0.04;
      qualityScore -= genericSignals.featureHits.length * 0.24;
      qualityScore -= shallowTemplateHits.length * 0.46;
      qualityScore -= Math.max(0, weakEvaluativeHits.length - (hasSpecificEffect ? 1 : 0)) * 0.1;
      qualityScore -= weakAnchorScore > 0.62 ? 0.4 : 0;
      qualityScore -= hardUncertaintyCount * 0.52;
      qualityScore -= Math.max(0, softHedgeCount - 1) * 0.05;
      qualityScore -= contradictions.length * 0.82;
      qualityScore -= unsupported.length * 1.0;
      qualityScore -= unsupportedAnchorScore > 0.62 && !hasSupportedInterpretation ? 0.42 : 0;
      qualityScore -= methodEval.serious.length * 0.5;
      qualityScore -= featureSpotting ? 0.62 : 0;
      qualityScore -= quoteDump ? 0.78 : 0;
      qualityScore -= copiedUnit ? 1.12 : 0;
      qualityScore -= quoteHeavyNoComment ? 0.58 : 0;
      qualityScore -= overlyLongEvidence && !hasSupportedInterpretation ? 0.26 : 0;
      qualityScore -= tooManyQuotes && commentaryDensity < 0.42 ? 0.42 : 0;
      qualityScore -= tooManyQuotes && !(hasWriterChoice || grounded.comparisonHits.length > 0 || threadHits.length > 0) ? 0.24 : 0;
      qualityScore -= genericSignals.genericOpening && !(hasSupportedInterpretation || hasHighEffect || hasWriterChoice) ? 0.03 : 0;

      const seriousMethodWithoutMeaning = methodEval.serious.length > 0 && !hasSpecificEffect && !hasSupportedInterpretation && !hasHighEffect && !hasWriterChoice;
      const seriousMethodWithMeaning = methodEval.serious.length > 0 && !seriousMethodWithoutMeaning;
      const mostlyNeutral = genericSignals.neutralLink && !hasEvidenceCarrier && !hasReferenceOnly && !meaningfulCommentary;

      let classification = "neutral";
      if (mostlyNeutral) {
        classification = "neutral";
      } else if (copiedUnit) {
        classification = "copied_extract";
      } else if ((unsupported.length >= 2 && !(hasSupportedInterpretation && hasHighEffect)) || (unsupported.length && !hasSupportedInterpretation && !hasHighEffect)) {
        classification = "unsupported_interpretation";
      } else if (quoteDump) {
        classification = "quote_dump";
      } else if (featureSpotting) {
        classification = "feature_spotting";
      } else if (listingLike || quoteHeavyNoComment) {
        classification = "reference_only";
      } else if (shallowComment) {
        classification = "shallow_comment";
      } else if (
        hasEvidenceCarrier &&
        meaningfulCommentary &&
        qualityScore >= 4.0 &&
        hasSupportedInterpretation &&
        (hasHighEffect || hasWriterChoice || grounded.comparisonHits.length > 0 || threadHits.length >= 2) &&
        (
          perceptiveAnchorScore >= Math.max(clearAnchorScore, developedAnchorScore) * 0.98 ||
          (hasWriterChoice && hasHighEffect) ||
          (grounded.comparisonHits.length > 0 && threadHits.length >= 1 && hasWriterChoice) ||
          (threadHits.length >= 3 && quoteCount <= 3 && commentaryDensity >= 0.42)
        ) &&
        !(tooManyQuotes && !hasWriterChoice) &&
        severeGenericCount === 0 &&
        hardUncertaintyCount === 0 &&
        unsupported.length === 0
      ) {
        classification = "perceptive_analysis";
      } else if (
        hasEvidenceCarrier &&
        meaningfulCommentary &&
        qualityScore >= 2.95 &&
        (hasSupportedInterpretation || hasHighEffect) &&
        (hasWriterChoice || grounded.comparisonHits.length > 0 || strongVerbHits.length > 0 || threadHits.length >= 1 || developedAnchorScore > 0.6) &&
        !(tooManyQuotes && !(hasWriterChoice || grounded.comparisonHits.length > 0 || threadHits.length > 0))
      ) {
        classification = "developed_analysis";
      } else if (
        hasEvidenceCarrier &&
        meaningfulCommentary &&
        qualityScore >= 1.78 &&
        (
          hasSupportedInterpretation ||
          hasWriterChoice ||
          strongVerbHits.length > 0 ||
          analysisFragments >= 2 ||
          (hasSpecificEffect && commentaryDensity >= 0.18 && !shallowComment) ||
          clearAnchorScore > 0.56 ||
          simpleAnchorScore > 0.6
        )
      ) {
        classification = "clear_analysis";
      } else if (
        hasEvidenceCarrier &&
        meaningfulCommentary &&
        qualityScore >= 0.98 &&
        (hasSpecificEffect || weakVerbHits.length > 0 || hasSupportedInterpretation || simpleValidHits.length > 0) &&
        !shallowComment
      ) {
        classification = "simple_analysis";
      } else if ((hasEvidenceCarrier || hasReferenceOnly) && (onlyLiteral || phraseHits(norm, rules.literalEffectTerms || []).length > 0)) {
        classification = "literal_comment";
      } else if (severeGenericCount > 0 || (genericSignals.genericOpening && !meaningfulCommentary)) {
        classification = "generic_comment";
      } else if (hasEvidenceCarrier || hasReferenceOnly) {
        classification = "reference_only";
      }

      if (classification === "perceptive_analysis" && (mildGenericCount > 2 || softHedgeCount > 1)) {
        classification = "developed_analysis";
      }
      if (classification === "perceptive_analysis" && tooManyQuotes && !(hasWriterChoice || grounded.comparisonHits.length > 0 || threadHits.length >= 2)) {
        classification = "developed_analysis";
      }
      if (classification === "developed_analysis" && severeGenericCount > 0 && !hasHighEffect && !hasWriterChoice) {
        classification = "clear_analysis";
      }
      if (classification === "developed_analysis" && !hasSupportedInterpretation && !threadHits.length) {
        classification = "clear_analysis";
      }
      if (classification === "developed_analysis" && !hasHighEffect && !hasWriterChoice && grounded.comparisonHits.length === 0 && threadHits.length === 0 && commentaryDensity < 0.42) {
        classification = "clear_analysis";
      }
      if (classification === "developed_analysis" && tooManyQuotes && !(hasWriterChoice || grounded.comparisonHits.length > 0 || threadHits.length > 0) && commentaryDensity < 0.42) {
        classification = "clear_analysis";
      }
      if (classification === "clear_analysis" && onlyLiteral && !hasSupportedInterpretation && !hasWriterChoice && threadHits.length === 0) {
        classification = "simple_analysis";
      }
      if (classification === "clear_analysis" && tooManyQuotes && !hasSupportedInterpretation && commentaryDensity < 0.36) {
        classification = "simple_analysis";
      }
      if (classification === "clear_analysis" && severeGenericCount > 0 && !hasHighEffect && !hasSupportedInterpretation && clearAnchorScore < 0.56) {
        classification = "simple_analysis";
      }
      if (classification === "simple_analysis" && (severeGenericCount > 0 || shallowComment) && !hasSupportedInterpretation && !hasHighEffect) {
        classification = hasSpecificEffect ? "literal_comment" : "shallow_comment";
      }
      if (classification === "shallow_comment" && hasSupportedInterpretation) {
        classification = "simple_analysis";
      }
      if (classification === "literal_comment" && severeGenericCount > 0 && !hasSpecificEffect) {
        classification = "generic_comment";
      }
      if ((classification === "clear_analysis" || classification === "developed_analysis") && commentaryDensity < 0.1 && !analysisLanguage) {
        classification = "reference_only";
      }
      if (directQuotes.length >= 4 && !(hasWriterChoice || grounded.comparisonHits.length > 0) && classification === "developed_analysis") {
        classification = "clear_analysis";
      }
      if (directQuotes.length >= 4 && !hasSupportedInterpretation && classification === "clear_analysis") {
        classification = "simple_analysis";
      }
      if (seriousMethodWithMeaning) {
        if (classification === "perceptive_analysis") {
          classification = "developed_analysis";
        } else if (classification === "developed_analysis") {
          classification = "clear_analysis";
        } else if (classification === "clear_analysis") {
          classification = "simple_analysis";
        }
      }
      if (unsupported.length && classification === "perceptive_analysis") {
        classification = "developed_analysis";
      }
      if (genericSignals.neutralLink && !hasEvidenceCarrier && !hasReferenceOnly) {
        classification = "neutral";
      }

      return {
        text: text,
        sentenceTexts: sentenceTexts,
        norm: norm,
        records: records,
        tokens: tokens,
        groupIds: groupIds,
        contextQuoteIds: contextQuoteIds,
        quoteIds: directQuotes.map(function (quote) { return quote.id; }),
        quoteTexts: directQuotes.map(function (quote) { return quote.text; }),
        hasDirectEvidence: hasDirectEvidence,
        hasEvidenceCarrier: hasEvidenceCarrier,
        hasReferenceOnly: hasReferenceOnly,
        startsReferential: startsReferential,
        grounded: grounded,
        strongVerbHits: strongVerbHits,
        weakVerbHits: weakVerbHits,
        genericSignals: genericSignals,
        weakEvaluativeHits: weakEvaluativeHits,
        shallowTemplateHits: shallowTemplateHits,
        simpleValidHits: simpleValidHits,
        hedging: hedging,
        contradictions: contradictions,
        unsupported: unsupported,
        methodMentions: methodMentions.map(function (item) { return item.canonical; }),
        methodEval: methodEval,
        threadHits: threadHits,
        anchorProfile: anchorProfile,
        quoteWordCount: quoteWordCount,
        quoteCount: directQuotes.length,
        commentaryDensity: commentaryDensity,
        copyMetrics: copyMetrics,
        qualityScore: Number(qualityScore.toFixed(2)),
        classification: classification,
        analysisFragments: analysisFragments,
        flags: {
          hasSpecificEffect: hasSpecificEffect,
          hasHighEffect: hasHighEffect,
          hasSupportedInterpretation: hasSupportedInterpretation,
          hasWriterChoice: hasWriterChoice,
          quoteDump: quoteDump,
          featureSpotting: featureSpotting,
          meaningfulCommentary: meaningfulCommentary,
          overlyLongEvidence: overlyLongEvidence,
          shallowComment: shallowComment
        }
      };
    }

    function analyseCopying(answerRecords, units) {
      const tokens = recordsToTokens(answerRecords);
      const stems = recordsToStems(answerRecords);
      const answer4Grams = buildNgrams(tokens, 4);
      const answer3Grams = buildNgrams(tokens, 3);
      const extractTokenShare = stems.length ? stems.filter(function (token) {
        return extract.stemSet.has(token);
      }).length / stems.length : 0;
      const copiedUnitRatio = units.length ? units.filter(function (item) {
        return item.classification === "copied_extract";
      }).length / units.length : 0;
      const liftedPhraseCount = config.quoteBank.filter(function (quote) {
        return containsPhrase(answerRecords.map(function (record) { return record.text; }).join(" "), quote.text);
      }).length;

      return {
        wholeDice: tokenBigramDice(tokens, extract.tokens),
        fourGramRatio: setOverlapRatio(answer4Grams, extract.grams4),
        threeGramRatio: setOverlapRatio(answer3Grams, extract.grams3),
        extractTokenShare: extractTokenShare,
        copiedUnitRatio: copiedUnitRatio,
        liftedPhraseCount: liftedPhraseCount,
        longestRun: longestCommonRun(tokens, extract.tokens)
      };
    }

    function computeCoverage(units) {
      const reference = new Set();
      const supported = new Set();
      const analytical = new Set();
      const interpretive = new Set();

      units.forEach(function (unit) {
        unit.groupIds.forEach(function (id) { reference.add(id); });
        if (["simple_analysis", "clear_analysis", "developed_analysis", "perceptive_analysis"].indexOf(unit.classification) !== -1) {
          unit.groupIds.forEach(function (id) { supported.add(id); });
        }
        if (["clear_analysis", "developed_analysis", "perceptive_analysis"].indexOf(unit.classification) !== -1) {
          unit.groupIds.forEach(function (id) { analytical.add(id); });
        }
        if (["developed_analysis", "perceptive_analysis"].indexOf(unit.classification) !== -1) {
          unit.groupIds.forEach(function (id) { interpretive.add(id); });
        }
      });

      return {
        referenceGroups: Array.from(reference),
        supportedGroups: Array.from(supported),
        analyticalGroups: Array.from(analytical),
        interpretiveGroups: Array.from(interpretive)
      };
    }

    function evaluateEvidence(units) {
      const attached = [];
      const usable = [];
      const selective = [];
      const judicious = [];
      const dumped = [];

      units.forEach(function (unit) {
        if (!(unit.hasDirectEvidence || unit.startsReferential)) return;
        if (["quote_dump", "reference_only", "copied_extract"].indexOf(unit.classification) !== -1) {
          dumped.push(unit);
          return;
        }
        if (["simple_analysis", "clear_analysis", "developed_analysis", "perceptive_analysis"].indexOf(unit.classification) !== -1) {
          attached.push(unit);
        }
        if (["clear_analysis", "developed_analysis", "perceptive_analysis"].indexOf(unit.classification) !== -1) {
          usable.push(unit);
          if (
            unit.quoteWordCount <= ((rules.unitMergeRules || {}).maxQuoteWordsForSelective || 8) + 1 &&
            unit.quoteCount <= 3 &&
            ((unit.classification !== "clear_analysis" && unit.commentaryDensity >= 0.14) || unit.commentaryDensity >= 0.18)
          ) {
            selective.push(unit);
            if (
              (unit.classification === "perceptive_analysis" || unit.classification === "developed_analysis") &&
              unit.quoteWordCount <= 10 &&
              unit.quoteCount <= 2 &&
              unit.genericSignals.severeGenericHits.length === 0 &&
              unit.commentaryDensity >= 0.24 &&
              (
                unit.grounded.writerChoiceHits.length > 0 ||
                unit.methodEval.correct.length > 0 ||
                unit.threadHits.length > 0
              )
            ) {
              judicious.push(unit);
            }
          }
        }
      });

      return {
        attachedCount: attached.length,
        usableCount: usable.length,
        selectiveCount: selective.length,
        judiciousCount: judicious.length,
        dumpedCount: dumped.length
      };
    }

    function evaluateThreads(units) {
      const counts = {};
      const analyticalCounts = {};
      const developedCounts = {};
      const groupSpan = {};
      units.forEach(function (unit) {
        (unit.threadHits || []).forEach(function (id) {
          counts[id] = (counts[id] || 0) + 1;
          if (!groupSpan[id]) groupSpan[id] = new Set();
          (unit.groupIds || []).forEach(function (groupId) {
            const thread = threadMap[id];
            if (!thread || !thread.groups || thread.groups.indexOf(groupId) !== -1) {
              groupSpan[id].add(groupId);
            }
          });
          if (["clear_analysis", "developed_analysis", "perceptive_analysis"].indexOf(unit.classification) !== -1) {
            analyticalCounts[id] = (analyticalCounts[id] || 0) + 1;
          }
          if (["developed_analysis", "perceptive_analysis"].indexOf(unit.classification) !== -1) {
            developedCounts[id] = (developedCounts[id] || 0) + 1;
          }
        });
      });
      const sustained = Object.keys(analyticalCounts).filter(function (id) {
        return analyticalCounts[id] >= 2;
      });
      const deepened = Object.keys(analyticalCounts).filter(function (id) {
        const span = groupSpan[id] ? groupSpan[id].size : 0;
        return (analyticalCounts[id] >= 2 && (developedCounts[id] >= 1 || span >= 2 || analyticalCounts[id] >= 3)) || (span >= 2 && (developedCounts[id] || 0) >= 1);
      });
      const strengths = Object.keys(analyticalCounts).map(function (id) {
        const span = groupSpan[id] ? groupSpan[id].size : 0;
        return analyticalCounts[id] + (developedCounts[id] || 0) * 0.7 + span * 0.35;
      });
      return {
        counts: counts,
        analyticalCounts: analyticalCounts,
        developedCounts: developedCounts,
        groupSpan: Object.fromEntries(Object.keys(groupSpan).map(function (id) { return [id, groupSpan[id].size]; })),
        sustainedThreads: sustained,
        sustainedCount: sustained.length,
        deepenedThreads: deepened,
        deepenedCount: deepened.length,
        dominantThreadCount: strengths.length ? Math.max.apply(null, strengths) : 0
      };
    }

    function evaluateFocus(aggregate) {
      const total = aggregate.totalUnits || 1;
      if (!aggregate.creditworthyCount) return 0;
      const positive = (
        aggregate.perceptiveCount * 1.35 +
        aggregate.developedCount * 1.1 +
        aggregate.clearCount * 0.9 +
        aggregate.simpleCount * 0.58 +
        aggregate.shallowCount * 0.14 +
        aggregate.literalCount * 0.18
      );
      const drag = (
        aggregate.genericCount * 0.36 +
        aggregate.featureSpottingCount * 0.48 +
        aggregate.referenceOnlyCount * 0.28 +
        aggregate.quoteDumpCount * 0.74 +
        aggregate.unsupportedCount * 0.92 +
        aggregate.copiedCount * 1.2
      );
      const focusIndex = (positive - drag) / total;
      if (focusIndex <= 0.08) return 1;
      if (focusIndex <= 0.4) return 2;
      if (focusIndex <= 0.8) return 3;
      return 4;
    }

    function evaluateAccuracy(aggregate) {
      let score = 4;
      score -= aggregate.unsupportedCount * 0.9;
      score -= aggregate.seriousMethodMisuseCount * 0.45;
      score -= aggregate.contradictionCount * 0.65;
      score -= aggregate.hardUncertaintyCount * 0.35;
      score -= Math.max(0, aggregate.softHedgeCount - 2) * 0.05;
      if (aggregate.copyingStrong) score -= 2.5;
      return clamp(Number(score.toFixed(2)), 0, 4);
    }

    function determineInputState(answerText, answerNorm, answerRecords, units, copyMetrics, aggregate) {
      const words = answerRecords.length;
      const nonAnswerHits = phraseHits(answerNorm, rules.nonAnswerPhrases || []);
      const avgCommentaryDensity = units.length ? units.reduce(function (sum, unit) { return sum + (unit.commentaryDensity || 0); }, 0) / units.length : 0;
      if (!answerNorm) {
        return { status: "blank", mark: 0, level: "Level 0", reason: "Blank response." };
      }
      if (words < rules.minCompleteWords && aggregate.creditworthyCount === 0) {
        return { status: "incomplete", mark: 0, level: "Level 0", reason: "Incomplete response." };
      }

      const copiedLike = (
        copyMetrics.wholeDice >= (rules.copyThresholds || {}).wholeDice ||
        copyMetrics.extractTokenShare >= (rules.copyThresholds || {}).extractShare ||
        copyMetrics.fourGramRatio >= 0.9 ||
        copyMetrics.copiedUnitRatio >= 0.8 ||
        copyMetrics.longestRun >= (rules.copyThresholds || {}).longRun
      );
      const exactCopyLike = (
        copyMetrics.wholeDice >= 0.94 ||
        copyMetrics.extractTokenShare >= 0.86 ||
        copyMetrics.longestRun >= 24
      );
      const paraphraseLike = (
        copyMetrics.wholeDice >= (rules.copyThresholds || {}).nearDice ||
        (copyMetrics.extractTokenShare >= (rules.copyThresholds || {}).paraphraseShare &&
         copyMetrics.threeGramRatio >= (rules.copyThresholds || {}).threeGramRatio) ||
        copyMetrics.copiedUnitRatio >= 0.5
      );

      if (exactCopyLike && avgCommentaryDensity < 0.08) {
        return { status: "copied_extract", mark: 0, level: "Level 0", reason: "The response is effectively the extract, not an answer." };
      }
      if (
        copiedLike &&
        (
          aggregate.creditworthyCount === 0 ||
          (
            aggregate.developedCount + aggregate.perceptiveCount + aggregate.clearCount <= 1 &&
            aggregate.evidence.usableCount === 0 &&
            aggregate.clearEquivalent < 1.6 &&
            aggregate.evidence.selectiveCount === 0
          )
        )
      ) {
        return { status: "copied_extract", mark: 0, level: "Level 0", reason: "The response is effectively the extract, not an answer." };
      }
      if (
        paraphraseLike &&
        (
          (aggregate.developedCount + aggregate.perceptiveCount + aggregate.clearCount === 0 && aggregate.simpleCount === 0) ||
          (aggregate.evidence.usableCount === 0 && aggregate.clearEquivalent < 1.5 && aggregate.referenceOnlyCount + aggregate.quoteDumpCount + aggregate.genericCount >= Math.max(1, units.length - 1))
        )
      ) {
        return { status: "paraphrased_extract", mark: 0, level: "Level 0", reason: "The response stays too close to the extract and does not add creditworthy analysis." };
      }
      if (nonAnswerHits.length && aggregate.creditworthyCount === 0 && aggregate.referenceOnlyCount === 0) {
        return { status: "not_answer", mark: 0, level: "Level 0", reason: "The response does not answer the task." };
      }
      return { status: "answer", mark: null, level: null, reason: "Creditworthy answer detected." };
    }

    function computeDimensionScores(aggregate) {
      const weakRatio = aggregate.totalUnits ? (
        aggregate.genericCount +
        aggregate.featureSpottingCount +
        aggregate.referenceOnlyCount +
        aggregate.quoteDumpCount +
        aggregate.shallowCount * 0.75 +
        aggregate.literalCount * 0.45
      ) / aggregate.totalUnits : 1;

      const evidenceQuality = clamp(
        aggregate.evidence.attachedCount * 0.42 +
        aggregate.evidence.usableCount * 0.86 +
        aggregate.evidence.selectiveCount * 0.95 +
        aggregate.evidence.judiciousCount * 0.84 -
        aggregate.evidence.dumpedCount * 0.78 -
        Math.max(0, aggregate.referenceOnlyCount - 1) * 0.12,
        0,
        4.4
      );
      const coverageQuality = clamp(
        aggregate.coverage.supportedGroups.length * 0.44 +
        aggregate.coverage.analyticalGroups.length * 0.88 +
        aggregate.coverage.interpretiveGroups.length * 1.02 -
        Math.max(0, aggregate.coverage.referenceGroups.length - aggregate.coverage.supportedGroups.length) * 0.08,
        0,
        4.4
      );
      const explanationQuality = clamp(
        aggregate.clearEquivalent * 0.92 +
        aggregate.analysisFragmentCount * 0.12 +
        aggregate.simpleCount * 0.14 -
        aggregate.shallowCount * 0.14 -
        aggregate.featureSpottingCount * 0.34 -
        aggregate.genericCount * 0.12 -
        aggregate.quoteDumpCount * 0.38,
        0,
        4.4
      );
      const interpretationDepth = clamp(
        aggregate.perceptiveCount * 1.28 +
        aggregate.developedCount * 0.96 +
        aggregate.coverage.interpretiveGroups.length * 0.34 +
        aggregate.threadData.deepenedCount * 0.5 +
        aggregate.correctMethodLinks * 0.04 -
        aggregate.unsupportedCount * 0.92 -
        aggregate.literalCount * 0.16 -
        aggregate.shallowCount * 0.22 -
        aggregate.hardUncertaintyCount * 0.16,
        0,
        4.4
      );
      const accuracy = clamp(
        aggregate.accuracyScore - Math.max(0, aggregate.looseMethodCount - aggregate.correctMethodLinks) * 0.03,
        0,
        4
      );
      const control = clamp(
        aggregate.focusScore * 0.9 + (aggregate.creditworthyCount / Math.max(aggregate.totalUnits || 1, 1)) * 0.92 - weakRatio * 0.42 - aggregate.genericOpeningCount * 0.04,
        0,
        4
      );
      const taskFocus = clamp(
        aggregate.focusScore + (aggregate.coverage.supportedGroups.length >= 2 ? 0.2 : 0) - aggregate.genericOpeningCount * 0.03,
        0,
        4
      );
      return {
        evidenceQuality: Number(evidenceQuality.toFixed(2)),
        coverageQuality: Number(coverageQuality.toFixed(2)),
        explanationQuality: Number(explanationQuality.toFixed(2)),
        interpretationDepth: Number(interpretationDepth.toFixed(2)),
        accuracy: Number(accuracy.toFixed(2)),
        control: Number(control.toFixed(2)),
        taskFocus: Number(taskFocus.toFixed(2)),
        weakRatio: Number(weakRatio.toFixed(2)),
        developedLike: Number((aggregate.perceptiveCount * 1.65 + aggregate.developedCount * 1.18 + aggregate.clearCount * 0.18).toFixed(2))
      };
    }

    function buildFeatureVector(aggregate, dimensionScores, inputState) {
      const total = Math.max(aggregate.totalUnits || 1, 1);
      return [
        inputState.status === "answer" ? 1 : 0,
        aggregate.perceptiveCount / total,
        aggregate.developedCount / total,
        aggregate.clearCount / total,
        aggregate.simpleCount / total,
        aggregate.literalCount / total,
        aggregate.featureSpottingCount / total,
        aggregate.genericCount / total,
        aggregate.referenceOnlyCount / total,
        aggregate.quoteDumpCount / total,
        aggregate.unsupportedCount / total,
        aggregate.seriousMethodMisuseCount / total,
        aggregate.softHedgeCount / total,
        aggregate.hardUncertaintyCount / total,
        aggregate.coverage.referenceGroups.length / 5,
        aggregate.coverage.supportedGroups.length / 5,
        aggregate.coverage.analyticalGroups.length / 5,
        aggregate.coverage.interpretiveGroups.length / 5,
        aggregate.evidence.attachedCount / total,
        aggregate.evidence.usableCount / total,
        aggregate.evidence.selectiveCount / total,
        aggregate.evidence.judiciousCount / total,
        aggregate.clearEquivalent / 4,
        aggregate.analysisFragmentCount / 12,
        dimensionScores.evidenceQuality / 4.4,
        dimensionScores.coverageQuality / 4.4,
        dimensionScores.explanationQuality / 4.4,
        dimensionScores.interpretationDepth / 4.4,
        dimensionScores.accuracy / 4,
        dimensionScores.control / 4,
        dimensionScores.taskFocus / 4,
        dimensionScores.weakRatio,
        dimensionScores.developedLike / 4,
        aggregate.focusScore / 4,
        aggregate.accuracyScore / 4,
        aggregate.correctMethodLinks / Math.max(total, 1),
        aggregate.threadData.sustainedCount / 4,
        aggregate.threadData.dominantThreadCount / 4
      ];
    }

    function vectorDistance(vectorA, vectorB) {
      let sum = 0;
      for (let i = 0; i < vectorA.length; i += 1) {
        const diff = (vectorA[i] || 0) - (vectorB[i] || 0);
        sum += diff * diff;
      }
      return Math.sqrt(sum / Math.max(vectorA.length, 1));
    }

    function markToLevel(mark) {
      if (mark === 0) return "Level 0";
      if (mark <= 2) return "Level 1";
      if (mark <= 4) return "Level 2";
      if (mark <= 6) return "Level 3";
      return "Level 4";
    }

    function buildHelperModel() {
      const helperRules = rules.hybridHelper || {};
      if (!helperRules.enabled || !Array.isArray(config.calibrationCases) || !config.calibrationCases.length) {
        return null;
      }
      const items = [];
      config.calibrationCases.forEach(function (testCase) {
        const base = analyseBaseAnswer(testCase.answer);
        const vector = buildFeatureVector(base.aggregate, base.dimensionScores, base.inputState);
        items.push({
          id: testCase.id,
          label: testCase.label,
          expectedMark: testCase.expectedMark,
          vector: vector
        });
      });
      const centroidMap = {};
      items.forEach(function (item) {
        if (!centroidMap[item.expectedMark]) centroidMap[item.expectedMark] = [];
        centroidMap[item.expectedMark].push(item.vector);
      });
      const centroids = Object.keys(centroidMap).map(function (markKey) {
        const vectors = centroidMap[markKey];
        const centroid = vectors[0].map(function (_, index) {
          return vectors.reduce(function (sum, vector) { return sum + vector[index]; }, 0) / vectors.length;
        });
        return { mark: Number(markKey), vector: centroid, count: vectors.length };
      });
      return { items: items, centroids: centroids };
    }

    function predictHelperMark(baseResult) {
      const helperRules = rules.hybridHelper || {};
      if (!helperModel || !helperRules.enabled || baseResult.inputState.status !== "answer") {
        return null;
      }
      const vector = buildFeatureVector(baseResult.aggregate, baseResult.dimensionScores, baseResult.inputState);
      const nearest = helperModel.items.map(function (item) {
        return {
          id: item.id,
          label: item.label,
          mark: item.expectedMark,
          distance: vectorDistance(vector, item.vector)
        };
      }).sort(function (a, b) { return a.distance - b.distance; }).slice(0, Math.min(helperRules.k || 7, helperModel.items.length));

      let weightTotal = 0;
      let markWeighted = 0;
      const markWeights = {};
      nearest.forEach(function (item) {
        const weight = 1 / (item.distance + 0.08);
        weightTotal += weight;
        markWeighted += item.mark * weight;
        markWeights[item.mark] = (markWeights[item.mark] || 0) + weight;
      });
      const knnRaw = weightTotal ? markWeighted / weightTotal : baseResult.ruleMarkData.mark;

      let centroidTotal = 0;
      let centroidWeighted = 0;
      helperModel.centroids.forEach(function (item) {
        const weight = 1 / (vectorDistance(vector, item.vector) + 0.12);
        centroidTotal += weight;
        centroidWeighted += item.mark * weight;
      });
      const centroidRaw = centroidTotal ? centroidWeighted / centroidTotal : knnRaw;
      const rawMark = knnRaw * 0.72 + centroidRaw * 0.28;
      const suggestedMark = clamp(Math.round(rawMark), 0, config.maxMark);
      const topNeighborWeight = Math.max.apply(null, Object.keys(markWeights).map(function (key) { return markWeights[key]; }).concat([0]));
      const agreement = weightTotal ? topNeighborWeight / weightTotal : 0;
      const confidence = clamp(agreement * 0.76 + (nearest.length && nearest[0].distance < 0.16 ? 0.2 : 0), 0, 1);
      return {
        rawMark: Number(rawMark.toFixed(2)),
        suggestedMark: suggestedMark,
        confidence: Number(confidence.toFixed(2)),
        nearest: nearest
      };
    }

    function buildEvidenceDescriptor(aggregate, mark) {
      if (mark === 0) return "No creditworthy evidence";
      if (mark === 8 && aggregate.evidence.judiciousCount >= 2) return "Judicious, sharply chosen quotations";
      if (mark >= 7 && aggregate.evidence.selectiveCount >= 2) return "Mostly selective quotations linked to developed points";
      if (mark >= 6 && aggregate.evidence.usableCount >= 2) return "Apt quotations usually linked to clear analysis";
      if (mark >= 5 && aggregate.evidence.attachedCount >= 1) return "Relevant quotations support the commentary";
      if (mark >= 3 && aggregate.evidence.attachedCount >= 1) return "Some quotation use, but not always selective or well-used";
      if (aggregate.coverage.referenceGroups.length) return "References are present, but often obvious or listed";
      return "Little usable evidence";
    }

    function buildAnalysisDescriptor(aggregate, mark) {
      if (mark === 0) return "No creditworthy analysis";
      if (mark === 8) return "Sustained perceptive analysis";
      if (mark === 7) return "Strong, developed analysis with clear interpretation";
      if (mark === 6) return "Clear analysis with some developed interpretation";
      if (mark === 5) return "Clear relevant explanation";
      if (mark === 4) return "Some explanation, but often simple or obvious";
      if (mark === 3) return "Some relevant explanation, but uneven or limited";
      if (aggregate.featureSpottingCount) return "Feature spotting rather than full analysis";
      if (aggregate.referenceOnlyCount || aggregate.quoteDumpCount) return "Retelling or quotation without real analysis";
      return "Simple or generic comments";
    }

    function buildCoverageDescriptor(aggregate, mark) {
      if (mark >= 7 && aggregate.coverage.interpretiveGroups.length >= 3) return "Several parts of the extract are analysed with a sustained line of interpretation.";
      if (mark >= 5 && aggregate.coverage.analyticalGroups.length >= 2) return "More than one part of the extract is analysed, not merely mentioned.";
      if (aggregate.coverage.supportedGroups.length >= 2) return "Several parts are covered, but analytical depth is uneven.";
      if (aggregate.coverage.referenceGroups.length >= 1) return "Some relevant reference coverage, but limited analytical range.";
      return "Very limited coverage.";
    }

    function buildBoundaryReasons(aggregate, mark, inputState) {
      const reasons = [];
      if (inputState.status !== "answer") return reasons;

      if (mark === 8) {
        reasons.push("Perceptive analysis is dominant across the response rather than appearing only once or twice.");
      } else if (mark === 7) {
        reasons.push("The response is strongly developed and interpretive, but it is not consistently top-band enough for 8.");
        if (aggregate.evidence.judiciousCount < 2) reasons.push("Evidence is selective rather than fully judicious throughout.");
        if (aggregate.threadData.deepenedCount < 2) reasons.push("The conceptual thread is present, but not deepened often enough for full marks.");
      } else if (mark === 6) {
        reasons.push("The response is mostly clear and developed rather than dominantly perceptive.");
        if (aggregate.threadData.deepenedCount < 1 || aggregate.coverage.interpretiveGroups.length < 2) reasons.push("There is not enough sustained conceptual development for secure Level 4.");
      } else if (mark === 5) {
        reasons.push("The response is clearly relevant, but interpretation remains mainly straightforward.");
      } else if (mark === 4) {
        reasons.push("There is some relevant explanation, but it stays basic or obvious too often.");
      } else if (mark <= 3 && inputState.status === "answer") {
        reasons.push("The response does not move beyond simple comment consistently enough.");
      }

      if (aggregate.genericCount > 0 || aggregate.genericOpeningCount > 0) reasons.push("Generic wording weakens the overall quality judgement.");
      if (aggregate.shallowCount > 0) reasons.push("Some comments stay at the level of everyday evaluation rather than precise analysis.");
      if (aggregate.literalCount > 1) reasons.push("Too many comments stay at the level of obvious or literal effect.");
      if (aggregate.unsupportedCount > 0) reasons.push("Unsupported interpretation prevents a higher mark.");
      if (aggregate.seriousMethodMisuseCount > 0) reasons.push("Incorrect method labelling limits the level.");
      if (aggregate.hardUncertaintyCount > 0) reasons.push("Strong uncertainty language reduces precision.");
      return uniqueArray(reasons);
    }

    function determineRuleMark(aggregate, inputState, dimensionScores) {
      if (inputState.status !== "answer") {
        return {
          mark: inputState.mark,
          rawScore: inputState.mark,
          level: inputState.level,
          descriptor: config.levelDescriptors[inputState.level],
          notes: [inputState.reason],
          evidenceDescriptor: "No creditworthy evidence",
          analysisDescriptor: "No creditworthy analysis",
          coverageDescriptor: "No creditworthy coverage",
          boundaryReasons: [],
          bandScores: { 1: 0, 2: 0, 3: 0, 4: 0 },
          chosenBand: 0
        };
      }

      const weakRatio = dimensionScores.weakRatio;
      const developedLike = dimensionScores.developedLike;
      const clearEquivalent = aggregate.clearEquivalent;
      const notes = [];
      const thresholds = rules.scoringThresholds || {};
      const floors = rules.bestFitFloors || {};
      const interpretiveNearZero = dimensionScores.interpretationDepth < 0.85 || (aggregate.developedCount + aggregate.perceptiveCount === 0 && aggregate.threadData.deepenedCount === 0 && aggregate.coverage.interpretiveGroups.length === 0);

      const bandScores = {
        1: 0.48 + aggregate.referenceOnlyCount * 0.3 + aggregate.genericCount * 0.24 + aggregate.quoteDumpCount * 0.52 + aggregate.literalCount * 0.1 + aggregate.shallowCount * 0.16,
        2: dimensionScores.explanationQuality * 0.94 + dimensionScores.evidenceQuality * 0.24 + dimensionScores.coverageQuality * 0.16 + aggregate.simpleCount * 0.18 + aggregate.shallowCount * 0.18 + aggregate.literalCount * 0.12 - aggregate.unsupportedCount * 0.72 - aggregate.quoteDumpCount * 0.34,
        3: dimensionScores.explanationQuality * 1.18 + dimensionScores.evidenceQuality * 0.7 + dimensionScores.coverageQuality * 0.48 + dimensionScores.accuracy * 0.42 + dimensionScores.control * 0.28 + aggregate.clearCount * 0.34 + aggregate.developedCount * 0.28 + aggregate.simpleCount * 0.08 - aggregate.unsupportedCount * 0.8 - aggregate.quoteDumpCount * 0.3 - aggregate.featureSpottingCount * 0.24 - aggregate.shallowCount * 0.08,
        4: dimensionScores.interpretationDepth * 1.64 + dimensionScores.explanationQuality * 0.66 + dimensionScores.evidenceQuality * 0.5 + dimensionScores.coverageQuality * 0.42 + dimensionScores.accuracy * 0.62 + dimensionScores.control * 0.2 + aggregate.perceptiveCount * 0.56 + aggregate.developedCount * 0.44 + aggregate.threadData.deepenedCount * 0.58 - aggregate.unsupportedCount * 1.08 - aggregate.seriousMethodMisuseCount * 0.38 - aggregate.featureSpottingCount * 0.4 - aggregate.shallowCount * 0.22 - aggregate.literalCount * 0.18
      };

      const level4T = thresholds.level4 || {};
      if (aggregate.coverage.interpretiveGroups.length < (level4T.minInterpretiveCoverage || 2)) bandScores[4] -= 1.0;
      if (aggregate.threadData.deepenedCount < (level4T.minSustainedThreads || 1)) bandScores[4] -= 0.96;
      if (aggregate.evidence.usableCount < (level4T.minUsableEvidence || 2)) bandScores[4] -= 0.88;
      if (aggregate.evidence.selectiveCount < (level4T.minSelectiveEvidence || 1)) bandScores[4] -= 0.34;
      if (developedLike < (level4T.minDevelopedLike || 2.05)) bandScores[4] -= 1.18;
      if (weakRatio > (level4T.maxWeakRatio || 0.46)) bandScores[4] -= 0.88;
      if (aggregate.perceptiveCount === 0 && aggregate.threadData.deepenedCount === 0) bandScores[4] -= 0.72;
      if (aggregate.perceptiveCount + aggregate.developedCount < 2) bandScores[4] -= 0.62;

      const level3T = thresholds.level3 || {};
      if (aggregate.coverage.supportedGroups.length < (level3T.minSupportedCoverage || 1)) bandScores[3] -= 0.8;
      if (aggregate.evidence.attachedCount < (level3T.minAttachedEvidence || 1)) bandScores[3] -= 0.82;
      if (clearEquivalent < (level3T.minClearEquivalent || 1.55)) bandScores[3] -= 0.94;
      if (aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount < 2) bandScores[3] -= 0.78;
      if (interpretiveNearZero && clearEquivalent < 2.05 && aggregate.evidence.usableCount < 2) bandScores[3] -= 1.12;
      if (aggregate.referenceOnlyCount >= 2 && aggregate.genericCount >= 2) bandScores[3] -= 0.88;
      if (aggregate.copyingStrong) {
        bandScores[2] -= 2;
        bandScores[3] -= 3;
        bandScores[4] -= 4;
      }

      let chosenBand = 1;
      let chosenScore = bandScores[1];
      [2, 3, 4].forEach(function (band) {
        if (bandScores[band] > chosenScore) {
          chosenBand = band;
          chosenScore = bandScores[band];
        }
      });

      const strongL4Profile = (
        developedLike >= 2.1 &&
        aggregate.coverage.interpretiveGroups.length >= 2 &&
        aggregate.evidence.usableCount >= 2 &&
        aggregate.unsupportedCount === 0 &&
        (
          aggregate.perceptiveCount >= 1 ||
          aggregate.threadData.deepenedCount >= 1 ||
          (aggregate.developedCount >= 2 && aggregate.coverage.interpretiveGroups.length >= 3 && (aggregate.evidence.selectiveCount >= 1 || aggregate.evidence.judiciousCount >= 1) && aggregate.creditworthyAverageQuality >= 3.25)
        )
      );
      const strongTopLevel3Profile = (
        aggregate.developedCount >= 1 &&
        aggregate.coverage.interpretiveGroups.length >= 2 &&
        aggregate.evidence.selectiveCount >= 1 &&
        aggregate.unsupportedCount === 0 &&
        aggregate.creditworthyAverageQuality >= 2.7
      );

      if (
        chosenBand === 4 &&
        (
          bandScores[4] - bandScores[3] < 0.48 ||
          !strongL4Profile ||
          (aggregate.perceptiveCount === 0 && aggregate.developedCount < 2) ||
          (aggregate.threadData.deepenedCount < 1 && aggregate.perceptiveCount < 1 && !(aggregate.developedCount >= 2 && aggregate.evidence.selectiveCount >= 1 && aggregate.creditworthyAverageQuality >= 3.25)) ||
          aggregate.coverage.interpretiveGroups.length < 2 ||
          aggregate.evidence.usableCount < 2
        )
      ) {
        chosenBand = 3;
        notes.push("Best-fit: mostly clear or developed rather than securely perceptive overall.");
      }
      if (
        chosenBand === 3 &&
        bandScores[3] - bandScores[2] < 0.3 &&
        clearEquivalent < 2.05 &&
        aggregate.coverage.analyticalGroups.length < 2
      ) {
        chosenBand = 2;
        notes.push("Best-fit: some relevant explanation is present, but it is not sustained enough for secure Level 3.");
      }

      let rawMark = 0;
      if (chosenBand === 4) {
        rawMark = 6.82 + Math.min(1.1,
          aggregate.perceptiveCount * 0.16 +
          aggregate.developedCount * 0.12 +
          aggregate.evidence.judiciousCount * 0.18 +
          aggregate.threadData.deepenedCount * 0.22 +
          Math.max(0, dimensionScores.interpretationDepth - 3.08) * 0.18 +
          (aggregate.threadData.dominantThreadCount >= 3.2 ? 0.08 : 0)
        );
      } else if (chosenBand === 3) {
        rawMark = 5.0 + Math.min(0.96,
          aggregate.developedCount * 0.18 +
          aggregate.perceptiveCount * 0.2 +
          aggregate.coverage.interpretiveGroups.length * 0.06 +
          aggregate.threadData.deepenedCount * 0.08 +
          aggregate.evidence.selectiveCount * 0.08 +
          Math.max(0, dimensionScores.explanationQuality - 2.65) * 0.1
        );
      } else if (chosenBand === 2) {
        rawMark = 3.0 + Math.min(0.95,
          aggregate.simpleCount * 0.14 +
          aggregate.shallowCount * 0.12 +
          aggregate.literalCount * 0.1 +
          aggregate.coverage.supportedGroups.length * 0.08 +
          aggregate.evidence.attachedCount * 0.06
        );
      } else {
        rawMark = (aggregate.referenceOnlyCount + aggregate.genericCount + aggregate.quoteDumpCount + aggregate.literalCount + aggregate.shallowCount) > 0 ? 1.6 : 1.0;
      }

      if (
        aggregate.analysisFragmentCount >= ((floors.level3 || {}).minValidComments || 999) &&
        aggregate.coverage.supportedGroups.length >= ((floors.level3 || {}).minSupportedCoverage || 999) &&
        aggregate.unsupportedCount === 0 &&
        aggregate.seriousMethodMisuseCount <= 1 &&
        rawMark < 5
      ) {
        rawMark = 5.0;
        notes.push("Best-fit floor: repeated clear explanation across the extract keeps the answer in Level 3.");
      }
      if (
        developedLike >= ((floors.level4 || {}).minDevelopedComments || 999) &&
        aggregate.coverage.analyticalGroups.length >= ((floors.level4 || {}).minAnalyticalCoverage || 999) &&
        aggregate.evidence.usableCount >= ((floors.level4 || {}).minUsableEvidence || 999) &&
        (aggregate.threadData.deepenedCount >= ((floors.level4 || {}).minSustainedThreads || 999) || aggregate.perceptiveCount >= 1 || aggregate.creditworthyAverageQuality >= 3.25) &&
        aggregate.unsupportedCount === 0 &&
        rawMark < 6.4
      ) {
        rawMark = 6.4;
        notes.push("Best-fit floor: sustained developed interpretation keeps the answer securely above the middle of Level 3.");
      }
      if (strongTopLevel3Profile && rawMark < 5.6) {
        rawMark = 5.6;
        notes.push("Best-fit floor: repeated clear and developed analysis keeps the answer in the top of Level 3.");
      }
      if (aggregate.perceptiveCount === 0 && aggregate.developedCount >= 2 && aggregate.evidence.judiciousCount >= 1 && aggregate.coverage.interpretiveGroups.length >= 2 && aggregate.creditworthyAverageQuality >= 3.35 && aggregate.unsupportedCount === 0 && rawMark < 6.6) {
        rawMark = 6.6;
        notes.push("Best-fit floor: sustained developed interpretation lifts the response into low Level 4.");
      }

      if (interpretiveNearZero && aggregate.developedCount === 0 && aggregate.perceptiveCount === 0 && aggregate.evidence.usableCount <= 1 && rawMark > 4.35) {
        rawMark -= 0.68;
        notes.push("Quotation use and coverage are present, but interpretation remains too limited for secure Level 3.");
      }
      if (aggregate.featureSpottingCount >= 2 && aggregate.evidence.usableCount <= 1 && rawMark > 4.35) {
        rawMark -= 0.56;
        notes.push("Technique spotting without developed meaning keeps the response below secure Level 3.");
      }
      if (aggregate.evidence.usableCount === 0 && clearEquivalent <= 1.0 && dimensionScores.interpretationDepth < 0.4 && aggregate.unsupportedCount === 0 && rawMark > 3.35) {
        rawMark -= 0.52;
        notes.push("Quotation mention and obvious comment are present, but the analysis stays too weak for the top of Level 2.");
      }
      if (rawMark > 6.35 && aggregate.perceptiveCount === 0 && aggregate.creditworthyAverageQuality < 3.25 && !(aggregate.creditworthyCount >= 4 && aggregate.evidence.selectiveCount >= 2 && aggregate.evidence.judiciousCount >= 1)) {
        rawMark = Math.min(rawMark, 6.35);
        notes.push("The response is strong and thoughtful, but it does not sustain enough conceptual interpretation for Level 4.");
      }
      if (rawMark > 6.35 && aggregate.perceptiveCount === 0 && aggregate.evidence.selectiveCount === 0 && aggregate.evidence.judiciousCount === 0) {
        rawMark = Math.min(rawMark, 6.35);
        notes.push("The response is thoughtful, but the evidence stays apt rather than selective enough for Level 4.");
      }

      const secureEight = (
        (
          aggregate.perceptiveCount >= 2 &&
          aggregate.coverage.interpretiveGroups.length >= 4 &&
          (aggregate.evidence.selectiveCount >= 1 || aggregate.creditworthyAverageQuality >= 4.0) &&
          weakRatio <= 0.2
        ) ||
        (
          aggregate.perceptiveCount >= 1 &&
          aggregate.developedCount >= 2 &&
          aggregate.coverage.interpretiveGroups.length >= 4 &&
          aggregate.evidence.judiciousCount >= 1 &&
          weakRatio <= 0.2
        ) ||
        (
          aggregate.perceptiveCount === 0 &&
          aggregate.developedCount >= 2 &&
          aggregate.coverage.interpretiveGroups.length >= 4 &&
          aggregate.evidence.judiciousCount >= 1 &&
          aggregate.creditworthyAverageQuality >= 3.7 &&
          weakRatio <= 0.16
        )
      );
      if (secureEight && rawMark < 7.62) {
        rawMark = 7.72;
      }
      if (rawMark > 7.35 && !secureEight) {
        rawMark = 7.35;
        notes.push("The response is very strong, but perceptive analysis is not dominant enough for 8.");
      }

      let rawPenalty = 0;
      if (aggregate.unsupportedCount > 0) rawPenalty += aggregate.unsupportedCount >= 2 ? 0.92 : 0.42;
      if (aggregate.contradictionCount > 0) rawPenalty += 0.32;
      if (aggregate.seriousMethodMisuseCount > 1) rawPenalty += 0.28;
      if (aggregate.hardUncertaintyCount > 1) rawPenalty += 0.24;
      if (aggregate.quoteDumpCount > 1 && aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount === 0) rawPenalty += 0.42;
      if (aggregate.copyingModerate && aggregate.evidence.usableCount === 0) rawPenalty += 0.35;
      rawMark = clamp(rawMark - rawPenalty, 0, config.maxMark);

      if (aggregate.copyingStrong && aggregate.evidence.selectiveCount === 0 && aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount === 0) {
        rawMark = 0;
        notes.push("Copied extract: no creditworthy response.");
      }
      if (rawMark < 2 && aggregate.unsupportedCount > 0 && aggregate.coverage.referenceGroups.length >= 1 && !aggregate.copyingStrong) {
        rawMark = 2.02;
      }
      if (rawMark < 3.6 && aggregate.featureSpottingCount === 1 && aggregate.simpleCount >= 1 && aggregate.shallowCount === 0 && aggregate.literalCount === 0 && aggregate.coverage.referenceGroups.length >= 2 && !aggregate.copyingStrong && aggregate.unsupportedCount === 0 && aggregate.hardUncertaintyCount === 0 && weakRatio < 0.7) {
        rawMark = 3.6;
      } else if (rawMark < 3 && aggregate.featureSpottingCount > 0 && aggregate.coverage.referenceGroups.length >= 2 && !aggregate.copyingStrong && aggregate.unsupportedCount === 0 && aggregate.hardUncertaintyCount === 0) {
        rawMark = 3.02;
      }
      if (rawMark < 3 && aggregate.literalCount >= 1 && aggregate.coverage.referenceGroups.length >= 2 && !aggregate.copyingStrong && aggregate.unsupportedCount === 0) {
        rawMark = 3.0;
      }

      const mark = clamp(Math.round(rawMark), 0, config.maxMark);
      const level = markToLevel(mark);
      return {
        mark: mark,
        rawScore: Number(rawMark.toFixed(2)),
        level: level,
        descriptor: config.levelDescriptors[level],
        notes: uniqueArray(notes),
        evidenceDescriptor: buildEvidenceDescriptor(aggregate, mark),
        analysisDescriptor: buildAnalysisDescriptor(aggregate, mark),
        coverageDescriptor: buildCoverageDescriptor(aggregate, mark),
        boundaryReasons: buildBoundaryReasons(aggregate, mark, inputState),
        bandScores: bandScores,
        chosenBand: chosenBand
      };
    }

    function determineMark(baseResult, helperPrediction) {
      const aggregate = baseResult.aggregate;
      const inputState = baseResult.inputState;
      const ruleMarkData = baseResult.ruleMarkData;
      if (inputState.status !== "answer") {
        return Object.assign({}, ruleMarkData, {
          ruleMark: ruleMarkData.mark,
          helper: helperPrediction,
          finalReason: "Level 0 state detected before scoring."
        });
      }

      const helperRules = rules.hybridHelper || {};
      let finalRaw = ruleMarkData.rawScore;
      const notes = ruleMarkData.notes.slice();
      let finalReason = "Rule engine result used without helper adjustment.";

      if (helperPrediction && helperRules.enabled) {
        const diff = helperPrediction.suggestedMark - ruleMarkData.mark;
        const canShiftUp = (
          diff > 0 &&
          helperPrediction.confidence >= (helperRules.upwardThreshold || 0.75) &&
          aggregate.unsupportedCount === 0 &&
          aggregate.copyingModerate === false &&
          aggregate.coverage.supportedGroups.length >= 2 &&
          aggregate.clearEquivalent >= 2.0 &&
          aggregate.shallowCount === 0 &&
          aggregate.quoteDumpCount === 0
        );
        const canShiftDown = (
          diff < 0 &&
          helperPrediction.confidence >= (helperRules.downwardThreshold || 0.52)
        );

        if (canShiftUp) {
          const boost = Math.min(0.3, Math.max(0, helperPrediction.rawMark - ruleMarkData.mark));
          finalRaw = Math.min(config.maxMark, finalRaw + boost);
          notes.push("Calibration helper nudged the score slightly upward because the overall pattern matches stronger calibration answers.");
          finalReason = "Rule mark softened upward by the calibration helper.";
        } else if (canShiftDown) {
          if (ruleMarkData.mark >= 8 && helperPrediction.suggestedMark <= 7 && helperPrediction.confidence >= 0.58 && aggregate.perceptiveCount < 2 && (aggregate.evidence.judiciousCount < 2 || aggregate.threadData.deepenedCount < 2)) {
            finalRaw = Math.min(finalRaw, 7.35);
            notes.push("Calibration helper stopped the answer from reaching full marks because the evidence is strong but not fully judicious or conceptually sustained enough for 8.");
            finalReason = "Rule mark softened downward by the calibration helper at the 7 / 8 boundary.";
          }
          if (ruleMarkData.mark >= 7 && helperPrediction.suggestedMark <= 6 && helperPrediction.confidence >= 0.54 && (((aggregate.perceptiveCount === 0 && aggregate.developedCount <= 2 && aggregate.threadData.deepenedCount < 1) && !(aggregate.evidence.judiciousCount >= 1 && aggregate.coverage.interpretiveGroups.length >= 2 && aggregate.creditworthyAverageQuality >= 3.35)) || aggregate.featureSpottingCount > 0 || aggregate.shallowCount > 0)) {
            finalRaw = Math.min(finalRaw, 6.35);
            notes.push("Calibration helper kept the score in high Level 3 because the response is stronger in coverage than in sustained perceptive insight.");
            finalReason = "Rule mark softened downward by the calibration helper on the Level 3 / 4 boundary.";
          }
          if (ruleMarkData.mark >= 6 && helperPrediction.suggestedMark <= 5 && helperPrediction.confidence >= 0.7 && aggregate.perceptiveCount === 0 && aggregate.threadData.deepenedCount === 0) {
            finalRaw = Math.min(finalRaw, 5.35);
            notes.push("Calibration helper kept the answer at 5 because it is mainly clear rather than strongly developed throughout.");
            finalReason = "Rule mark reduced because the helper matched stronger Level 3 calibration responses rather than 6-mark responses.";
          }
          if (ruleMarkData.mark >= 5 && helperPrediction.suggestedMark <= 4 && helperPrediction.confidence >= 0.62 && aggregate.coverage.interpretiveGroups.length === 0) {
            finalRaw = Math.min(finalRaw, 4.35);
            notes.push("Calibration helper reduced the mark because the response is broad but still mostly literal or obvious.");
            finalReason = "Rule mark reduced because the helper matched lower-band analytical patterns.";
          }
          if (aggregate.referenceOnlyCount >= 3 && aggregate.clearCount <= 1 && helperPrediction.suggestedMark <= 3) {
            finalRaw = Math.min(finalRaw, 2.35);
            finalReason = "Heavy quotation listing kept the answer in Level 1.";
          }
          if (ruleMarkData.mark >= 4 && aggregate.unsupportedCount > 0) {
            finalRaw = Math.max(0, finalRaw - 0.22);
            finalReason = "Helper confirmed the caution around unsupported interpretation.";
          }
        }
      }

      const finalMark = clamp(Math.round(finalRaw), 0, config.maxMark);
      const finalLevel = markToLevel(finalMark);
      return {
        mark: finalMark,
        rawScore: Number(finalRaw.toFixed(2)),
        level: finalLevel,
        descriptor: config.levelDescriptors[finalLevel],
        notes: uniqueArray(notes),
        evidenceDescriptor: buildEvidenceDescriptor(aggregate, finalMark),
        analysisDescriptor: buildAnalysisDescriptor(aggregate, finalMark),
        coverageDescriptor: buildCoverageDescriptor(aggregate, finalMark),
        boundaryReasons: buildBoundaryReasons(aggregate, finalMark, inputState),
        ruleMark: ruleMarkData.mark,
        ruleRawScore: ruleMarkData.rawScore,
        helper: helperPrediction,
        finalReason: finalReason,
        bandScores: ruleMarkData.bandScores,
        chosenBand: ruleMarkData.chosenBand
      };
    }

    function computeConfidence(aggregate, markData, inputState, helperPrediction) {
      if (inputState.status !== "answer") {
        return { label: "High", range: [markData.mark, markData.mark] };
      }
      let confidence = "High";
      const weakRatio = aggregate.totalUnits ? (
        aggregate.genericCount +
        aggregate.featureSpottingCount +
        aggregate.referenceOnlyCount +
        aggregate.quoteDumpCount +
        aggregate.literalCount * 0.35
      ) / aggregate.totalUnits : 1;
      const helperGap = helperPrediction ? Math.abs((helperPrediction.rawMark || helperPrediction.suggestedMark || markData.mark) - markData.mark) : 0;
      const boundaryFraction = Math.abs(markData.rawScore - Math.round(markData.rawScore));

      if (
        [4, 5, 6, 7].indexOf(markData.mark) !== -1 ||
        weakRatio > 0.3 ||
        aggregate.softHedgeCount > 0 ||
        aggregate.genericCount > 0 ||
        aggregate.literalCount > 1 ||
        aggregate.copyingModerate ||
        helperGap >= 0.45 ||
        boundaryFraction >= 0.32
      ) {
        confidence = "Medium";
      }
      if (
        aggregate.copyingStrong ||
        aggregate.unsupportedCount > 0 ||
        aggregate.contradictionCount > 0 ||
        aggregate.seriousMethodMisuseCount > 1 ||
        aggregate.hardUncertaintyCount > 0 ||
        weakRatio > 0.55 ||
        helperGap >= 1.05
      ) {
        confidence = "Low";
      }

      let range = [markData.mark, markData.mark];
      if (confidence === "Medium") {
        range = [clamp(markData.mark - 1, 0, config.maxMark), clamp(markData.mark + (markData.mark >= 7 ? 0 : 1), 0, config.maxMark)];
      } else if (confidence === "Low") {
        range = [clamp(markData.mark - 1, 0, config.maxMark), clamp(markData.mark + 1, 0, config.maxMark)];
      }
      return { label: confidence, range: range };
    }

    function buildAggregate(units, copyMetrics) {
      const aggregate = {
        totalUnits: units.length,
        perceptiveCount: 0,
        developedCount: 0,
        clearCount: 0,
        simpleCount: 0,
        shallowCount: 0,
        literalCount: 0,
        featureSpottingCount: 0,
        genericCount: 0,
        referenceOnlyCount: 0,
        quoteDumpCount: 0,
        copiedCount: 0,
        neutralCount: 0,
        unsupportedCount: 0,
        softHedgeCount: 0,
        hardUncertaintyCount: 0,
        contradictionCount: 0,
        seriousMethodMisuseCount: 0,
        looseMethodCount: 0,
        correctMethodLinks: 0,
        creditworthyCount: 0,
        genericOpeningCount: 0,
        analysisFragmentCount: 0,
        creditworthyQualityTotal: 0,
        creditworthyQualityCount: 0,
        creditworthyAverageQuality: 0
      };

      units.forEach(function (unit) {
        if (unit.classification === "perceptive_analysis") aggregate.perceptiveCount += 1;
        if (unit.classification === "developed_analysis") aggregate.developedCount += 1;
        if (unit.classification === "clear_analysis") aggregate.clearCount += 1;
        if (unit.classification === "simple_analysis") aggregate.simpleCount += 1;
        if (unit.classification === "shallow_comment") aggregate.shallowCount += 1;
        if (unit.classification === "literal_comment") aggregate.literalCount += 1;
        if (unit.classification === "feature_spotting") aggregate.featureSpottingCount += 1;
        if (unit.classification === "generic_comment") aggregate.genericCount += 1;
        if (unit.classification === "reference_only") aggregate.referenceOnlyCount += 1;
        if (unit.classification === "quote_dump") aggregate.quoteDumpCount += 1;
        if (unit.classification === "copied_extract") aggregate.copiedCount += 1;
        if (unit.classification === "neutral") aggregate.neutralCount += 1;
        if (unit.classification === "unsupported_interpretation") aggregate.unsupportedCount += 1;
        if (["simple_analysis", "clear_analysis", "developed_analysis", "perceptive_analysis", "shallow_comment", "literal_comment"].indexOf(unit.classification) !== -1) {
          aggregate.creditworthyQualityTotal += unit.qualityScore || 0;
          aggregate.creditworthyQualityCount += 1;
        }
        if (unit.genericSignals.genericOpening) aggregate.genericOpeningCount += 1;
        aggregate.softHedgeCount += unit.hedging.softHits.length;
        aggregate.hardUncertaintyCount += unit.hedging.hardHits.length;
        aggregate.contradictionCount += unit.contradictions.length;
        aggregate.seriousMethodMisuseCount += unit.methodEval.serious.length;
        aggregate.looseMethodCount += unit.methodEval.loose.length;
        aggregate.correctMethodLinks += unit.methodEval.correct.length;
        aggregate.analysisFragmentCount += unit.analysisFragments;
      });

      aggregate.creditworthyCount = aggregate.perceptiveCount + aggregate.developedCount + aggregate.clearCount + aggregate.simpleCount + aggregate.shallowCount + aggregate.literalCount;
      aggregate.creditworthyAverageQuality = Number((aggregate.creditworthyQualityTotal / Math.max(aggregate.creditworthyQualityCount || 1, 1)).toFixed(2));
      aggregate.clearEquivalent = Number((aggregate.perceptiveCount * 1.62 + aggregate.developedCount * 1.28 + aggregate.clearCount + aggregate.simpleCount * 0.54 + aggregate.shallowCount * 0.18 + aggregate.literalCount * 0.16).toFixed(2));
      aggregate.copyingStrong = (
        copyMetrics.wholeDice >= (rules.copyThresholds || {}).wholeDice ||
        copyMetrics.copiedUnitRatio >= 0.8 ||
        copyMetrics.longestRun >= (rules.copyThresholds || {}).longRun
      );
      aggregate.copyingModerate = (
        copyMetrics.wholeDice >= (rules.copyThresholds || {}).nearDice ||
        copyMetrics.copiedUnitRatio >= 0.5 ||
        copyMetrics.extractTokenShare >= (rules.copyThresholds || {}).paraphraseShare
      );
      aggregate.coverage = computeCoverage(units);
      aggregate.evidence = evaluateEvidence(units);
      aggregate.threadData = evaluateThreads(units);
      aggregate.focusScore = evaluateFocus(aggregate);
      aggregate.accuracyScore = evaluateAccuracy(aggregate);
      return aggregate;
    }

    function buildStrengths(aggregate, inputState, markData) {
      const strengths = [];
      if (inputState.status !== "answer") return strengths;
      if (aggregate.perceptiveCount >= 1 && aggregate.threadData.sustainedCount >= 1) strengths.push("There is at least one genuinely perceptive unit supported by a sustained conceptual thread.");
      if (aggregate.developedCount + aggregate.perceptiveCount >= 2) strengths.push("The response develops meaning rather than staying at obvious effect.");
      if (aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount >= 3) strengths.push("Several units are analytically focused rather than descriptive.");
      if (aggregate.evidence.selectiveCount >= 2) strengths.push("Most of the evidence is short and purposeful rather than dumped.");
      if (aggregate.coverage.analyticalGroups.length >= 2) strengths.push("More than one part of the extract is analysed, not merely mentioned.");
      if (aggregate.correctMethodLinks >= 1) strengths.push("At least one method is plausibly identified and linked to effect.");
      if (aggregate.threadData.sustainedCount >= 1) strengths.push("The response sustains a conceptual thread across the answer rather than giving isolated comments.");
      if (markData.mark === 0 && inputState.status === "copied_extract") strengths.push("The system correctly recognised that the response is the extract, not an answer.");
      return uniqueArray(strengths);
    }

    function buildTargets(aggregate, inputState, markData) {
      const targets = [];
      if (inputState.status === "copied_extract" || inputState.status === "paraphrased_extract") {
        targets.push("Write commentary in your own words instead of copying or closely paraphrasing the extract.");
        targets.push("Add explanation of effect and meaning, not just quoted material.");
        return targets;
      }
      if (inputState.status === "blank" || inputState.status === "incomplete") {
        targets.push("Write at least one full sentence that comments on a precise quotation from the extract.");
        return targets;
      }
      if (aggregate.referenceOnlyCount >= 1 || aggregate.quoteDumpCount >= 1) targets.push("Do not list quotations. Follow each quotation with a specific effect or meaning.");
      if (aggregate.featureSpottingCount >= 1) targets.push("Naming a technique is not enough. Link it to a precise effect in the same point.");
      if (aggregate.genericCount >= 1) targets.push("Replace generic phrases like 'creates an effect' with precise words such as 'claustrophobic', 'lifeless', or 'dreamlike'.");
      if (aggregate.literalCount >= 2 && markData.mark < 7) targets.push("Push literal comments further so they explain why the wording matters, not just the surface effect.");
      if (aggregate.evidence.selectiveCount < 2 && markData.mark >= 5) targets.push("Use fewer, shorter quotations and analyse them more sharply.");
      if (aggregate.perceptiveCount + aggregate.developedCount < 2 && markData.mark >= 5) targets.push("To reach secure Level 4, add more genuinely interpretive comments beyond clear explanation.");
      if (aggregate.threadData.sustainedCount < 1 && markData.mark >= 6) targets.push("Try to sustain one conceptual thread across the answer instead of making separate local comments.");
      if (aggregate.unsupportedCount >= 1) targets.push("Keep interpretations grounded in the wording of the extract; avoid invented symbolism or abstract claims.");
      if (aggregate.hardUncertaintyCount > 0) targets.push("Avoid strong uncertainty language like 'hard to know' or 'maybe not' because it weakens precision.");
      if (aggregate.seriousMethodMisuseCount >= 1) targets.push("Only use technical terminology when it is clearly correct.");
      if (!targets.length) targets.push("Sustain this standard by keeping the quotations selective and the interpretation consistently grounded.");
      return uniqueArray(targets);
    }

    function analyseBaseAnswer(answerText) {
      const raw = String(answerText || "");
      const answerNorm = normaliseText(raw);
      const answerRecords = getTokenRecords(raw, adapters);
      const unitFrames = buildAnalysisUnits(raw);
      const units = [];
      let previous = null;
      unitFrames.forEach(function (unitObj, index) {
        const unit = classifyUnit(unitObj, previous, index);
        units.push(unit);
        previous = unit;
      });

      const copyMetrics = analyseCopying(answerRecords, units);
      const aggregate = buildAggregate(units, copyMetrics);
      const inputState = determineInputState(raw, answerNorm, answerRecords, units, copyMetrics, aggregate);
      const dimensionScores = computeDimensionScores(aggregate);
      const ruleMarkData = determineRuleMark(aggregate, inputState, dimensionScores);
      return {
        rawText: raw,
        answerNorm: answerNorm,
        answerRecords: answerRecords,
        wordCount: answerRecords.length,
        unitCount: units.length,
        units: units,
        copyMetrics: copyMetrics,
        aggregate: aggregate,
        inputState: inputState,
        dimensionScores: dimensionScores,
        ruleMarkData: ruleMarkData
      };
    }

    function analyseAnswer(answerText) {
      const baseResult = analyseBaseAnswer(answerText);
      const helperPrediction = predictHelperMark(baseResult);
      const markData = determineMark(baseResult, helperPrediction);
      const confidence = computeConfidence(baseResult.aggregate, markData, baseResult.inputState, helperPrediction);
      const strengths = buildStrengths(baseResult.aggregate, baseResult.inputState, markData);
      const targets = buildTargets(baseResult.aggregate, baseResult.inputState, markData);

      return {
        rawText: baseResult.rawText,
        wordCount: baseResult.wordCount,
        unitCount: baseResult.unitCount,
        units: baseResult.units,
        copyMetrics: baseResult.copyMetrics,
        aggregate: baseResult.aggregate,
        inputState: baseResult.inputState,
        dimensionScores: baseResult.dimensionScores,
        mark: markData.mark,
        level: markData.level,
        descriptor: markData.descriptor,
        evidenceDescriptor: markData.evidenceDescriptor,
        analysisDescriptor: markData.analysisDescriptor,
        coverageDescriptor: markData.coverageDescriptor,
        notes: markData.notes,
        boundaryReasons: markData.boundaryReasons,
        confidence: confidence,
        strengths: strengths,
        targets: targets,
        helper: markData.helper,
        ruleMark: markData.ruleMark,
        ruleRawScore: markData.ruleRawScore,
        rawScore: markData.rawScore,
        finalReason: markData.finalReason,
        summary: {
          analyticalCoverage: baseResult.aggregate.coverage.analyticalGroups.length,
          interpretiveCoverage: baseResult.aggregate.coverage.interpretiveGroups.length,
          supportedCoverage: baseResult.aggregate.coverage.supportedGroups.length,
          referenceCoverage: baseResult.aggregate.coverage.referenceGroups.length,
          attachedEvidence: baseResult.aggregate.evidence.attachedCount,
          usableEvidence: baseResult.aggregate.evidence.usableCount,
          selectiveEvidence: baseResult.aggregate.evidence.selectiveCount,
          judiciousEvidence: baseResult.aggregate.evidence.judiciousCount,
          sustainedThreads: baseResult.aggregate.threadData.sustainedCount,
          dominantThreadCount: baseResult.aggregate.threadData.dominantThreadCount,
          focus: baseResult.aggregate.focusScore,
          accuracy: baseResult.aggregate.accuracyScore,
          clearEquivalent: baseResult.aggregate.clearEquivalent,
          analysisFragments: baseResult.aggregate.analysisFragmentCount,
          evidenceQuality: baseResult.dimensionScores.evidenceQuality,
          coverageQuality: baseResult.dimensionScores.coverageQuality,
          explanationQuality: baseResult.dimensionScores.explanationQuality,
          interpretationDepth: baseResult.dimensionScores.interpretationDepth,
          control: baseResult.dimensionScores.control,
          taskFocus: baseResult.dimensionScores.taskFocus
        },
        libraries: {
          compromise: !!adapters.compromise,
          winkNLP: !!adapters.wink,
          Fuse: !!adapters.Fuse,
          helperModel: !!helperModel
        }
      };
    }

    function runCalibration() {
      return config.calibrationCases.map(function (testCase) {
        const result = analyseAnswer(testCase.answer);
        return {
          id: testCase.id,
          label: testCase.label,
          expectedMark: testCase.expectedMark,
          actualMark: result.mark,
          pass: result.mark === testCase.expectedMark,
          level: result.level,
          confidence: result.confidence.label,
          ruleMark: result.ruleMark,
          helperMark: result.helper ? result.helper.suggestedMark : result.ruleMark
        };
      });
    }

    function getSystemStatus() {
      return {
        compromise: !!adapters.compromise,
        winkNLP: !!adapters.wink,
        Fuse: !!adapters.Fuse,
        helperModel: !!helperModel
      };
    }

    function renderUnitRow(unit, index) {
      const issues = [].concat(
        unit.genericSignals.severeGenericHits || [],
        unit.genericSignals.mildGenericHits || [],
        unit.hedging.softHits || [],
        unit.hedging.hardHits || [],
        unit.contradictions || [],
        unit.unsupported || [],
        unit.methodEval.serious || []
      );
      const groundedBits = [].concat(
        unit.grounded.highEffectHits || [],
        unit.grounded.specificEffectHits || [],
        unit.grounded.supportedInterpretationHits || [],
        unit.threadHits || []
      );

      return "<tr>" +
        "<td>" + (index + 1) + "</td>" +
        "<td><div class=\"sentence-text\">" + escapeHtml(unit.text) + "</div></td>" +
        "<td><span class=\"pill pill-" + unit.classification + "\">" + escapeHtml(unit.classification.replace(/_/g, " ")) + "</span></td>" +
        "<td>" + escapeHtml(unit.quoteTexts.join("; ") || "—") + "</td>" +
        "<td>" + escapeHtml(groundedBits.join("; ") || "—") + "</td>" +
        "<td>" + escapeHtml(issues.join("; ") || "—") + "</td>" +
        "</tr>";
    }

    function renderCalibrationTable(results) {
      if (!Array.isArray(results) || !results.length) return "";
      const passCount = results.filter(function (item) { return item.pass; }).length;
      const rows = results.map(function (item) {
        return "<tr>" +
          "<td>" + escapeHtml(item.id) + "</td>" +
          "<td>" + escapeHtml(item.label) + "</td>" +
          "<td>" + item.expectedMark + "</td>" +
          "<td>" + item.actualMark + "</td>" +
          "<td>" + item.ruleMark + "</td>" +
          "<td>" + item.helperMark + "</td>" +
          "<td>" + (item.pass ? "✅" : "❌") + "</td>" +
          "<td>" + escapeHtml(item.level) + "</td>" +
          "<td>" + escapeHtml(item.confidence) + "</td>" +
          "</tr>";
      }).join("");
      return "<div class=\"calibration-summary\"><strong>Calibration:</strong> " + passCount + " / " + results.length + " exact marks matched.</div>" +
        "<table class=\"data-table\"><thead><tr><th>ID</th><th>Case</th><th>Expected</th><th>Actual</th><th>Rule</th><th>Helper</th><th>Pass</th><th>Level</th><th>Confidence</th></tr></thead><tbody>" + rows + "</tbody></table>";
    }

    function renderReport(result, calibrationResults) {
      const report = $("report");
      if (!report) return;
      const notesHtml = result.notes.length ? "<ul>" + result.notes.map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") + "</ul>" : "<p>None.</p>";
      const strengthsHtml = result.strengths.length ? "<ul>" + result.strengths.map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") + "</ul>" : "<p>None.</p>";
      const targetsHtml = result.targets.length ? "<ul>" + result.targets.map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") + "</ul>" : "<p>None.</p>";
      const boundaryHtml = result.boundaryReasons.length ? "<ul>" + result.boundaryReasons.map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") + "</ul>" : "<p>None.</p>";
      const unitRows = result.units.map(renderUnitRow).join("");

      report.innerHTML = "" +
        "<section class=\"hero-results\">" +
          "<div class=\"score-panel\">" +
            "<div class=\"score-big\">" + result.mark + " / " + config.maxMark + "</div>" +
            "<div class=\"score-level\">" + escapeHtml(result.level) + "</div>" +
            "<div class=\"score-confidence\">Confidence: " + escapeHtml(result.confidence.label) + " · Range: " + result.confidence.range[0] + (result.confidence.range[0] === result.confidence.range[1] ? "" : "–" + result.confidence.range[1]) + "</div>" +
          "</div>" +
          "<div class=\"status-panel\">" +
            "<p><strong>Input state:</strong> " + escapeHtml(result.inputState.status.replace(/_/g, " ")) + "</p>" +
            "<p><strong>Why:</strong> " + escapeHtml(result.inputState.reason) + "</p>" +
            "<p><strong>Descriptor:</strong> " + escapeHtml(result.descriptor) + "</p>" +
            "<p><strong>Analysis descriptor:</strong> " + escapeHtml(result.analysisDescriptor) + "</p>" +
            "<p><strong>Evidence descriptor:</strong> " + escapeHtml(result.evidenceDescriptor) + "</p>" +
            "<p><strong>Coverage descriptor:</strong> " + escapeHtml(result.coverageDescriptor) + "</p>" +
          "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Domain summary</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Analytical coverage</dt><dd>" + result.summary.analyticalCoverage + " group(s)</dd></div>" +
              "<div><dt>Interpretive coverage</dt><dd>" + result.summary.interpretiveCoverage + " group(s)</dd></div>" +
              "<div><dt>Supported coverage</dt><dd>" + result.summary.supportedCoverage + " group(s)</dd></div>" +
              "<div><dt>Reference coverage</dt><dd>" + result.summary.referenceCoverage + " group(s)</dd></div>" +
              "<div><dt>Attached evidence</dt><dd>" + result.summary.attachedEvidence + " unit(s)</dd></div>" +
              "<div><dt>Usable evidence</dt><dd>" + result.summary.usableEvidence + " unit(s)</dd></div>" +
              "<div><dt>Selective evidence</dt><dd>" + result.summary.selectiveEvidence + " unit(s)</dd></div>" +
              "<div><dt>Judicious evidence</dt><dd>" + result.summary.judiciousEvidence + " unit(s)</dd></div>" +
              "<div><dt>Sustained threads</dt><dd>" + result.summary.sustainedThreads + "</dd></div>" +
              "<div><dt>Dominant thread strength</dt><dd>" + result.summary.dominantThreadCount + "</dd></div>" +
              "<div><dt>Clear-equivalent score</dt><dd>" + result.summary.clearEquivalent + "</dd></div>" +
              "<div><dt>Analysis fragments</dt><dd>" + result.summary.analysisFragments + "</dd></div>" +
              "<div><dt>Focus</dt><dd>" + result.summary.focus + " / 4</dd></div>" +
              "<div><dt>Accuracy</dt><dd>" + result.summary.accuracy + " / 4</dd></div>" +
              "<div><dt>Evidence quality</dt><dd>" + result.summary.evidenceQuality + " / 4.4</dd></div>" +
              "<div><dt>Coverage quality</dt><dd>" + result.summary.coverageQuality + " / 4.4</dd></div>" +
              "<div><dt>Explanation quality</dt><dd>" + result.summary.explanationQuality + " / 4.4</dd></div>" +
              "<div><dt>Interpretation depth</dt><dd>" + result.summary.interpretationDepth + " / 4.4</dd></div>" +
              "<div><dt>Control</dt><dd>" + result.summary.control + " / 4</dd></div>" +
              "<div><dt>Task focus</dt><dd>" + result.summary.taskFocus + " / 4</dd></div>" +
            "</dl>" +
          "</div>" +
          "<div class=\"card\"><h3>Copy / extract checks</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Whole-answer similarity</dt><dd>" + result.copyMetrics.wholeDice.toFixed(2) + "</dd></div>" +
              "<div><dt>4-gram overlap</dt><dd>" + result.copyMetrics.fourGramRatio.toFixed(2) + "</dd></div>" +
              "<div><dt>Extract token share</dt><dd>" + result.copyMetrics.extractTokenShare.toFixed(2) + "</dd></div>" +
              "<div><dt>Copied unit ratio</dt><dd>" + result.copyMetrics.copiedUnitRatio.toFixed(2) + "</dd></div>" +
              "<div><dt>Longest copied run</dt><dd>" + result.copyMetrics.longestRun + " token(s)</dd></div>" +
              "<div><dt>Build mode</dt><dd>Self-contained GitHub Pages build</dd></div>" +
            "</dl>" +
          "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Strengths</h3>" + strengthsHtml + "</div>" +
          "<div class=\"card\"><h3>Next steps</h3>" + targetsHtml + "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Why it stayed at this level</h3>" + boundaryHtml + "</div>" +
          "<div class=\"card\"><h3>Best-fit notes</h3>" + notesHtml + "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Classification counts</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Perceptive units</dt><dd>" + result.aggregate.perceptiveCount + "</dd></div>" +
              "<div><dt>Developed units</dt><dd>" + result.aggregate.developedCount + "</dd></div>" +
              "<div><dt>Clear units</dt><dd>" + result.aggregate.clearCount + "</dd></div>" +
              "<div><dt>Simple units</dt><dd>" + result.aggregate.simpleCount + "</dd></div>" +
              "<div><dt>Shallow units</dt><dd>" + result.aggregate.shallowCount + "</dd></div>" +
              "<div><dt>Literal units</dt><dd>" + result.aggregate.literalCount + "</dd></div>" +
              "<div><dt>Feature spotting</dt><dd>" + result.aggregate.featureSpottingCount + "</dd></div>" +
              "<div><dt>Generic comments</dt><dd>" + result.aggregate.genericCount + "</dd></div>" +
              "<div><dt>Reference only</dt><dd>" + result.aggregate.referenceOnlyCount + "</dd></div>" +
              "<div><dt>Unsupported interpretation</dt><dd>" + result.aggregate.unsupportedCount + "</dd></div>" +
            "</dl>" +
          "</div>" +
          "<div class=\"card\"><h3>Quality flags</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Generic openings</dt><dd>" + result.aggregate.genericOpeningCount + "</dd></div>" +
              "<div><dt>Serious method misuse</dt><dd>" + result.aggregate.seriousMethodMisuseCount + "</dd></div>" +
              "<div><dt>Loose method labels</dt><dd>" + result.aggregate.looseMethodCount + "</dd></div>" +
              "<div><dt>Correct method links</dt><dd>" + result.aggregate.correctMethodLinks + "</dd></div>" +
              "<div><dt>Soft hedges</dt><dd>" + result.aggregate.softHedgeCount + "</dd></div>" +
              "<div><dt>Hard uncertainty</dt><dd>" + result.aggregate.hardUncertaintyCount + "</dd></div>" +
              "<div><dt>Contradictions</dt><dd>" + result.aggregate.contradictionCount + "</dd></div>" +
              "<div><dt>Quote dumps</dt><dd>" + result.aggregate.quoteDumpCount + "</dd></div>" +
            "</dl>" +
          "</div>" +
        "</section>" +
        "<section class=\"card\"><h3>Analysis-unit audit</h3><table class=\"data-table\"><thead><tr><th>#</th><th>Unit</th><th>Class</th><th>Evidence</th><th>Grounded effect / meaning / thread</th><th>Issues</th></tr></thead><tbody>" + unitRows + "</tbody></table></section>" +
        (calibrationResults ? "<section class=\"card\"><h3>Calibration runner</h3>" + renderCalibrationTable(calibrationResults) + "</section>" : "");
    }

    function bindUI(marker) {
      const prompt = $("questionPrompt");
      const extractBox = $("sourceExtract");
      const answerBox = $("answerInput");
      const status = $("systemStatus");
      const questionBank = $("developerQuestions");
      if (prompt) prompt.textContent = config.questionPrompt;
      if (extractBox) extractBox.textContent = config.sourceExtract;
      if (questionBank && Array.isArray(config.developerQuestionBank)) {
        questionBank.innerHTML = config.developerQuestionBank.map(function (item) {
          return "<li>" + escapeHtml(item.prompt) + "</li>";
        }).join("");
      }

      if (answerBox) {
        try {
          const saved = root.localStorage ? root.localStorage.getItem(STORAGE_KEY) : "";
          if (saved) answerBox.value = saved;
        } catch (error) {
          // ignore
        }
        answerBox.addEventListener("input", function () {
          try {
            if (root.localStorage) root.localStorage.setItem(STORAGE_KEY, answerBox.value);
          } catch (error) {
            // ignore
          }
        });
      }

      if (status) {
        const state = marker.getSystemStatus();
        status.textContent =
          "Self-contained static build ready" +
          " · embedded rules loaded" +
          " · built-in text engine active" +
          " · " +
          (state.helperModel ? "calibration helper ready" : "calibration helper unavailable");
      }

      const markButton = $("markButton");
      if (markButton) {
        markButton.addEventListener("click", function () {
          const result = marker.analyseAnswer(answerBox ? answerBox.value : "");
          renderReport(result, null);
        });
      }

      const clearButton = $("clearButton");
      if (clearButton) {
        clearButton.addEventListener("click", function () {
          if (answerBox) answerBox.value = "";
          try {
            if (root.localStorage) root.localStorage.removeItem(STORAGE_KEY);
          } catch (error) {
            // ignore
          }
          const report = $("report");
          if (report) report.innerHTML = "";
        });
      }

      const calibrationButton = $("calibrationButton");
      if (calibrationButton) {
        calibrationButton.addEventListener("click", function () {
          const calibrationResults = marker.runCalibration();
          const currentResult = marker.analyseAnswer(answerBox ? answerBox.value : "");
          renderReport(currentResult, calibrationResults);
        });
      }
    }

    helperModel = buildHelperModel();

    return {
      analyseAnswer: analyseAnswer,
      runCalibration: runCalibration,
      bindUI: bindUI,
      getSystemStatus: getSystemStatus,
      config: config,
      rules: rules
    };
  }

  async function loadRules() {
    if (root.GCSE_RULES && typeof root.GCSE_RULES === "object") {
      return root.GCSE_RULES;
    }
    const customUrl = root.GCSE_MARKER_RULES_URL || "rules.json";
    if (typeof fetch === "function") {
      try {
        const response = await fetch(customUrl, { cache: "no-store" });
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        // fall through to a clearer error message
      }
    }
    throw new Error("Could not load rules. Embedded rules were missing and rules.json could not be fetched.");
  }

  async function waitForOptionalWink() {
    try {
      if (root.__GCSE_WINK_READY_PROMISE && typeof root.__GCSE_WINK_READY_PROMISE.then === "function") {
        await root.__GCSE_WINK_READY_PROMISE;
      }
    } catch (error) {
      // ignore; heuristic fallback still works
    }
    return root.__GCSE_WINK__ || null;
  }

  async function initBrowser() {
    const status = $("systemStatus");
    try {
      const config = root.QUIZ_CONFIG;
      const rules = await loadRules();
      const winkBundle = await waitForOptionalWink();
      const marker = createMarker(config, rules, {
        compromise: typeof root.nlp === "function" ? root.nlp : null,
        wink: winkBundle,
        Fuse: root.Fuse || null
      });
      root.GCSEMarker = marker;
      marker.bindUI(marker);

      if (status) {
        const state = marker.getSystemStatus();
        status.textContent =
          "Self-contained static build ready" +
          " · embedded rules loaded" +
          " · built-in text engine active" +
          " · " +
          (state.helperModel ? "calibration helper ready" : "calibration helper unavailable");
      }
    } catch (error) {
      if (status) status.textContent = "Failed to initialise marker: " + error.message;
      throw error;
    }
  }

  if (hasDocument()) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        initBrowser().catch(function () { /* handled in status */ });
      });
    } else {
      initBrowser().catch(function () { /* handled in status */ });
    }
  }

  return {
    createMarker: createMarker,
    loadRules: loadRules,
    initBrowser: initBrowser
  };
});
