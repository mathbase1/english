
(function (root, factory) {
  const exported = factory(root);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  } else {
    root.GCSEMarkerApp = exported;
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const STORAGE_KEY = "gcse_english_github_pages_answer_v9";

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
    const regex = /(?:^|[\s(])(?:["“”]|[‘’'])([^"“”'‘’]{1,180}?)(?:["“”]|[‘’'])(?=$|[\s),.;:!?])/g;
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

  function countWords(text, adapters) {
    return getTokenRecords(text, adapters).length;
  }

  function buildAdapters(rootObj, options) {
    const opts = options || {};
    const compromiseFn = opts.compromise || (typeof rootObj.nlp === "function" ? rootObj.nlp : null);
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
      wink: wink
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
    if (ratio === 1) return 0.93;
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
        /\boozing\b|\bstifled\b|\bstaring\b|\bturned\b/.test(normaliseText(joined));
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
    const methodAliasList = buildMethodAliasList(rules.methodAliases || {});
    const extract = buildExtractResources(config, adapters);
    let helperModel = null;

    function getQuoteMatches(textNorm, records) {
      const stemSet = makeStemSet(records);
      const hits = [];
      config.quoteBank.forEach(function (quote) {
        const score = termScore(textNorm, stemSet, quote.text);
        if (score >= 0.82) hits.push({ id: quote.id, score: score, text: quote.text });
      });
      return uniqueArray(hits.map(function (hit) { return hit.id; })).map(function (id) { return quoteMap[id]; });
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
      const supportedEffectHits = findApproxHits(textNorm, records, pools.effects, 0.72);
      const supportedInterpretationHits = findApproxHits(textNorm, records, pools.interpretations, 0.72);
      const interpretiveSignalHits = phraseHits(textNorm, rules.interpretivePhrases || []);
      const comparisonHits = phraseHits(textNorm, rules.comparisonTerms || []);
      const writerChoiceHits = phraseHits(textNorm, rules.writerChoicePhrases || []);
      const bridgeHits = getContextGroupPairs(groupIds);

      if (comparisonHits.length && bridgeHits.length) {
        supportedInterpretationHits.push("contrast between outside and inside");
      }
      if ((groupIds || []).indexOf("magical_outside") !== -1 && /(luxury|luxurious|wealth|wealthy|glamour|glamorous)/.test(textNorm)) {
        supportedInterpretationHits.push("distance from wealth");
      }
      if ((groupIds || []).indexOf("blank_passengers") !== -1 && /(alienat|dehuman|individuality|anonymous|merged together|merge together)/.test(textNorm)) {
        supportedInterpretationHits.push("dehumanisation / alienation");
      }
      if ((groupIds || []).indexOf("smell_heat") !== -1 && /(emotional suffocation|physical and emotional suffocation|oppressive|trapped|inescapable)/.test(textNorm)) {
        supportedInterpretationHits.push("physical and emotional suffocation");
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
        genericOpening: genericOpening
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

    function detectUnsupportedInterpretation(textNorm, grounded, methodMentions, groupIds) {
      const hits = phraseHits(textNorm, rules.unsupportedInterpretationPhrases || []);
      const abstractHits = phraseHits(textNorm, rules.unsupportedAbstractTerms || []);
      const hasGroundedMeaning = grounded.supportedEffectHits.length + grounded.supportedInterpretationHits.length > 0;
      const hasSymbolLanguage = /symbol|symbolism|symbolises|symbolizes|represents/.test(textNorm);
      const hasMetaphorLanguage = /metaphor|metaphorical/.test(textNorm);
      const hasStrongGrounding = grounded.highEffectHits.length > 0 || grounded.supportedInterpretationHits.length > 0;

      if (abstractHits.length && !hasGroundedMeaning && (hasSymbolLanguage || hasMetaphorLanguage)) {
        hits.push("unsupported abstract reading");
      }
      if (/mud/.test(textNorm) && /(emotion|emotional|society|corruption|spiritual)/.test(textNorm) && (hasSymbolLanguage || hasMetaphorLanguage)) {
        hits.push("invented symbolism around mud");
      }
      if (/windows?/.test(textNorm) && /(transformation|transition|spiritual)/.test(textNorm) && (hasSymbolLanguage || hasMetaphorLanguage)) {
        hits.push("invented symbolism around windows");
      }
      if (/society/.test(textNorm) && /(judge|judging|judgement|judgment|corruption|force)/.test(textNorm)) {
        hits.push("unsupported social claim");
      }
      if ((methodMentions || []).some(function (item) { return item.canonical === "symbolism"; }) && !hasStrongGrounding) {
        hits.push("unsupported symbolism label");
      }
      if (/oppressive force|existential emptiness|spiritual transformation|symbolic transition/.test(textNorm)) {
        hits.push("unsupported abstract phrase");
      }
      if ((groupIds || []).indexOf("physical_discomfort") !== -1 && /(society|spiritual|existential|corruption)/.test(textNorm)) {
        hits.push("interpretation not grounded in quoted detail");
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
      return uniqueArray(hits);
    }

    function evaluateMethodUse(textNorm, methodMentions, contextQuotes, groupIds, grounded, genericSignals) {
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
      const quoteHeavy = quotedSegments.reduce(function (sum, item) { return sum + item.wordCount; }, 0) >= 7 || quotedSegments.length >= 2;
      const hasEvidenceLike = quotedSegments.length > 0 || /blurred and misty|opal and silver|fairy palaces|horribly wet|black, greasy mud|sickening smell|warm humanity|almost stifled|meaningless, staring face|staring in front/.test(norm);

      return {
        text: text,
        norm: norm,
        records: records,
        tokens: tokens,
        wordCount: tokens.length,
        quotedSegments: quotedSegments,
        quoteHeavy: quoteHeavy,
        startsReferential: referential,
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
      const maxCarry = ((rules.unitMergeRules || {}).maxCarrySentences) || 2;
      const shortEvidenceWords = ((rules.unitMergeRules || {}).shortEvidenceWords) || 18;

      for (let i = 0; i < sentences.length; i += 1) {
        const sentence = sentences[i];

        if (units.length && sentence.startsReferential && !sentence.quotedSegments.length) {
          units[units.length - 1].sentences.push(sentence);
          continue;
        }

        const unit = { sentences: [sentence] };

        if (i + 1 < sentences.length && unit.sentences.length < maxCarry) {
          const next = sentences[i + 1];

          const currentLooksLikeLead = sentence.hasEvidenceLike && (
            sentence.quoteHeavy ||
            sentence.wordCount <= shortEvidenceWords ||
            (!sentence.strongVerbHits.length && !sentence.specificEffectHits.length)
          );

          const currentLooksLikeFraming = !sentence.hasEvidenceLike &&
            sentence.wordCount <= 20 &&
            (sentence.specificEffectHits.length > 0 || /(clash between|pattern of|movement from|built around|contrast between|turns .* into)/.test(sentence.norm)) &&
            next.hasEvidenceLike;

          const nextLooksLikeFollowUp = (
            next.startsReferential ||
            next.strongVerbHits.length > 0 ||
            next.weakVerbHits.length > 0 ||
            (next.specificEffectHits.length > 0 && !next.quoteHeavy) ||
            (next.genericSignals.severeGenericHits.length + next.genericSignals.mildGenericHits.length > 0 && !next.quotedSegments.length)
          );

          if ((currentLooksLikeLead && nextLooksLikeFollowUp) || currentLooksLikeFraming) {
            unit.sentences.push(next);
            i += 1;
          }
        }

        units.push(unit);
      }

      return units;
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
      const strongVerbHits = phraseHits(norm, rules.analysisVerbsStrong || []);
      const weakVerbHits = phraseHits(norm, rules.analysisVerbsWeak || []);
      const genericSignals = detectGenericSignals(norm, unitIndex === 0);
      const hedging = detectHedging(norm);
      const contradictions = detectContradictions(norm, hedging);
      const methodMentions = detectMethodMentions(norm);
      const unsupported = detectUnsupportedInterpretation(norm, grounded, methodMentions, groupIds);
      const methodEval = evaluateMethodUse(norm, methodMentions, contextQuotes, groupIds, grounded, genericSignals);
      const quoteInfo = detectQuotedSegments(text);
      const quoteWordCount = quoteInfo.reduce(function (sum, item) { return sum + item.wordCount; }, 0);
      const copyMetrics = computeCopyMetricsFromRecords(records);

      const hasEvidenceCarrier = hasDirectEvidence || (startsReferential && previousUnit && previousUnit.contextQuoteIds.length > 0);
      const hasReferenceOnly = groupIds.length > 0 && !hasEvidenceCarrier;
      const hasSpecificEffect = grounded.specificEffectHits.length > 0;
      const hasHighEffect = grounded.highEffectHits.length > 0;
      const hasSupportedInterpretation = grounded.supportedInterpretationHits.length > 0;
      const hasInterpretiveSignal = grounded.interpretiveSignalHits.length > 0 || grounded.comparisonHits.length > 0;
      const hasWriterChoice = grounded.writerChoiceHits.length > 0;
      const commentaryTokens = records.filter(function (record) {
        return !extract.stemSet.has(record.stem) && !extract.stemSet.has(record.norm);
      }).length;
      const commentaryDensity = tokens.length ? commentaryTokens / tokens.length : 0;
      const severeGenericCount = genericSignals.severeGenericHits.length;
      const mildGenericCount = genericSignals.mildGenericHits.length + (genericSignals.genericOpening ? 1 : 0);
      const softHedgeCount = hedging.softHits.length;
      const hardUncertaintyCount = hedging.hardHits.length;
      const seriousIssueCount = unsupported.length + contradictions.length + methodEval.serious.length + hardUncertaintyCount;
      const analysisLanguage = strongVerbHits.length > 0 ||
        weakVerbHits.length > 0 ||
        hasWriterChoice ||
        grounded.comparisonHits.length > 0 ||
        /\bseem\b|\bseems\b|\bfeel\b|\bfeels\b|\bshowing\b|\bsuggesting\b|\bhighlighting\b/.test(norm);
      const meaningfulCommentary = commentaryDensity >= 0.18 || analysisLanguage || methodMentions.length > 0 || hedging.softHits.length > 0;
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
        !hasSpecificEffect &&
        !hasSupportedInterpretation &&
        !hasInterpretiveSignal
      ) || (
        genericSignals.featureHits.length > 0 &&
        !hasSpecificEffect &&
        !hasSupportedInterpretation
      );
      const quoteHeavyNoComment = hasDirectEvidence && commentaryDensity < 0.14 && !analysisLanguage && !hasWriterChoice && !methodMentions.length;
      const onlyLiteral = hasSpecificEffect && !hasSupportedInterpretation && !hasHighEffect && !hasInterpretiveSignal && !hasWriterChoice;

      const analysisFragments = clamp(
        (hasSpecificEffect ? 1 : 0) +
        (hasSupportedInterpretation ? 1 : 0) +
        ((hasWriterChoice || grounded.comparisonHits.length > 0 || strongVerbHits.length > 0) ? 1 : 0),
        0,
        3
      );
      const listingLike = hasDirectEvidence &&
        directQuotes.length >= 2 &&
        commentaryDensity < 0.28 &&
        !strongVerbHits.length &&
        !weakVerbHits.length &&
        !hasWriterChoice &&
        !methodMentions.length &&
        analysisFragments <= 1 &&
        !hasSpecificEffect &&
        !hasSupportedInterpretation;

      let qualityScore = 0;
      if (hasEvidenceCarrier) qualityScore += 0.9;
      if (hasReferenceOnly) qualityScore += 0.15;
      if (hasSpecificEffect) qualityScore += 0.8;
      if (hasSupportedInterpretation) qualityScore += 0.95;
      if (hasHighEffect) qualityScore += 0.5;
      if (hasInterpretiveSignal) qualityScore += 0.45;
      if (hasWriterChoice) qualityScore += 0.4;
      if (strongVerbHits.length) qualityScore += 0.45;
      if (methodEval.correct.length) qualityScore += 0.25;
      if (commentaryDensity >= 0.28) qualityScore += 0.25;

      qualityScore -= severeGenericCount * 0.72;
      qualityScore -= mildGenericCount * 0.10;
      qualityScore -= genericSignals.featureHits.length * 0.22;
      qualityScore -= hardUncertaintyCount * 0.55;
      qualityScore -= Math.max(0, softHedgeCount - 1) * 0.12;
      qualityScore -= contradictions.length * 0.85;
      qualityScore -= unsupported.length * 1.1;
      qualityScore -= methodEval.serious.length * 0.7;
      qualityScore -= featureSpotting ? 0.7 : 0;
      qualityScore -= quoteDump ? 0.85 : 0;
      qualityScore -= copiedUnit ? 1.2 : 0;
      qualityScore -= quoteHeavyNoComment ? 0.6 : 0;

      const seriousMethodWithoutMeaning = methodEval.serious.length > 0 && !hasSpecificEffect && !hasSupportedInterpretation && !hasHighEffect && !hasWriterChoice;
      const seriousMethodWithMeaning = methodEval.serious.length > 0 && !seriousMethodWithoutMeaning;

      let classification = "neutral";
      if (copiedUnit) {
        classification = "copied_extract";
      } else if (unsupported.length || contradictions.length) {
        classification = "unsupported_interpretation";
      } else if (quoteDump) {
        classification = "quote_dump";
      } else if (featureSpotting) {
        classification = "feature_spotting";
      } else if (listingLike || quoteHeavyNoComment) {
        classification = "reference_only";
      } else if (hasEvidenceCarrier && meaningfulCommentary && qualityScore >= 4.05 && hasSupportedInterpretation && (hasHighEffect || hasWriterChoice || grounded.comparisonHits.length > 0) && severeGenericCount === 0 && hardUncertaintyCount === 0) {
        classification = "perceptive_analysis";
      } else if (hasEvidenceCarrier && meaningfulCommentary && qualityScore >= 2.85 && hasSupportedInterpretation && (hasWriterChoice || grounded.comparisonHits.length > 0 || (strongVerbHits.length > 0 && (hasHighEffect || analysisFragments >= 3)) || (hasHighEffect && analysisFragments >= 2 && qualityScore >= 3.2))) {
        classification = "developed_analysis";
      } else if (hasEvidenceCarrier && meaningfulCommentary && qualityScore >= 1.95 && (hasSupportedInterpretation || hasHighEffect || hasWriterChoice || grounded.comparisonHits.length > 0 || strongVerbHits.length > 0 || analysisFragments >= 2)) {
        classification = "clear_analysis";
      } else if (hasEvidenceCarrier && meaningfulCommentary && qualityScore >= 1.15 && (hasSpecificEffect || hasSupportedInterpretation || weakVerbHits.length > 0 || analysisFragments >= 1)) {
        classification = "simple_analysis";
      } else if ((hasEvidenceCarrier || hasReferenceOnly) && (onlyLiteral || phraseHits(norm, rules.literalEffectTerms || []).length > 0)) {
        classification = "literal_comment";
      } else if (severeGenericCount > 0 || genericSignals.genericOpening) {
        classification = "generic_comment";
      } else if (hasEvidenceCarrier || hasReferenceOnly) {
        classification = "reference_only";
      }

      if (classification === "perceptive_analysis" && (mildGenericCount > 1 || softHedgeCount > 1)) {
        classification = "developed_analysis";
      }
      if (classification === "developed_analysis" && severeGenericCount > 0 && !hasHighEffect && !hasWriterChoice) {
        classification = "clear_analysis";
      }
      if (classification === "developed_analysis" && !hasSupportedInterpretation) {
        classification = "clear_analysis";
      }
      if (classification === "clear_analysis" && onlyLiteral && !hasSupportedInterpretation && !hasWriterChoice) {
        classification = "simple_analysis";
      }
      if (classification === "clear_analysis" && severeGenericCount > 0 && !hasHighEffect && !hasSupportedInterpretation) {
        classification = "simple_analysis";
      }
      if (classification === "simple_analysis" && severeGenericCount > 0 && !hasSupportedInterpretation) {
        classification = "literal_comment";
      }
      if ((classification === "clear_analysis" || classification === "simple_analysis") && severeGenericCount > 0 && !hasSupportedInterpretation && !hasHighEffect && !hasWriterChoice) {
        classification = hasSpecificEffect ? "literal_comment" : "generic_comment";
      }
      if (classification === "literal_comment" && severeGenericCount > 0 && !hasSpecificEffect) {
        classification = "generic_comment";
      }
      if ((classification === "clear_analysis" || classification === "developed_analysis") && commentaryDensity < 0.12 && !analysisLanguage) {
        classification = "reference_only";
      }
      if (seriousMethodWithMeaning) {
        if (classification === "perceptive_analysis") {
          classification = "developed_analysis";
        } else if (classification === "developed_analysis") {
          classification = "clear_analysis";
        } else if (classification === "clear_analysis") {
          classification = "simple_analysis";
        } else if (classification === "simple_analysis" && !hasSupportedInterpretation && !hasHighEffect) {
          classification = "literal_comment";
        }
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
        hedging: hedging,
        contradictions: contradictions,
        unsupported: unsupported,
        methodMentions: methodMentions.map(function (item) { return item.canonical; }),
        methodEval: methodEval,
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
          seriousIssues: seriousIssueCount,
          meaningfulCommentary: meaningfulCommentary
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
        if (["simple_analysis", "clear_analysis", "developed_analysis", "perceptive_analysis", "literal_comment"].indexOf(unit.classification) !== -1) {
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
        if (["simple_analysis", "clear_analysis", "developed_analysis", "perceptive_analysis", "literal_comment"].indexOf(unit.classification) !== -1) {
          attached.push(unit);
        }
        if (["clear_analysis", "developed_analysis", "perceptive_analysis"].indexOf(unit.classification) !== -1) {
          usable.push(unit);
          if (
            (
              unit.quoteWordCount <= ((rules.unitMergeRules || {}).maxQuoteWordsForSelective || 8) &&
              unit.quoteCount <= 3
            ) &&
            unit.commentaryDensity >= 0.16
          ) {
            selective.push(unit);
            if (
              (unit.classification === "perceptive_analysis" || unit.classification === "developed_analysis") &&
              unit.quoteWordCount <= 12 &&
              unit.quoteCount <= 2 &&
              unit.genericSignals.severeGenericHits.length === 0 &&
              unit.commentaryDensity >= 0.3 &&
              (
                unit.grounded.writerChoiceHits.length > 0 ||
                unit.methodEval.correct.length > 0 ||
                (unit.classification === "perceptive_analysis" && unit.analysisFragments >= 3)
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

    function evaluateFocus(aggregate) {
      const total = aggregate.totalUnits || 1;
      if (!aggregate.creditworthyCount) return 0;
      const positive = (
        aggregate.perceptiveCount * 1.35 +
        aggregate.developedCount * 1.15 +
        aggregate.clearCount * 0.95 +
        aggregate.simpleCount * 0.65 +
        aggregate.literalCount * 0.25
      );
      const drag = (
        aggregate.genericCount * 0.55 +
        aggregate.featureSpottingCount * 0.55 +
        aggregate.referenceOnlyCount * 0.45 +
        aggregate.quoteDumpCount * 0.8 +
        aggregate.unsupportedCount * 0.95 +
        aggregate.copiedCount * 1.2
      );
      const focusIndex = (positive - drag) / total;
      if (focusIndex <= 0.08) return 1;
      if (focusIndex <= 0.42) return 2;
      if (focusIndex <= 0.78) return 3;
      return 4;
    }

    function evaluateAccuracy(aggregate) {
      let score = 4;
      score -= aggregate.unsupportedCount * 0.9;
      score -= aggregate.seriousMethodMisuseCount * 0.55;
      score -= aggregate.contradictionCount * 0.75;
      score -= aggregate.hardUncertaintyCount * 0.4;
      score -= Math.max(0, aggregate.softHedgeCount - 2) * 0.08;
      if (aggregate.copyingStrong) score -= 2.5;
      return clamp(Number(score.toFixed(2)), 0, 4);
    }

    function determineInputState(answerText, answerNorm, answerRecords, units, copyMetrics, aggregate) {
      const words = answerRecords.length;
      const nonAnswerHits = phraseHits(answerNorm, rules.nonAnswerPhrases || []);
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
      const paraphraseLike = (
        copyMetrics.wholeDice >= (rules.copyThresholds || {}).nearDice ||
        (copyMetrics.extractTokenShare >= (rules.copyThresholds || {}).paraphraseShare &&
         copyMetrics.threeGramRatio >= (rules.copyThresholds || {}).threeGramRatio) ||
        copyMetrics.copiedUnitRatio >= 0.5
      );

      if (
        copiedLike &&
        (
          aggregate.creditworthyCount === 0 ||
          (aggregate.developedCount + aggregate.perceptiveCount + aggregate.clearCount <= 1 && aggregate.evidence.selectiveCount === 0)
        )
      ) {
        return { status: "copied_extract", mark: 0, level: "Level 0", reason: "The response is effectively the extract, not an answer." };
      }
      if (
        paraphraseLike &&
        (
          aggregate.developedCount + aggregate.perceptiveCount + aggregate.clearCount === 0 ||
          (aggregate.evidence.usableCount === 0 && aggregate.referenceOnlyCount + aggregate.quoteDumpCount + aggregate.genericCount >= Math.max(1, units.length - 1))
        )
      ) {
        return { status: "paraphrased_extract", mark: 0, level: "Level 0", reason: "The response stays too close to the extract and does not add creditworthy analysis." };
      }
      if (nonAnswerHits.length && aggregate.creditworthyCount === 0 && aggregate.referenceOnlyCount === 0) {
        return { status: "not_answer", mark: 0, level: "Level 0", reason: "The response does not answer the task." };
      }
      return { status: "answer", mark: null, level: null, reason: "Creditworthy answer detected." };
    }

    function buildEvidenceDescriptor(aggregate, mark) {
      if (mark === 0) return "No creditworthy evidence";
      if (mark === 8 && aggregate.evidence.judiciousCount >= 2) return "Judicious, sharply chosen quotations";
      if (mark >= 7 && aggregate.evidence.selectiveCount >= 2) return "Selective quotations used purposefully";
      if (mark >= 6 && aggregate.evidence.usableCount >= 2) return "Apt quotations usually linked to analysis";
      if (mark >= 5 && aggregate.evidence.attachedCount >= 1) return "Relevant quotations attached to the commentary";
      if (mark >= 3 && aggregate.evidence.attachedCount >= 1) return "Some quotation use, but not always selective";
      if (aggregate.coverage.referenceGroups.length) return "References are present, but often obvious or listed";
      return "Little usable evidence";
    }

    function buildAnalysisDescriptor(aggregate, mark) {
      if (mark === 0) return "No creditworthy analysis";
      if (mark === 8) return "Perceptive, convincing analysis";
      if (mark === 7) return "Thoughtful, well-developed analysis";
      if (mark === 6) return "Clear, developed analysis";
      if (mark === 5) return "Clear relevant analysis";
      if (mark === 4) return "Some explanation, but often simple or literal";
      if (mark === 3) return "Some relevant explanation, but uneven";
      if (aggregate.featureSpottingCount) return "Feature spotting rather than full analysis";
      if (aggregate.referenceOnlyCount || aggregate.quoteDumpCount) return "Retelling / quotation without analysis";
      return "Simple or generic comments";
    }

    function buildCoverageDescriptor(aggregate, mark) {
      if (mark >= 7 && aggregate.coverage.analyticalGroups.length >= 3) return "Several parts of the extract are analysed purposefully.";
      if (mark >= 5 && aggregate.coverage.analyticalGroups.length >= 2) return "More than one part of the extract is analysed.";
      if (aggregate.coverage.supportedGroups.length >= 2) return "Several parts are mentioned, but not all are analysed sharply.";
      if (aggregate.coverage.referenceGroups.length >= 1) return "Some reference coverage, but limited analytical range.";
      return "Very limited coverage.";
    }

    function buildBoundaryReasons(aggregate, mark, inputState) {
      const reasons = [];
      if (inputState.status !== "answer") return reasons;

      if (mark === 8) {
        reasons.push("The response sustains perceptive, accurate analysis with judicious evidence.");
      } else if (mark === 7) {
        reasons.push("The response is strong and interpretive, but not consistently judicious or perceptive enough for 8.");
        if (aggregate.evidence.judiciousCount < 2) reasons.push("Evidence is selective rather than fully judicious.");
        if (aggregate.perceptiveCount < 2) reasons.push("The very top-end comments are not sustained often enough for 8.");
      } else if (mark === 6) {
        reasons.push("The response is mainly clear and developed rather than consistently perceptive.");
        if (aggregate.developedCount + aggregate.perceptiveCount < 2) reasons.push("There are not enough developed interpretive comments for Level 4.");
        if (aggregate.evidence.selectiveCount < 2) reasons.push("Evidence is apt, but not selective enough for secure Level 4.");
      } else if (mark === 5) {
        reasons.push("The response is clearly relevant, but it does not sustain enough depth for 6.");
        if (aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount < 3) reasons.push("There are not enough clear analytical units across the extract.");
        if (aggregate.coverage.supportedGroups.length < 2) reasons.push("The clear comments do not range widely enough across the extract.");
      } else if (mark === 4) {
        reasons.push("There is some relevant explanation, but it stays simple or literal too often.");
      } else if (mark <= 3 && inputState.status === "answer") {
        reasons.push("The response does not move beyond simple comment consistently enough.");
      }

      if (aggregate.genericCount > 0 || aggregate.genericOpeningCount > 0) reasons.push("Generic wording weakens the overall quality judgement.");
      if (aggregate.literalCount > 1) reasons.push("Too many comments stay at the level of obvious or literal effect.");
      if (aggregate.unsupportedCount > 0) reasons.push("Unsupported interpretation prevents a higher mark.");
      if (aggregate.seriousMethodMisuseCount > 0) reasons.push("Incorrect method labelling limits the level.");
      if (aggregate.hardUncertaintyCount > 0) reasons.push("Strong uncertainty language reduces precision.");
      return uniqueArray(reasons);
    }

    function computeWeakRatio(aggregate) {
      return aggregate.totalUnits ? (
        aggregate.genericCount +
        aggregate.featureSpottingCount +
        aggregate.referenceOnlyCount +
        aggregate.quoteDumpCount +
        aggregate.literalCount * 0.35
      ) / aggregate.totalUnits : 1;
    }

    function computeDevelopedLike(aggregate) {
      return Number((aggregate.perceptiveCount * 1.45 + aggregate.developedCount + aggregate.clearCount * 0.3).toFixed(2));
    }

    function computeDimensionScores(aggregate) {
      const weakRatio = computeWeakRatio(aggregate);
      const total = aggregate.totalUnits || 1;
      const positiveRatio = aggregate.creditworthyCount / total;
      const evidenceQuality = clamp(
        aggregate.evidence.attachedCount * 0.72 +
        aggregate.evidence.usableCount * 0.92 +
        aggregate.evidence.selectiveCount * 1.12 +
        aggregate.evidence.judiciousCount * 0.7 -
        aggregate.evidence.dumpedCount * 0.78 -
        Math.max(0, aggregate.referenceOnlyCount - 1) * 0.18,
        0,
        4.4
      );
      const coverageQuality = clamp(
        aggregate.coverage.supportedGroups.length * 0.65 +
        aggregate.coverage.analyticalGroups.length * 0.88 +
        aggregate.coverage.interpretiveGroups.length * 1.0 -
        Math.max(0, aggregate.coverage.referenceGroups.length - aggregate.coverage.supportedGroups.length) * 0.08,
        0,
        4.4
      );
      const explanationQuality = clamp(
        aggregate.clearEquivalent * 0.92 +
        aggregate.analysisFragmentCount * 0.14 +
        aggregate.simpleCount * 0.18 -
        aggregate.featureSpottingCount * 0.34 -
        aggregate.genericCount * 0.12 -
        aggregate.quoteDumpCount * 0.4,
        0,
        4.4
      );
      const interpretationDepth = clamp(
        aggregate.perceptiveCount * 1.25 +
        aggregate.developedCount * 0.92 +
        aggregate.coverage.interpretiveGroups.length * 0.38 +
        aggregate.correctMethodLinks * 0.08 -
        aggregate.unsupportedCount * 0.95 -
        aggregate.literalCount * 0.14 -
        aggregate.hardUncertaintyCount * 0.18,
        0,
        4.4
      );
      const accuracy = clamp(
        aggregate.accuracyScore - Math.max(0, aggregate.looseMethodCount - aggregate.correctMethodLinks) * 0.04,
        0,
        4
      );
      const control = clamp(
        aggregate.focusScore * 0.9 + positiveRatio * 0.95 - weakRatio * 0.55 - aggregate.genericOpeningCount * 0.12,
        0,
        4
      );
      const taskFocus = clamp(
        aggregate.focusScore + (aggregate.coverage.supportedGroups.length >= 2 ? 0.2 : 0) - aggregate.genericOpeningCount * 0.08,
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
        developedLike: computeDevelopedLike(aggregate)
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
        aggregate.correctMethodLinks / Math.max(total, 1)
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
      }).sort(function (a, b) { return a.distance - b.distance; }).slice(0, Math.min(helperRules.k || 5, helperModel.items.length));

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
      const rawMark = knnRaw * 0.68 + centroidRaw * 0.32;
      const suggestedMark = clamp(Math.round(rawMark), 0, config.maxMark);
      const topNeighborWeight = Math.max.apply(null, Object.keys(markWeights).map(function (key) { return markWeights[key]; }).concat([0]));
      const agreement = weightTotal ? topNeighborWeight / weightTotal : 0;
      const confidence = clamp(agreement * 0.75 + (nearest.length && nearest[0].distance < 0.18 ? 0.2 : 0), 0, 1);
      return {
        rawMark: Number(rawMark.toFixed(2)),
        suggestedMark: suggestedMark,
        confidence: Number(confidence.toFixed(2)),
        nearest: nearest
      };
    }

    function markToLevel(mark) {
      if (mark === 0) return "Level 0";
      if (mark <= 2) return "Level 1";
      if (mark <= 4) return "Level 2";
      if (mark <= 6) return "Level 3";
      return "Level 4";
    }

    function determineRuleMark(aggregate, inputState, dimensionScores) {
      if (inputState.status !== "answer") {
        return {
          mark: inputState.mark,
          rawScore: inputState.mark,
          level: inputState.level,
          descriptor: config.levelDescriptors[inputState.level],
          caps: [inputState.reason],
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
      const floors = rules.bestFitFloors || {};
      const bandScores = {
        1: 0.5 + aggregate.referenceOnlyCount * 0.35 + aggregate.genericCount * 0.28 + aggregate.quoteDumpCount * 0.5 + aggregate.literalCount * 0.12,
        2: dimensionScores.explanationQuality * 0.92 + dimensionScores.evidenceQuality * 0.46 + dimensionScores.coverageQuality * 0.34 + dimensionScores.taskFocus * 0.18 + aggregate.simpleCount * 0.2 + aggregate.literalCount * 0.16 - aggregate.unsupportedCount * 0.7 - aggregate.quoteDumpCount * 0.4,
        3: dimensionScores.explanationQuality * 1.26 + dimensionScores.evidenceQuality * 0.88 + dimensionScores.coverageQuality * 0.72 + dimensionScores.accuracy * 0.48 + dimensionScores.control * 0.35 + aggregate.clearCount * 0.42 + aggregate.developedCount * 0.28 + aggregate.simpleCount * 0.12 - aggregate.unsupportedCount * 0.82 - aggregate.quoteDumpCount * 0.36 - aggregate.featureSpottingCount * 0.22,
        4: dimensionScores.interpretationDepth * 1.42 + dimensionScores.explanationQuality * 0.88 + dimensionScores.evidenceQuality * 0.72 + dimensionScores.coverageQuality * 0.66 + dimensionScores.accuracy * 0.62 + dimensionScores.control * 0.28 + aggregate.perceptiveCount * 0.58 + aggregate.developedCount * 0.42 - aggregate.unsupportedCount * 1.12 - aggregate.seriousMethodMisuseCount * 0.42 - aggregate.featureSpottingCount * 0.36 - aggregate.literalCount * 0.18
      };

      if (aggregate.coverage.interpretiveGroups.length < 2) bandScores[4] -= 0.95;
      if (aggregate.coverage.interpretiveGroups.length < 3) bandScores[4] -= 0.42;
      if (aggregate.evidence.usableCount < 2) bandScores[4] -= 0.85;
      if (aggregate.evidence.selectiveCount < 2) bandScores[4] -= 0.36;
      if (aggregate.perceptiveCount < 1) bandScores[4] -= 0.92;
      if (aggregate.perceptiveCount + aggregate.developedCount < 2) bandScores[4] -= 0.78;
      if (developedLike < 1.85) bandScores[4] -= 1.15;
      if (weakRatio > 0.52) bandScores[4] -= 0.75;
      if (aggregate.genericOpeningCount > 0 && aggregate.perceptiveCount === 0) bandScores[4] -= 0.32;
      if (aggregate.coverage.supportedGroups.length < 2) bandScores[3] -= 0.82;
      if (aggregate.coverage.analyticalGroups.length < 2) bandScores[3] -= 0.72;
      if (aggregate.evidence.attachedCount < 1) bandScores[3] -= 0.95;
      if (aggregate.evidence.usableCount < 2) bandScores[3] -= 0.55;
      if (clearEquivalent < 1.65) bandScores[3] -= 1.0;
      if (clearEquivalent < 2.0) bandScores[3] -= (2.0 - clearEquivalent) * 1.15;
      if (aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount < 2) bandScores[3] -= 0.88;
      if (aggregate.referenceOnlyCount >= 2 && aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount === 0) bandScores[3] -= 0.7;
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

      if (
        chosenBand === 4 &&
        bandScores[4] - bandScores[3] < 0.48 &&
        aggregate.perceptiveCount === 0 &&
        aggregate.evidence.judiciousCount === 0 &&
        aggregate.coverage.interpretiveGroups.length < 4
      ) {
        chosenBand = 3;
        notes.push("Best-fit: mostly developed and clear rather than fully perceptive.");
      }
      if (
        chosenBand === 3 &&
        bandScores[3] - bandScores[2] < 0.32 &&
        clearEquivalent < 2.0 &&
        aggregate.coverage.analyticalGroups.length < 2
      ) {
        chosenBand = 2;
        notes.push("Best-fit: some relevant explanation is present, but it is not sustained enough for secure Level 3.");
      }

      let rawMark = 0;
      if (chosenBand === 4) {
        rawMark = 6.9 + Math.min(1.0,
          aggregate.perceptiveCount * 0.18 +
          aggregate.developedCount * 0.12 +
          aggregate.evidence.judiciousCount * 0.24 +
          Math.max(0, dimensionScores.interpretationDepth - 3.15) * 0.18 +
          (aggregate.coverage.analyticalGroups.length >= 4 ? 0.1 : 0) +
          (weakRatio <= 0.16 ? 0.06 : 0)
        );
      } else if (chosenBand === 3) {
        rawMark = 5.03 + Math.min(0.96,
          aggregate.developedCount * 0.22 +
          aggregate.perceptiveCount * 0.32 +
          aggregate.coverage.interpretiveGroups.length * 0.08 +
          aggregate.evidence.selectiveCount * 0.12 +
          Math.max(0, dimensionScores.explanationQuality - 2.7) * 0.12
        );
      } else if (chosenBand === 2) {
        rawMark = 3.02 + Math.min(0.96,
          aggregate.simpleCount * 0.16 +
          aggregate.literalCount * 0.14 +
          aggregate.coverage.supportedGroups.length * 0.1 +
          aggregate.evidence.attachedCount * 0.08
        );
      } else {
        rawMark = (aggregate.referenceOnlyCount + aggregate.genericCount + aggregate.quoteDumpCount + aggregate.literalCount) > 0 ? 1.72 : 1.0;
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
        aggregate.unsupportedCount === 0 &&
        rawMark < 6
      ) {
        rawMark = 6.0;
        notes.push("Best-fit floor: sustained developed interpretation keeps the answer securely in the top of Level 3.");
      }

      if (
        rawMark > 6.35 &&
        aggregate.perceptiveCount === 0 &&
        aggregate.evidence.judiciousCount === 0 &&
        aggregate.coverage.interpretiveGroups.length < 3 &&
        dimensionScores.interpretationDepth < 3.0
      ) {
        rawMark = 6.35;
        notes.push("The response is strong and interpretive, but it stays closer to clear Level 3 than secure Level 4.");
      }
      if (
        rawMark > 5.35 &&
        aggregate.coverage.interpretiveGroups.length === 0 &&
        aggregate.developedCount === 0 &&
        aggregate.perceptiveCount === 0 &&
        aggregate.clearCount < 3
      ) {
        rawMark = 5.35;
        notes.push("Relevant explanation is present, but it is not developed enough for the top of Level 3.");
      }
      if (
        rawMark > 6.35 &&
        aggregate.perceptiveCount === 0 &&
        aggregate.developedCount < 3 &&
        clearEquivalent < 4
      ) {
        rawMark = 6.35;
        notes.push("The response is interpretive, but it does not show enough sustained top-band quality for 7–8.");
      }
      if (
        rawMark > 5.35 &&
        aggregate.perceptiveCount === 0 &&
        aggregate.developedCount <= 1 &&
        aggregate.coverage.interpretiveGroups.length <= 2 &&
        aggregate.clearCount >= 1 &&
        !(aggregate.seriousMethodMisuseCount === 1 && aggregate.developedCount >= 1 && aggregate.clearCount >= 1 && aggregate.coverage.analyticalGroups.length >= 4 && aggregate.unsupportedCount === 0)
      ) {
        rawMark = 5.35;
        notes.push("The response is mainly clear and relevant rather than developed enough for 6.");
      }

      if (aggregate.unsupportedCount > 0 && aggregate.developedCount + aggregate.perceptiveCount === 0) {
        rawMark = Math.min(rawMark, 4.35);
      }
      if (aggregate.unsupportedCount > 0 && aggregate.perceptiveCount === 0 && aggregate.developedCount <= 1 && aggregate.clearCount <= 1) {
        rawMark = Math.min(rawMark, 4.35);
      }
      if (clearEquivalent < 1.25 && weakRatio > 0.65) {
        rawMark = Math.min(rawMark, 3.35);
      }
      if (aggregate.referenceOnlyCount >= 2 && clearEquivalent < 1.15) {
        rawMark = Math.min(rawMark, 2.45);
      }
      if (aggregate.referenceOnlyCount >= 3 && clearEquivalent <= 1.05) {
        rawMark = Math.min(rawMark, 2.25);
      }
      if (aggregate.featureSpottingCount > 0 && aggregate.perceptiveCount === 0 && aggregate.developedCount === 0 && aggregate.coverage.interpretiveGroups.length === 0) {
        rawMark = Math.min(rawMark, 4.35);
      }
      if (aggregate.featureSpottingCount > 0 && aggregate.perceptiveCount === 0 && clearEquivalent < 3) {
        rawMark = Math.min(rawMark, 5.35);
      }

      let rawPenalty = 0;
      if (aggregate.unsupportedCount > 0) rawPenalty += aggregate.unsupportedCount >= 2 ? 1.0 : 0.55;
      if (aggregate.contradictionCount > 0) rawPenalty += 0.45;
      if (aggregate.seriousMethodMisuseCount > 1) rawPenalty += 0.45;
      if (aggregate.hardUncertaintyCount > 1) rawPenalty += 0.35;
      if (aggregate.quoteDumpCount > 1 && aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount === 0) rawPenalty += 0.45;
      if (aggregate.copyingModerate && aggregate.evidence.usableCount === 0) rawPenalty += 0.4;
      rawMark = clamp(rawMark - rawPenalty, 0, config.maxMark);

      if (rawMark < 2 && (aggregate.unsupportedCount > 0 || aggregate.seriousMethodMisuseCount > 0 || aggregate.featureSpottingCount > 0 || aggregate.genericCount > 0)) {
        rawMark = 2.05;
      }
      if (rawMark < 3 && (aggregate.featureSpottingCount > 0 || (aggregate.genericCount > 0 && aggregate.referenceOnlyCount > 0)) && !aggregate.copyingStrong && aggregate.referenceOnlyCount < 3) {
        rawMark = 3.02;
      }

      if (aggregate.copyingStrong && aggregate.evidence.selectiveCount === 0 && aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount === 0) {
        rawMark = 0;
        notes.push("Copied extract: no creditworthy response.");
      }

      const mark = clamp(Math.round(rawMark), 0, config.maxMark);
      const level = markToLevel(mark);
      return {
        mark: mark,
        rawScore: Number(rawMark.toFixed(2)),
        level: level,
        descriptor: config.levelDescriptors[level],
        caps: uniqueArray(notes),
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
      const notes = ruleMarkData.caps.slice();
      let finalReason = "Rule engine result used without helper adjustment.";

      if (helperPrediction && helperRules.enabled) {
        const diff = helperPrediction.suggestedMark - ruleMarkData.mark;
        const canShiftUp = (
          diff > 0 &&
          helperPrediction.confidence >= (helperRules.upwardThreshold || 0.62) &&
          aggregate.unsupportedCount === 0 &&
          aggregate.copyingModerate === false &&
          aggregate.coverage.supportedGroups.length >= 2 &&
          aggregate.clearEquivalent >= 1.8
        );
        const canShiftDown = (
          diff < 0 &&
          helperPrediction.confidence >= (helperRules.downwardThreshold || 0.5)
        );

        if (canShiftUp) {
          const boost = Math.min(0.68, Math.max(0, helperPrediction.rawMark - ruleMarkData.mark));
          finalRaw = Math.min(config.maxMark, finalRaw + boost);
          notes.push("Calibration helper nudged the score upward because the overall pattern matches stronger calibration answers.");
          finalReason = "Rule mark softened upward by the calibration helper.";
        } else if (canShiftDown) {
          if (
            ruleMarkData.mark >= 8 &&
            helperPrediction.suggestedMark <= 7 &&
            helperPrediction.confidence >= 0.6 &&
            aggregate.evidence.judiciousCount < 2 &&
            (aggregate.perceptiveCount < 2 || aggregate.correctMethodLinks === 0 || aggregate.clearEquivalent < 6.5) &&
            !(helperPrediction.nearest && helperPrediction.nearest.length >= 2 && helperPrediction.nearest[0].mark === 8 && helperPrediction.nearest[1].mark === 8)
          ) {
            finalRaw = Math.min(finalRaw, 7.35);
            notes.push("Calibration helper stopped the answer from reaching full marks because the evidence is strong but not fully judicious or consistently top-band enough for 8.");
            finalReason = "Rule mark softened downward by the calibration helper at the 7 / 8 boundary.";
          }
          if (ruleMarkData.mark >= 7 && helperPrediction.suggestedMark <= 6 && helperPrediction.confidence >= 0.5 && ((aggregate.perceptiveCount === 0 && aggregate.developedCount <= 2 && aggregate.clearEquivalent < 4) || (aggregate.perceptiveCount + aggregate.developedCount < 3 && aggregate.clearEquivalent < 3.2) || aggregate.featureSpottingCount > 0)) {
            finalRaw = Math.min(finalRaw, 6.35);
            notes.push("Calibration helper kept the score in high Level 3 because the response is stronger in coverage than in sustained perceptive insight.");
            finalReason = "Rule mark softened downward by the calibration helper on the Level 3 / 4 boundary.";
          }
          if (ruleMarkData.mark >= 6 && helperPrediction.suggestedMark <= 5 && helperPrediction.confidence >= 0.8 && aggregate.perceptiveCount === 0) {
            finalRaw = Math.min(finalRaw, 5.35);
            notes.push("Calibration helper kept the answer at 5 because it is mainly clear rather than strongly developed throughout.");
            finalReason = "Rule mark reduced because the helper matched stronger Level 3 calibration responses rather than 6-mark responses.";
          }
          if (ruleMarkData.mark >= 5 && helperPrediction.suggestedMark <= 4 && helperPrediction.confidence >= 0.65 && aggregate.coverage.interpretiveGroups.length === 0) {
            finalRaw = Math.min(finalRaw, 4.35);
            notes.push("Calibration helper reduced the mark because the response is broad but still mostly literal or obvious.");
            finalReason = "Rule mark reduced because the helper matched lower-band analytical patterns.";
          }
          if (aggregate.referenceOnlyCount >= 3 && aggregate.clearCount <= 1 && helperPrediction.suggestedMark <= 3) {
            finalRaw = Math.min(finalRaw, 2.35);
            finalReason = "Heavy quotation listing kept the answer in Level 1.";
          }
          if (ruleMarkData.mark >= 4 && aggregate.unsupportedCount > 0) {
            finalRaw = Math.max(0, finalRaw - 0.35);
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
        caps: uniqueArray(notes),
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
      const weakRatio = computeWeakRatio(aggregate);
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
        literalCount: 0,
        featureSpottingCount: 0,
        genericCount: 0,
        referenceOnlyCount: 0,
        quoteDumpCount: 0,
        copiedCount: 0,
        unsupportedCount: 0,
        softHedgeCount: 0,
        hardUncertaintyCount: 0,
        contradictionCount: 0,
        seriousMethodMisuseCount: 0,
        looseMethodCount: 0,
        correctMethodLinks: 0,
        creditworthyCount: 0,
        genericOpeningCount: 0,
        analysisFragmentCount: 0
      };

      units.forEach(function (unit) {
        if (unit.classification === "perceptive_analysis") aggregate.perceptiveCount += 1;
        if (unit.classification === "developed_analysis") aggregate.developedCount += 1;
        if (unit.classification === "clear_analysis") aggregate.clearCount += 1;
        if (unit.classification === "simple_analysis") aggregate.simpleCount += 1;
        if (unit.classification === "literal_comment") aggregate.literalCount += 1;
        if (unit.classification === "feature_spotting") aggregate.featureSpottingCount += 1;
        if (unit.classification === "generic_comment") aggregate.genericCount += 1;
        if (unit.classification === "reference_only") aggregate.referenceOnlyCount += 1;
        if (unit.classification === "quote_dump") aggregate.quoteDumpCount += 1;
        if (unit.classification === "copied_extract") aggregate.copiedCount += 1;
        if (unit.classification === "unsupported_interpretation") aggregate.unsupportedCount += 1;
        if (unit.genericSignals.genericOpening) aggregate.genericOpeningCount += 1;
        aggregate.softHedgeCount += unit.hedging.softHits.length;
        aggregate.hardUncertaintyCount += unit.hedging.hardHits.length;
        aggregate.contradictionCount += unit.contradictions.length;
        aggregate.seriousMethodMisuseCount += unit.methodEval.serious.length;
        aggregate.looseMethodCount += unit.methodEval.loose.length;
        aggregate.correctMethodLinks += unit.methodEval.correct.length;
        aggregate.analysisFragmentCount += unit.analysisFragments;
      });

      aggregate.creditworthyCount = aggregate.perceptiveCount + aggregate.developedCount + aggregate.clearCount + aggregate.simpleCount + aggregate.literalCount;
      aggregate.clearEquivalent = Number((aggregate.perceptiveCount * 1.6 + aggregate.developedCount * 1.28 + aggregate.clearCount + aggregate.simpleCount * 0.6 + aggregate.literalCount * 0.24).toFixed(2));
      aggregate.developedLike = computeDevelopedLike(aggregate);
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
      aggregate.focusScore = evaluateFocus(aggregate);
      aggregate.accuracyScore = evaluateAccuracy(aggregate);
      aggregate.weakRatio = computeWeakRatio(aggregate);
      return aggregate;
    }

    function buildStrengths(aggregate, inputState, markData) {
      const strengths = [];
      if (inputState.status !== "answer") return strengths;
      if (aggregate.perceptiveCount >= 2) strengths.push("There are multiple genuinely interpretive units, not just clear explanation.");
      if (aggregate.developedCount + aggregate.perceptiveCount >= 2) strengths.push("The response develops meaning rather than staying at obvious effect.");
      if (aggregate.clearCount + aggregate.developedCount + aggregate.perceptiveCount >= 3) strengths.push("Several units are analytically focused rather than descriptive.");
      if (aggregate.evidence.selectiveCount >= 2) strengths.push("Most of the evidence is short and purposeful rather than dumped.");
      if (aggregate.coverage.analyticalGroups.length >= 2) strengths.push("More than one part of the extract is analysed, not merely mentioned.");
      if (aggregate.correctMethodLinks >= 1) strengths.push("At least one method is plausibly identified and linked to effect.");
      if (markData.mark === 0 && inputState.status === "copied_extract") strengths.push("The system correctly recognised that the response is the extract, not an answer.");
      return strengths;
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
      if (aggregate.genericCount >= 1 || aggregate.genericOpeningCount >= 1) targets.push("Replace generic phrases like 'creates an effect' with precise words such as 'claustrophobic', 'lifeless', or 'dreamlike'.");
      if (aggregate.literalCount >= 2 && markData.mark < 7) targets.push("Push literal comments further so they explain why the wording matters, not just the surface effect.");
      if (aggregate.evidence.selectiveCount < 2 && markData.mark >= 5) targets.push("Use fewer, shorter quotations and analyse them more sharply.");
      if (aggregate.perceptiveCount + aggregate.developedCount < 2 && markData.mark >= 5) targets.push("To reach secure Level 4, add more genuinely interpretive comments beyond clear explanation.");
      if (aggregate.unsupportedCount >= 1) targets.push("Keep interpretations grounded in the wording of the extract; avoid invented symbolism or abstract claims.");
      if (aggregate.hardUncertaintyCount > 0) targets.push("Avoid strong uncertainty language like 'hard to know' or 'maybe not' because it weakens precision.");
      if (aggregate.seriousMethodMisuseCount >= 1) targets.push("Only use technical terminology when it is clearly correct.");
      if (!targets.length) targets.push("Sustain this standard by keeping the quotations selective and the interpretation consistently grounded.");
      return targets;
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
        caps: markData.caps,
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
        unit.grounded.supportedInterpretationHits || []
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
        "<table class=\"data-table\"><thead><tr><th>ID</th><th>Case</th><th>Expected</th><th>Actual</th><th>Pass</th><th>Level</th><th>Confidence</th></tr></thead><tbody>" + rows + "</tbody></table>";
    }

    function renderReport(result, calibrationResults) {
      const report = $("report");
      if (!report) return;
      const capsHtml = result.caps.length ? "<ul>" + result.caps.map(function (item) {
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
              "<div><dt>Library status</dt><dd>" + (result.libraries.compromise ? "Compromise on" : "Compromise off") + " · " + (result.libraries.winkNLP ? "winkNLP on" : "winkNLP off") + "</dd></div>" +
            "</dl>" +
          "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Strengths</h3>" + strengthsHtml + "</div>" +
          "<div class=\"card\"><h3>Next steps</h3>" + targetsHtml + "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Why it stayed at this level</h3>" + boundaryHtml + "</div>" +
          "<div class=\"card\"><h3>Restrictions or floors applied</h3>" + capsHtml + "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Classification counts</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Perceptive units</dt><dd>" + result.aggregate.perceptiveCount + "</dd></div>" +
              "<div><dt>Developed units</dt><dd>" + result.aggregate.developedCount + "</dd></div>" +
              "<div><dt>Clear units</dt><dd>" + result.aggregate.clearCount + "</dd></div>" +
              "<div><dt>Simple units</dt><dd>" + result.aggregate.simpleCount + "</dd></div>" +
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
        "<section class=\"card\"><h3>Analysis-unit audit</h3><table class=\"data-table\"><thead><tr><th>#</th><th>Unit</th><th>Class</th><th>Evidence</th><th>Grounded effect / meaning</th><th>Issues</th></tr></thead><tbody>" + unitRows + "</tbody></table></section>" +
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
          (state.compromise ? "Compromise loaded" : "Compromise unavailable") +
          " · " +
          (state.winkNLP ? "winkNLP loaded" : "winkNLP unavailable") +
          " · " +
          (state.helperModel ? "helper classifier ready" : "helper classifier unavailable") +
          " · rule engine active";
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
    const customUrl = root.GCSE_MARKER_RULES_URL || "rules.json";
    const response = await fetch(customUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Could not load rules.json");
    }
    return response.json();
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
        wink: winkBundle
      });
      root.GCSEMarker = marker;
      marker.bindUI(marker);

      if (status) {
        const state = marker.getSystemStatus();
        status.textContent =
          (state.compromise ? "Compromise loaded" : "Compromise unavailable") +
          " · " +
          (state.winkNLP ? "winkNLP loaded" : "winkNLP unavailable") +
          " · " +
          (state.helperModel ? "helper classifier ready" : "helper classifier unavailable") +
          " · rule engine active";
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
