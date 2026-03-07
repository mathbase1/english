(function (root, factory) {
  const exported = factory(root);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  } else {
    root.GCSEMarkerApp = exported;
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const STORAGE_KEY = "gcse_english_github_pages_answer_v7";

  function hasDocument() {
    return typeof document !== "undefined";
  }

  function $(id) {
    return hasDocument() ? document.getElementById(id) : null;
  }

  function getNlp() {
    return typeof root.nlp === "function" ? root.nlp : null;
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

  function intersectUnique(listA, listB) {
    const setB = new Set((listB || []).map(function (item) {
      return normaliseText(item);
    }));
    return uniqueArray((listA || []).filter(function (item) {
      return setB.has(normaliseText(item));
    }));
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

  function tokenize(text) {
    return normaliseText(text)
      .replace(/["']/g, " ")
      .replace(/-/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  function simpleStem(token) {
    let t = String(token || "").toLowerCase();
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

  function makeStemSet(tokens) {
    const set = new Set();
    (tokens || []).forEach(function (token) {
      set.add(simpleStem(token));
    });
    return set;
  }

  function containsPhrase(text, phrase) {
    const haystack = " " + normaliseText(text) + " ";
    const needle = " " + normaliseText(phrase) + " ";
    if (!needle.trim()) return false;
    return haystack.indexOf(needle) !== -1;
  }

  function wordBoundaryRegex(phrase) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  function splitSentences(text) {
    const raw = String(text || "");
    const nlp = getNlp();
    if (nlp) {
      try {
        const doc = nlp(raw);
        const out = doc.sentences().out("array");
        if (Array.isArray(out) && out.length) {
          return out.map(function (item) {
            return String(item || "").trim();
          }).filter(Boolean);
        }
      } catch (error) {
        // fallback below
      }
    }
    return raw
      .split(/(?<=[.!?])\s+|\n+/)
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function countWords(text) {
    return tokenize(text).length;
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
      if (!tokensA.length && !tokensB.length) return 1;
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

  function termScore(textNorm, stemSet, term) {
    const phrase = normaliseText(term);
    if (!phrase) return 0;
    if (containsPhrase(textNorm, phrase)) return 1;
    const termTokens = tokenize(phrase).map(simpleStem);
    if (!termTokens.length) return 0;
    let overlap = 0;
    termTokens.forEach(function (token) {
      if (stemSet.has(token)) overlap += 1;
    });
    const ratio = overlap / termTokens.length;
    if (termTokens.length === 1) return ratio === 1 ? 0.95 : 0;
    if (ratio === 1) return 0.92;
    if (ratio >= 0.8) return 0.8;
    if (ratio >= 0.66) return 0.66;
    return 0;
  }

  function findApproxHits(textNorm, tokens, list, threshold) {
    const cutOff = typeof threshold === "number" ? threshold : 0.72;
    const stemSet = makeStemSet(tokens);
    const hits = [];
    (list || []).forEach(function (item) {
      const score = termScore(textNorm, stemSet, item);
      if (score >= cutOff) hits.push(item);
    });
    return uniqueArray(hits);
  }

  function detectQuotedSegments(text) {
    const segments = [];
    const source = String(text || "");
    const regex = /(?:^|[\s(])(?:["“”]|[‘’'])([^"“”'‘’]{2,180}?)(?:["“”]|[‘’'])(?=$|[\s),.;:!?])/g;
    let match;
    while ((match = regex.exec(source)) !== null) {
      const content = (match[1] || "").trim();
      if (!content) continue;
      segments.push({
        text: content,
        wordCount: countWords(content)
      });
    }
    return segments;
  }

  function startsWithReferentialCue(text) {
    const norm = normaliseText(text);
    return /^(this|these|it|they|which|that|such)/.test(norm);
  }

  function hasVerb(text) {
    const nlp = getNlp();
    if (nlp) {
      try {
        const doc = nlp(String(text || ""));
        return doc.has("#Verb");
      } catch (error) {
        // fall through
      }
    }
    return /\b(is|are|was|were|be|being|been|shows?|makes?|creates?|suggests?|reveals?|presents?|describes?|feels?|seems?)\b/i.test(String(text || ""));
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

  function buildExtractResources(config) {
    const extractNorm = normaliseText(config.sourceExtract);
    const extractTokens = tokenize(extractNorm);
    const extractStemSet = makeStemSet(extractTokens);
    const extract4GramSet = new Set(buildNgrams(extractTokens, 4));
    const extract3GramSet = new Set(buildNgrams(extractTokens, 3));
    const extractSentences = splitSentences(config.sourceExtract).map(function (sentence) {
      return {
        text: sentence,
        norm: normaliseText(sentence),
        tokens: tokenize(sentence)
      };
    });
    return {
      norm: extractNorm,
      tokens: extractTokens,
      stemSet: extractStemSet,
      grams4: extract4GramSet,
      grams3: extract3GramSet,
      sentences: extractSentences
    };
  }

  function createMarker(config, rules, options) {
    const opts = options || {};
    const groupMap = mapArrayById(config.contentGroups);
    const quoteMap = mapArrayById(config.quoteBank);
    const methodAliasList = buildMethodAliasList(rules.methodAliases || {});
    const extract = buildExtractResources(config);

    function getQuoteMatches(textNorm, tokens) {
      const stemSet = makeStemSet(tokens);
      const hits = [];
      config.quoteBank.forEach(function (quote) {
        const score = termScore(textNorm, stemSet, quote.text);
        if (score >= 0.82) hits.push({ id: quote.id, score: score, text: quote.text });
      });
      return uniqueArray(hits.map(function (hit) { return hit.id; })).map(function (id) { return quoteMap[id]; });
    }

    function getGroupMatches(textNorm, tokens, matchedQuotes) {
      const groups = new Set((matchedQuotes || []).map(function (quote) { return quote.group; }));
      const stemSet = makeStemSet(tokens);
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
          aliases: methodAliasList.filter(function (entry) { return entry.canonical === canonical && containsPhrase(textNorm, entry.alias); }).map(function (entry) { return entry.alias; })
        };
      });
    }

    function grammarLabelSupported(methodName, quotes) {
      const nlp = opts.nlp || getNlp();
      if (!["adjective", "verb", "noun", "adverb"].includes(methodName)) return false;
      const targetTag = {
        adjective: "#Adjective",
        verb: "#Verb",
        noun: "#Noun",
        adverb: "#Adverb"
      }[methodName];

      if (nlp) {
        try {
          for (let i = 0; i < quotes.length; i += 1) {
            const doc = nlp(quotes[i].text);
            if (doc.has(targetTag)) return true;
          }
        } catch (error) {
          // ignore and fall through
        }
      }

      if (methodName === "verb") {
        return quotes.some(function (quote) {
          return /\boozing\b|\bstifled\b|\bstaring\b/.test(normaliseText(quote.text));
        });
      }
      if (methodName === "adjective") {
        return quotes.some(function (quote) {
          return /\bblurred\b|\bmisty\b|\bhorribly\b|\bwet\b|\bblack\b|\bgreasy\b|\bsickening\b|\bmeaningless\b/.test(normaliseText(quote.text));
        });
      }
      return false;
    }

    function getContextGroupPairs(groupIds) {
      const ids = new Set(groupIds || []);
      return (config.contrastBridges || []).filter(function (pair) {
        return ids.has(pair[0]) && ids.has(pair[1]);
      });
    }

    function detectGroundedProfile(textNorm, tokens, quoteIds, groupIds) {
      const pools = getAllowedPools(quoteIds, groupIds);
      const supportedEffectHits = findApproxHits(textNorm, tokens, pools.effects, 0.72);
      const supportedInterpretationHits = findApproxHits(textNorm, tokens, pools.interpretations, 0.72);
      const interpretiveSignalHits = phraseHits(textNorm, rules.interpretivePhrases || []);
      const comparisonHits = phraseHits(textNorm, rules.comparisonTerms || []);
      const writerChoiceHits = phraseHits(textNorm, rules.writerChoicePhrases || []);
      const bridgeHits = getContextGroupPairs(groupIds);

      if (comparisonHits.length && bridgeHits.length) {
        supportedInterpretationHits.push("outside-inside contrast");
      }

      const combined = uniqueArray([].concat(supportedEffectHits, supportedInterpretationHits, interpretiveSignalHits));
      const specificEffectHits = intersectUnique(combined, rules.specificEffectTerms || []);
      const highEffectHits = intersectUnique(combined, rules.highResolutionEffectTerms || []);
      const literalEffectHits = intersectUnique(combined, rules.literalEffectTerms || []);

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

    function detectGenericAnalysis(textNorm, isFirstSentence) {
      const genericHits = uniqueArray([].concat(
        phraseHits(textNorm, rules.genericEffectPhrases || []),
        phraseHits(textNorm, rules.genericFrames || [])
      ));
      const featureHits = uniqueArray(phraseHits(textNorm, rules.featureSpottingPhrases || []));
      const literalHits = uniqueArray(phraseHits(textNorm, rules.literalFrames || []));
      const genericOpening = isFirstSentence && phraseHits(textNorm, rules.genericOpenings || []).length > 0;

      if (/help(s)? the reader/.test(textNorm) && genericHits.indexOf("generic reader-effect frame") === -1) {
        genericHits.push("generic reader-effect frame");
      }
      if (/create(s)? (a )?certain atmosphere/.test(textNorm) && genericHits.indexOf("creates a certain atmosphere") === -1) {
        genericHits.push("creates a certain atmosphere");
      }
      if (/show(s)? what the journey is like/.test(textNorm) && genericHits.indexOf("shows what the journey is like") === -1) {
        genericHits.push("shows what the journey is like");
      }
      if (/this just shows/.test(textNorm) && literalHits.indexOf("this just shows") === -1) {
        literalHits.push("this just shows");
      }
      if (/this means/.test(textNorm) && literalHits.indexOf("this means") === -1) {
        literalHits.push("this means");
      }

      return {
        genericHits: uniqueArray(genericHits),
        featureHits: uniqueArray(featureHits),
        literalHits: uniqueArray(literalHits),
        genericOpening: genericOpening
      };
    }

    function detectUncertainty(textNorm) {
      const hits = [];
      (rules.hardUncertainty || []).forEach(function (item) {
        const norm = normaliseText(item);
        if (!norm) return;
        if (wordBoundaryRegex(norm).test(textNorm)) hits.push(item);
      });
      return uniqueArray(hits);
    }

    function detectContradictions(textNorm, uncertaintyHits) {
      const hits = [];
      const certaintyHits = phraseHits(textNorm, rules.certaintyTerms || []);
      if (certaintyHits.length && uncertaintyHits.length) {
        hits.push("certainty mixed with uncertainty");
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
      const hasSymbolLanguage = /symbol|symbolism|symbolises|symbolizes|represents/.test(textNorm);
      const hasMetaphorLanguage = /metaphor|metaphorical/.test(textNorm);
      const hasGroundedMeaning = grounded.supportedEffectHits.length + grounded.supportedInterpretationHits.length > 0;

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
      if ((methodMentions || []).some(function (item) { return item.canonical === "symbolism"; })) {
        hits.push("unsupported symbolism label");
      }
      if (/oppressive force|existential emptiness|spiritual transformation|symbolic transition/.test(textNorm)) {
        hits.push("unsupported abstract phrase");
      }
      if (groupIds.indexOf("physical_discomfort") !== -1 && /(society|spiritual|existential|corruption)/.test(textNorm)) {
        hits.push("interpretation not grounded in quoted detail");
      }
      return uniqueArray(hits);
    }

    function evaluateMethodUse(textNorm, methodMentions, contextQuotes, groupIds, grounded, genericMeta) {
      const comparisonHits = phraseHits(textNorm, rules.comparisonTerms || []);
      const correct = [];
      const misused = [];
      const featureSpottingMethods = [];
      const available = getAllowedPools((contextQuotes || []).map(function (quote) { return quote.id; }), groupIds);
      const hasGroundedMeaning = grounded.specificEffectHits.length > 0 || grounded.supportedInterpretationHits.length > 0;
      const genericMethodHits = phraseHits(textNorm, rules.genericMethodLabels || []);

      (methodMentions || []).forEach(function (mention) {
        const name = mention.canonical;
        let supported = false;

        if (name === "symbolism") {
          supported = false;
        } else if (name === "contrast") {
          supported = (
            (comparisonHits.length > 0 && getContextGroupPairs(groupIds).length > 0) ||
            (((/\bcontrast\b|\bjuxtaposition\b/).test(textNorm) || comparisonHits.length > 0) && (/\boutside\b|\binside\b|\bbus\b/).test(textNorm))
          );
        } else if (["adjective", "verb", "noun", "adverb"].includes(name)) {
          supported = available.methods.indexOf(name) !== -1 || grammarLabelSupported(name, contextQuotes || []);
        } else if (name === "punctuation") {
          supported = /semicolon|dash|ellipsis|punctuation|sentence form|long sentence/.test(textNorm);
        } else {
          supported = available.methods.indexOf(name) !== -1;
        }

        if (!supported) {
          misused.push(name);
        } else if (!hasGroundedMeaning || genericMeta.featureHits.length > 0 || genericMeta.genericHits.length > 0) {
          featureSpottingMethods.push(name);
        } else {
          correct.push(name);
        }
      });

      return {
        correctLinks: uniqueArray(correct),
        misused: uniqueArray(misused),
        featureSpottingMethods: uniqueArray(featureSpottingMethods),
        genericMethodHits: uniqueArray(genericMethodHits)
      };
    }

    function computeSentenceCopyMetrics(tokens) {
      const sentence4Grams = buildNgrams(tokens, 4);
      const sentence3Grams = buildNgrams(tokens, 3);
      const ratio4 = setOverlapRatio(sentence4Grams, extract.grams4);
      const ratio3 = setOverlapRatio(sentence3Grams, extract.grams3);
      let bestSentenceDice = 0;
      extract.sentences.forEach(function (sentence) {
        const score = tokenBigramDice(tokens, sentence.tokens);
        if (score > bestSentenceDice) bestSentenceDice = score;
      });
      const extractTokenOverlap = tokens.length ? tokens.filter(function (token) {
        return extract.stemSet.has(simpleStem(token));
      }).length / tokens.length : 0;
      const run = longestCommonRun(tokens, extract.tokens);
      return {
        ratio4: ratio4,
        ratio3: ratio3,
        bestSentenceDice: bestSentenceDice,
        extractTokenOverlap: extractTokenOverlap,
        longestRun: run
      };
    }

    function downgradeClassification(current, steps) {
      const order = ["insightful_analysis", "clear_analysis", "simple_comment", "literal_comment", "generic_comment"];
      const index = order.indexOf(current);
      if (index === -1) return current;
      const next = clamp(index + steps, 0, order.length - 1);
      return order[next];
    }

    function analyseSentence(sentenceText, previousSentence, index) {
      const text = String(sentenceText || "").trim();
      const norm = normaliseText(text);
      const tokens = tokenize(text);
      const directQuotes = getQuoteMatches(norm, tokens);
      let groupIds = getGroupMatches(norm, tokens, directQuotes);
      const hasDirectEvidence = directQuotes.length > 0;
      const hasLooseReference = groupIds.length > 0;
      const inheritContext = !hasDirectEvidence && previousSentence && previousSentence.contextQuoteIds.length > 0 && startsWithReferentialCue(text);

      if (inheritContext) {
        groupIds = uniqueArray(groupIds.concat(previousSentence.groupIds));
      }

      const contextQuoteIds = hasDirectEvidence
        ? directQuotes.map(function (quote) { return quote.id; })
        : (inheritContext ? previousSentence.contextQuoteIds.slice() : []);
      const contextQuotes = contextQuoteIds.map(function (id) { return quoteMap[id]; }).filter(Boolean);
      const grounded = detectGroundedProfile(norm, tokens, contextQuoteIds, groupIds);
      const strongHits = phraseHits(norm, rules.analysisVerbsStrong || []);
      const weakHits = phraseHits(norm, rules.analysisVerbsWeak || []);
      const genericMeta = detectGenericAnalysis(norm, index === 0);
      const methodMentions = detectMethodMentions(norm);
      const uncertaintyHits = detectUncertainty(norm);
      const contradictionHits = detectContradictions(norm, uncertaintyHits);
      const unsupportedHits = detectUnsupportedInterpretation(norm, grounded, methodMentions, groupIds);
      const methodEval = evaluateMethodUse(norm, methodMentions, contextQuotes, groupIds, grounded, genericMeta);
      const quoteInfo = detectQuotedSegments(text);
      const quoteWordCount = quoteInfo.reduce(function (sum, item) { return sum + item.wordCount; }, 0);
      const copyMetrics = computeSentenceCopyMetrics(tokens);
      const evidenceCarrier = hasDirectEvidence || inheritContext;
      const nonExtractTokenCount = tokens.filter(function (token) {
        return !extract.stemSet.has(simpleStem(token));
      }).length;
      const commentaryDensity = tokens.length ? nonExtractTokenCount / tokens.length : 0;

      const hasSpecificEffect = grounded.specificEffectHits.length > 0;
      const hasHighEffect = grounded.highEffectHits.length > 0;
      const hasSupportedInterpretation = grounded.supportedInterpretationHits.length > 0;
      const hasInterpretiveSignal = grounded.interpretiveSignalHits.length > 0 || grounded.comparisonHits.length > 0;
      const hasWriterChoice = grounded.writerChoiceHits.length > 0;
      const hasStrongAnalysisCue = strongHits.length > 0 || hasInterpretiveSignal || hasWriterChoice;
      const hasWeakCue = weakHits.length > 0;
      const hasMeaningfulCommentary = commentaryDensity >= 0.28;
      const genericHeavy = genericMeta.genericHits.length > 0 || genericMeta.genericOpening;
      const literalHeavy = genericMeta.literalHits.length > 0;
      const methodOnly = methodMentions.length > 0 && !hasSpecificEffect && !hasSupportedInterpretation;
      const featureSpotting = methodOnly || methodEval.featureSpottingMethods.length > 0 || (genericMeta.featureHits.length > 0 && !hasSupportedInterpretation && !hasStrongAnalysisCue);
      const quoteDump = hasDirectEvidence && (directQuotes.length >= 2 || quoteWordCount >= 10) && !hasSpecificEffect && !hasSupportedInterpretation && !hasStrongAnalysisCue && !hasWeakCue;
      const copiedSentence = copyMetrics.bestSentenceDice >= rules.copyThresholds.sentenceDice && commentaryDensity < 0.22 && !hasStrongAnalysisCue && !hasWeakCue && methodMentions.length === 0;

      let quality = 0;
      if (evidenceCarrier) quality += 1.0;
      if (hasSpecificEffect) quality += 0.95;
      if (hasSupportedInterpretation) quality += 1.05;
      if (hasHighEffect) quality += 0.45;
      if (hasStrongAnalysisCue) quality += 0.9;
      else if (hasWeakCue) quality += 0.35;
      if (methodEval.correctLinks.length) quality += 0.35;
      if (hasMeaningfulCommentary) quality += 0.35;
      quality -= genericMeta.genericHits.length * 0.75;
      quality -= genericMeta.literalHits.length * 0.45;
      quality -= genericMeta.featureHits.length * 0.45;
      quality -= uncertaintyHits.length * 0.45;
      quality -= contradictionHits.length * 0.9;
      quality -= unsupportedHits.length * 1.35;
      quality -= methodEval.misused.length * 0.9;
      if (quoteDump) quality -= 1.1;
      if (featureSpotting) quality -= 0.85;
      if (methodOnly) quality -= 0.55;

      let classification = "neutral";
      if (copiedSentence) {
        classification = "copied_extract";
      } else if (unsupportedHits.length > 0 || contradictionHits.length > 0 || (methodEval.misused.length > 0 && !hasSupportedInterpretation && !hasSpecificEffect)) {
        classification = "unsupported_interpretation";
      } else if (quoteDump) {
        classification = "quote_dump";
      } else if (featureSpotting) {
        classification = "feature_spotting";
      } else if (evidenceCarrier && quality >= 4.15 && hasSupportedInterpretation && hasHighEffect && hasStrongAnalysisCue && !genericHeavy && uncertaintyHits.length === 0 && methodEval.misused.length === 0) {
        classification = "insightful_analysis";
      } else if (evidenceCarrier && quality >= 3.0 && (hasSpecificEffect || hasSupportedInterpretation) && !genericHeavy && methodEval.misused.length === 0) {
        classification = "clear_analysis";
      } else if (evidenceCarrier && quality >= 2.0 && (hasSpecificEffect || hasSupportedInterpretation)) {
        classification = "simple_comment";
      } else if (evidenceCarrier && (hasSpecificEffect || hasWeakCue || literalHeavy)) {
        classification = "literal_comment";
      } else if (genericHeavy) {
        classification = "generic_comment";
      } else if (evidenceCarrier || hasLooseReference) {
        classification = "reference_only";
      }

      if (classification === "insightful_analysis" && (genericHeavy || uncertaintyHits.length > 0 || grounded.highEffectHits.length === 0)) {
        classification = downgradeClassification(classification, 1);
      }
      if (classification === "clear_analysis" && ((genericHeavy && !hasSupportedInterpretation) || (literalHeavy && !hasSupportedInterpretation))) {
        classification = downgradeClassification(classification, 1);
      }
      if (classification === "simple_comment" && genericHeavy) {
        classification = downgradeClassification(classification, 1);
      }
      if (classification === "literal_comment" && genericHeavy && !hasSupportedInterpretation) {
        classification = "generic_comment";
      }
      if (classification === "clear_analysis" && uncertaintyHits.length > 1) {
        classification = "simple_comment";
      }
      if (classification === "insightful_analysis" && uncertaintyHits.length > 0) {
        classification = "clear_analysis";
      }

      return {
        text: text,
        norm: norm,
        tokens: tokens,
        groupIds: groupIds,
        contextQuoteIds: contextQuoteIds,
        quoteIds: directQuotes.map(function (quote) { return quote.id; }),
        quoteTexts: directQuotes.map(function (quote) { return quote.text; }),
        hasDirectEvidence: hasDirectEvidence,
        hasLooseReference: hasLooseReference,
        inheritedContext: inheritContext,
        evidenceCarrier: evidenceCarrier,
        grounded: grounded,
        strongHits: strongHits,
        weakHits: weakHits,
        genericMeta: genericMeta,
        methodMentions: methodMentions.map(function (item) { return item.canonical; }),
        methodEval: methodEval,
        uncertaintyHits: uncertaintyHits,
        contradictionHits: contradictionHits,
        unsupportedHits: unsupportedHits,
        quoteWordCount: quoteWordCount,
        quoteCount: directQuotes.length,
        copyMetrics: copyMetrics,
        commentaryDensity: commentaryDensity,
        qualityScore: Number(quality.toFixed(2)),
        classification: classification,
        flags: {
          hasSpecificEffect: hasSpecificEffect,
          hasHighEffect: hasHighEffect,
          hasSupportedInterpretation: hasSupportedInterpretation,
          hasStrongAnalysisCue: hasStrongAnalysisCue,
          genericHeavy: genericHeavy,
          literalHeavy: literalHeavy,
          featureSpotting: featureSpotting,
          quoteDump: quoteDump
        }
      };
    }

    function analyseCopying(answerNorm, answerTokens, sentenceResults) {
      const wholeDice = tokenBigramDice(answerTokens, extract.tokens);
      const answer4Grams = buildNgrams(answerTokens, 4);
      const answer3Grams = buildNgrams(answerTokens, 3);
      const fourGramRatio = setOverlapRatio(answer4Grams, extract.grams4);
      const threeGramRatio = setOverlapRatio(answer3Grams, extract.grams3);
      const extractTokenShare = answerTokens.length ? answerTokens.filter(function (token) {
        return extract.stemSet.has(simpleStem(token));
      }).length / answerTokens.length : 0;
      const longestRun = longestCommonRun(answerTokens, extract.tokens);
      const copiedSentenceRatio = sentenceResults.length ? sentenceResults.filter(function (item) {
        return item.classification === "copied_extract";
      }).length / sentenceResults.length : 0;
      const liftedPhraseCount = config.quoteBank.filter(function (quote) {
        return containsPhrase(answerNorm, quote.text);
      }).length;

      return {
        wholeDice: wholeDice,
        fourGramRatio: fourGramRatio,
        threeGramRatio: threeGramRatio,
        extractTokenShare: extractTokenShare,
        longestRun: longestRun,
        copiedSentenceRatio: copiedSentenceRatio,
        liftedPhraseCount: liftedPhraseCount
      };
    }

    function computeCoverage(sentenceResults) {
      const analytical = new Set();
      const supported = new Set();
      const reference = new Set();
      sentenceResults.forEach(function (sentence) {
        sentence.groupIds.forEach(function (id) { reference.add(id); });
        if (["insightful_analysis", "clear_analysis"].indexOf(sentence.classification) !== -1) {
          sentence.groupIds.forEach(function (id) { analytical.add(id); });
        }
        if (["insightful_analysis", "clear_analysis", "simple_comment", "literal_comment"].indexOf(sentence.classification) !== -1) {
          sentence.groupIds.forEach(function (id) { supported.add(id); });
        }
      });
      return {
        analyticalGroups: Array.from(analytical),
        supportedGroups: Array.from(supported),
        referenceGroups: Array.from(reference)
      };
    }

    function evaluateEvidence(sentenceResults) {
      const attached = [];
      const usable = [];
      const selective = [];
      const dumped = [];
      sentenceResults.forEach(function (sentence) {
        if (!sentence.hasDirectEvidence) return;
        if (["quote_dump", "reference_only", "copied_extract"].indexOf(sentence.classification) !== -1) {
          dumped.push(sentence);
          return;
        }
        if (["insightful_analysis", "clear_analysis"].indexOf(sentence.classification) !== -1) {
          usable.push(sentence);
          if (sentence.quoteWordCount <= 8 && sentence.quoteCount <= 2 && sentence.copyMetrics.bestSentenceDice < 0.76) {
            selective.push(sentence);
          }
        }
        if (["insightful_analysis", "clear_analysis", "simple_comment", "literal_comment"].indexOf(sentence.classification) !== -1) {
          attached.push(sentence);
        }
      });
      return {
        attachedCount: attached.length,
        usableCount: usable.length,
        selectiveCount: selective.length,
        dumpedCount: dumped.length,
        attached: attached,
        usable: usable,
        selective: selective,
        dumped: dumped
      };
    }

    function evaluateFocus(aggregate) {
      const total = aggregate.totalSentences;
      if (!total || aggregate.creditworthyCount === 0) return 0;
      const positive = (aggregate.insightfulCount * 1.25) + (aggregate.clearCount * 1.0) + (aggregate.simpleCount * 0.7) + (aggregate.literalCount * 0.35);
      const drag = (aggregate.genericCount * 1.0) + (aggregate.featureSpottingCount * 0.95) + (aggregate.referenceOnlyCount * 1.0) + (aggregate.quoteDumpCount * 1.15) + (aggregate.unsupportedCount * 1.2) + (aggregate.copiedCount * 1.5) + (aggregate.genericOpeningCount * 0.8);
      const focusIndex = (positive - drag) / total;
      if (focusIndex <= 0.05) return 1;
      if (focusIndex <= 0.3) return 2;
      if (focusIndex <= 0.62) return 3;
      return 4;
    }

    function evaluateAccuracy(aggregate) {
      let score = 4;
      score -= aggregate.unsupportedCount * 1.15;
      score -= aggregate.misusedMethodCount * 0.65;
      score -= aggregate.contradictionCount * 0.95;
      score -= Math.max(0, aggregate.uncertaintyCount - 1) * 0.35;
      if (aggregate.copyingStrong) score -= 2.5;
      if (aggregate.copyingModerate) score -= 0.4;
      return clamp(Number(score.toFixed(2)), 0, 4);
    }

    function determineInputState(answerText, answerNorm, answerTokens, sentenceResults, copyMetrics, aggregate) {
      const words = answerTokens.length;
      const nonAnswerHits = phraseHits(answerNorm, rules.nonAnswerPhrases || []);
      if (!answerNorm) {
        return { status: "blank", mark: 0, level: "Level 0", reason: "Blank response." };
      }
      if (words < rules.minCompleteWords && aggregate.creditworthyCount === 0 && !hasVerb(answerText)) {
        return { status: "incomplete", mark: 0, level: "Level 0", reason: "Incomplete response." };
      }
      const copiedLike = (
        copyMetrics.wholeDice >= 0.95 ||
        copyMetrics.extractTokenShare >= 0.95 ||
        copyMetrics.fourGramRatio >= 0.95 ||
        copyMetrics.copiedSentenceRatio >= 0.8 ||
        copyMetrics.longestRun >= rules.copyThresholds.longRun ||
        (copyMetrics.extractTokenShare >= rules.copyThresholds.extractShare && copyMetrics.fourGramRatio >= rules.copyThresholds.fourGramRatio)
      );
      const paraphraseLike = (
        copyMetrics.wholeDice >= rules.copyThresholds.nearDice ||
        (copyMetrics.extractTokenShare >= rules.copyThresholds.paraphraseShare && copyMetrics.threeGramRatio >= 0.42) ||
        copyMetrics.copiedSentenceRatio >= 0.5
      );

      if (copiedLike && aggregate.creditworthyCount === 0) {
        return { status: "copied_extract", mark: 0, level: "Level 0", reason: "The response is effectively the extract, not an answer." };
      }
      if (paraphraseLike && aggregate.creditworthyCount === 0 && aggregate.referenceOnlyCount + aggregate.quoteDumpCount + aggregate.genericCount >= Math.max(1, sentenceResults.length - 1)) {
        return { status: "paraphrased_extract", mark: 0, level: "Level 0", reason: "The response stays too close to the extract and does not add creditworthy analysis." };
      }
      if (nonAnswerHits.length && aggregate.creditworthyCount === 0 && aggregate.referenceOnlyCount === 0) {
        return { status: "not_answer", mark: 0, level: "Level 0", reason: "The response does not answer the task." };
      }
      return { status: "answer", mark: null, level: null, reason: "Creditworthy answer detected." };
    }

    function buildEvidenceDescriptor(aggregate, mark) {
      if (mark === 0) return "No creditworthy evidence";
      if (mark === 8 && aggregate.evidence.selectiveCount >= 3 && aggregate.evidence.dumpedCount === 0 && aggregate.insightfulCount >= 3) {
        return "Judicious, sharply chosen quotations";
      }
      if (mark >= 7 && aggregate.evidence.selectiveCount >= 2) {
        return "Selective quotations linked to analysis";
      }
      if (mark >= 5 && aggregate.evidence.usableCount >= 2) {
        return "Apt quotations, usually linked to analysis";
      }
      if (mark >= 3 && aggregate.evidence.attachedCount >= 1) {
        return "Some relevant quotation use";
      }
      if (aggregate.coverage.referenceGroups.length >= 1) {
        return "References are present, but often obvious or listed";
      }
      return "Little usable evidence";
    }

    function buildAnalysisDescriptor(aggregate, mark) {
      if (mark === 0) return "No creditworthy analysis";
      if (mark === 8) return "Perceptive, convincing analysis";
      if (mark === 7) return "Thoughtful, well-developed analysis";
      if (mark === 6) return "Clear, developed analysis";
      if (mark === 5) return "Clear relevant analysis";
      if (mark === 4) return "Some clear points, but uneven analysis";
      if (mark === 3) return "Some explanation, often simple or literal";
      if (aggregate.featureSpottingCount >= 1) return "Feature spotting rather than full analysis";
      if (aggregate.referenceOnlyCount >= 1 || aggregate.quoteDumpCount >= 1) return "Retelling / quotation without analysis";
      return "Simple or generic comments";
    }

    function buildCoverageDescriptor(aggregate, mark) {
      if (mark >= 7 && aggregate.coverage.analyticalGroups.length >= 3) return "Several parts of the extract are analysed purposefully.";
      if (mark >= 5 && aggregate.coverage.analyticalGroups.length >= 2) return "More than one part of the extract is analysed.";
      if (aggregate.coverage.supportedGroups.length >= 2) return "Several parts are mentioned, but not all are analysed in depth.";
      if (aggregate.coverage.referenceGroups.length >= 1) return "Some reference coverage, but limited analytical range.";
      return "Very limited coverage.";
    }

    function buildBoundaryReasons(aggregate, mark, inputState) {
      const reasons = [];
      if (inputState.status !== "answer") return reasons;

      if (mark >= 7) {
        if (mark === 7) {
          if (aggregate.insightfulCount < 3) reasons.push("The response is strong, but the perceptive comments are not sustained often enough for 8.");
          if (aggregate.evidence.selectiveCount < 3) reasons.push("Evidence is selective, but not yet judicious enough for full marks.");
          if (aggregate.clearCount + aggregate.insightfulCount < 4) reasons.push("The strongest analysis is not sustained often enough for 8.");
        }
      } else if (mark >= 5) {
        if (aggregate.insightfulCount < 2) reasons.push("The answer is mostly clear rather than genuinely perceptive, so it stays below secure Level 4.");
        if (aggregate.evidence.selectiveCount < 2) reasons.push("Evidence is apt, but not selective enough for secure Level 4.");
        if (aggregate.literalCount > 1) reasons.push("Too many comments stay literal instead of developing interpretation.");
        if (aggregate.genericCount > 0 || aggregate.genericOpeningCount > 0) reasons.push("Generic wording weakens the overall quality judgement.");
      } else {
        if (aggregate.referenceOnlyCount > 0 || aggregate.quoteDumpCount > 0) reasons.push("Quotation listing is still replacing analysis in places.");
        if (aggregate.featureSpottingCount > 0) reasons.push("Naming techniques is not enough without accurate effect and meaning.");
        if (aggregate.genericCount > 0 || aggregate.genericOpeningCount > 0) reasons.push("Generic comments are being counted against the response.");
        if (aggregate.literalCount > 0) reasons.push("Some comments stay literal or obvious rather than analytical.");
      }

      if (aggregate.unsupportedCount > 0) reasons.push("Unsupported interpretation prevents a higher mark.");
      if (aggregate.uncertaintyCount > 1) reasons.push("Repeated hedging reduces confidence and precision.");
      if (aggregate.misusedMethodCount > 0) reasons.push("Incorrect or weakly applied terminology limits the level.");
      return uniqueArray(reasons);
    }

    function determineMark(aggregate, inputState) {
      if (inputState.status !== "answer") {
        return {
          mark: inputState.mark,
          level: inputState.level,
          descriptor: config.levelDescriptors[inputState.level],
          caps: [inputState.reason],
          evidenceDescriptor: "No creditworthy evidence",
          analysisDescriptor: "No creditworthy analysis",
          coverageDescriptor: "No creditworthy coverage",
          boundaryReasons: []
        };
      }

      const caps = [];
      let hardCap = config.maxMark;
      const weakRatio = aggregate.totalSentences ? (aggregate.literalCount + aggregate.genericCount + aggregate.featureSpottingCount + aggregate.referenceOnlyCount + aggregate.quoteDumpCount) / aggregate.totalSentences : 1;
      const clearEquivalent = aggregate.clearEquivalent;
      const t = rules.scoringThresholds || {};

      if (aggregate.unsupportedCount > 0 || aggregate.misusedMethodCount > 0 || aggregate.contradictionCount > 0 || aggregate.uncertaintyCount > 1) {
        hardCap = Math.min(hardCap, 6);
        caps.push("Accuracy issue: unsupported interpretation, contradiction, method misuse, or repeated hedging blocks Level 4.");
      }
      if (aggregate.unsupportedCount > 1 || aggregate.contradictionCount > 0 || aggregate.misusedMethodCount > 2) {
        hardCap = Math.min(hardCap, 4);
        caps.push("Multiple accuracy problems cap the response in Level 2.");
      }
      if (aggregate.referenceOnlyCount >= 3 && aggregate.clearCount + aggregate.insightfulCount === 0) {
        hardCap = Math.min(hardCap, 2);
        caps.push("Reference listing without analysis caps the response in Level 1.");
      }
      if (aggregate.quoteDumpCount >= 2 && aggregate.clearCount + aggregate.insightfulCount === 0) {
        hardCap = Math.min(hardCap, 2);
        caps.push("Repeated quote dumping without real analysis caps the response in Level 1.");
      }
      if (aggregate.genericCount >= 3 && aggregate.insightfulCount + aggregate.clearCount === 0) {
        hardCap = Math.min(hardCap, 3);
        caps.push("Generic commentary prevents the response rising above low Level 2.");
      }
      if (aggregate.featureSpottingCount >= 2 && aggregate.insightfulCount + aggregate.clearCount === 0) {
        hardCap = Math.min(hardCap, 3);
        caps.push("Technique spotting without meaning prevents a higher mark.");
      }
      if (aggregate.copyingStrong && aggregate.creditworthyCount === 0) {
        hardCap = 0;
        caps.push("Copied extract: no creditworthy response.");
      }

      const level4Ready = (
        aggregate.insightfulCount >= t.level4.minInsightful &&
        clearEquivalent >= t.level4.minClearEquivalent &&
        aggregate.evidence.usableCount >= t.level4.minUsableEvidence &&
        aggregate.evidence.selectiveCount >= t.level4.minSelectiveEvidence &&
        aggregate.coverage.analyticalGroups.length >= t.level4.minAnalyticalCoverage &&
        weakRatio <= t.level4.maxWeakRatio &&
        aggregate.literalCount <= t.level4.maxLiteral &&
        aggregate.focusScore >= 3 &&
        aggregate.accuracyScore >= 3.25 &&
        aggregate.unsupportedCount === 0 &&
        aggregate.misusedMethodCount === 0 &&
        aggregate.contradictionCount === 0 &&
        aggregate.uncertaintyCount <= 1 &&
        aggregate.genericOpeningCount === 0
      );

      const mark7Ready = (
        (
          aggregate.insightfulCount >= t.mark7.minInsightful ||
          (aggregate.insightfulCount >= 1 && aggregate.clearCount >= 4 && clearEquivalent >= 4.6 && aggregate.evidence.selectiveCount >= 3)
        ) &&
        clearEquivalent >= t.mark7.minClearEquivalent &&
        aggregate.evidence.usableCount >= t.mark7.minUsableEvidence &&
        aggregate.evidence.selectiveCount >= t.mark7.minSelectiveEvidence &&
        aggregate.coverage.analyticalGroups.length >= t.mark7.minAnalyticalCoverage &&
        weakRatio <= t.mark7.maxWeakRatio &&
        aggregate.literalCount <= t.mark7.maxLiteral &&
        aggregate.focusScore >= 2 &&
        aggregate.accuracyScore >= 3 &&
        aggregate.unsupportedCount === 0 &&
        aggregate.contradictionCount === 0
      );

      const mark6Ready = (
        clearEquivalent >= t.level3high.minClearEquivalent &&
        aggregate.evidence.usableCount >= t.level3high.minUsableEvidence &&
        aggregate.coverage.supportedGroups.length >= t.level3high.minSupportedCoverage &&
        weakRatio <= t.level3high.maxWeakRatio &&
        aggregate.focusScore >= 2 &&
        aggregate.accuracyScore >= 2.5 &&
        aggregate.creditworthyCount >= 3 &&
        aggregate.unsupportedCount === 0
      );

      const mark5Ready = (
        clearEquivalent >= t.level3.minClearEquivalent &&
        aggregate.evidence.attachedCount >= t.level3.minAttachedEvidence &&
        aggregate.coverage.supportedGroups.length >= t.level3.minSupportedCoverage &&
        weakRatio <= t.level3.maxWeakRatio &&
        aggregate.focusScore >= 1 &&
        aggregate.accuracyScore >= 2.1 &&
        aggregate.creditworthyCount >= 2
      );

      const mark4Ready = (
        (aggregate.clearCount + aggregate.simpleCount + aggregate.literalCount >= 2 || aggregate.evidence.attachedCount >= 1) &&
        aggregate.focusScore >= 1 &&
        (aggregate.coverage.referenceGroups.length >= 2 || aggregate.evidence.attachedCount >= 1)
      );

      const mark3Ready = (
        aggregate.creditworthyCount >= 1 ||
        aggregate.featureSpottingCount >= 1 ||
        (aggregate.genericCount >= 1 && aggregate.coverage.referenceGroups.length >= 1)
      );

      const mark2Ready = (
        aggregate.referenceOnlyCount >= 1 || aggregate.genericCount >= 1 || aggregate.featureSpottingCount >= 1 || aggregate.unsupportedCount >= 1 || aggregate.uncertaintyCount >= 1
      );

      let provisional = 0;
      if (level4Ready && aggregate.insightfulCount >= 3 && aggregate.clearCount + aggregate.insightfulCount >= 4 && aggregate.evidence.selectiveCount >= 3 && aggregate.evidence.dumpedCount === 0 && aggregate.genericCount === 0 && aggregate.literalCount === 0) {
        provisional = 8;
      } else if (mark7Ready) {
        provisional = 7;
      } else if (mark6Ready) {
        provisional = 6;
      } else if (mark5Ready) {
        provisional = 5;
      } else if (mark4Ready) {
        provisional = 4;
      } else if (mark3Ready) {
        provisional = 3;
      } else if (mark2Ready) {
        provisional = 2;
      } else if (aggregate.referenceOnlyCount > 0 || aggregate.genericCount > 0 || aggregate.featureSpottingCount > 0 || aggregate.literalCount > 0) {
        provisional = 1;
      } else {
        provisional = 0;
      }

      provisional = Math.min(provisional, hardCap);
      let level = "Level 0";
      if (provisional === 0) level = "Level 0";
      else if (provisional <= 2) level = "Level 1";
      else if (provisional <= 4) level = "Level 2";
      else if (provisional <= 6) level = "Level 3";
      else level = "Level 4";

      return {
        mark: provisional,
        level: level,
        descriptor: config.levelDescriptors[level],
        caps: caps,
        evidenceDescriptor: buildEvidenceDescriptor(aggregate, provisional),
        analysisDescriptor: buildAnalysisDescriptor(aggregate, provisional),
        coverageDescriptor: buildCoverageDescriptor(aggregate, provisional),
        boundaryReasons: buildBoundaryReasons(aggregate, provisional, inputState)
      };
    }

    function computeConfidence(aggregate, markData, inputState) {
      if (inputState.status !== "answer") {
        return { label: "High", range: [markData.mark, markData.mark] };
      }

      let confidence = "High";
      const boundaryMark = [4, 5, 6, 7].indexOf(markData.mark) !== -1;
      const weakRatio = aggregate.totalSentences ? (aggregate.literalCount + aggregate.genericCount + aggregate.featureSpottingCount + aggregate.referenceOnlyCount + aggregate.quoteDumpCount) / aggregate.totalSentences : 1;

      if (
        boundaryMark ||
        aggregate.genericCount >= 1 ||
        aggregate.literalCount >= 2 ||
        aggregate.uncertaintyCount >= 1 ||
        aggregate.copyingModerate ||
        (markData.mark >= 7 && aggregate.insightfulCount === 2) ||
        (markData.mark >= 5 && aggregate.coverage.analyticalGroups.length <= 1) ||
        weakRatio > 0.3
      ) {
        confidence = "Medium";
      }
      if (
        aggregate.copyingStrong ||
        aggregate.unsupportedCount > 0 ||
        aggregate.contradictionCount > 0 ||
        aggregate.misusedMethodCount > 1 ||
        aggregate.uncertaintyCount > 2 ||
        (markData.mark >= 6 && aggregate.insightfulCount === 0) ||
        weakRatio > 0.55
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

    function buildAggregate(sentenceResults, copyMetrics) {
      const aggregate = {
        totalSentences: sentenceResults.length,
        insightfulCount: 0,
        clearCount: 0,
        simpleCount: 0,
        literalCount: 0,
        featureSpottingCount: 0,
        genericCount: 0,
        referenceOnlyCount: 0,
        quoteDumpCount: 0,
        copiedCount: 0,
        unsupportedCount: 0,
        uncertaintyCount: 0,
        contradictionCount: 0,
        misusedMethodCount: 0,
        correctMethodLinks: 0,
        creditworthyCount: 0,
        genericOpeningCount: 0,
        copyingStrong: false,
        copyingModerate: false
      };

      sentenceResults.forEach(function (sentence) {
        if (sentence.classification === "insightful_analysis") aggregate.insightfulCount += 1;
        if (sentence.classification === "clear_analysis") aggregate.clearCount += 1;
        if (sentence.classification === "simple_comment") aggregate.simpleCount += 1;
        if (sentence.classification === "literal_comment") aggregate.literalCount += 1;
        if (sentence.classification === "feature_spotting") aggregate.featureSpottingCount += 1;
        if (sentence.classification === "generic_comment") aggregate.genericCount += 1;
        if (sentence.classification === "reference_only") aggregate.referenceOnlyCount += 1;
        if (sentence.classification === "quote_dump") aggregate.quoteDumpCount += 1;
        if (sentence.classification === "copied_extract") aggregate.copiedCount += 1;
        if (sentence.classification === "unsupported_interpretation") aggregate.unsupportedCount += 1;
        if (sentence.genericMeta.genericOpening) aggregate.genericOpeningCount += 1;
        aggregate.uncertaintyCount += sentence.uncertaintyHits.length;
        aggregate.contradictionCount += sentence.contradictionHits.length;
        aggregate.misusedMethodCount += sentence.methodEval.misused.length;
        aggregate.correctMethodLinks += sentence.methodEval.correctLinks.length;
      });

      aggregate.creditworthyCount = aggregate.insightfulCount + aggregate.clearCount + aggregate.simpleCount + aggregate.literalCount;
      aggregate.clearEquivalent = Number((aggregate.insightfulCount * 1.55 + aggregate.clearCount + aggregate.simpleCount * 0.45 + aggregate.literalCount * 0.12).toFixed(2));
      aggregate.copyingStrong = copyMetrics.wholeDice >= rules.copyThresholds.wholeDice || copyMetrics.copiedSentenceRatio >= 0.8 || copyMetrics.longestRun >= rules.copyThresholds.longRun;
      aggregate.copyingModerate = copyMetrics.wholeDice >= rules.copyThresholds.nearDice || copyMetrics.copiedSentenceRatio >= 0.5 || copyMetrics.extractTokenShare >= rules.copyThresholds.paraphraseShare;
      aggregate.coverage = computeCoverage(sentenceResults);
      aggregate.evidence = evaluateEvidence(sentenceResults);
      aggregate.focusScore = evaluateFocus(aggregate);
      aggregate.accuracyScore = evaluateAccuracy(aggregate);
      return aggregate;
    }

    function buildStrengths(aggregate, inputState, markData) {
      const strengths = [];
      if (inputState.status !== "answer") return strengths;
      if (aggregate.insightfulCount >= 2) strengths.push("At least two sentences move beyond clear explanation into genuine interpretation.");
      if (aggregate.clearCount + aggregate.insightfulCount >= 3) strengths.push("Several sentences are analytically focused rather than descriptive.");
      if (aggregate.evidence.selectiveCount >= 2) strengths.push("Most of the quoted evidence is short and purposeful rather than dumped.");
      if (aggregate.coverage.analyticalGroups.length >= 2) strengths.push("The answer analyses more than one part of the extract, not just one isolated detail.");
      if (aggregate.correctMethodLinks >= 1) strengths.push("At least one method is used accurately and linked to effect.");
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
      if (aggregate.referenceOnlyCount >= 2 || aggregate.quoteDumpCount >= 1) targets.push("Stop listing quotations. Each quotation must be followed by a precise effect or meaning.");
      if (aggregate.featureSpottingCount >= 1) targets.push("Do not name techniques unless you explain the effect accurately in the same sentence.");
      if (aggregate.genericCount >= 1 || aggregate.genericOpeningCount >= 1) targets.push("Replace generic frames like 'the writer uses language' or 'creates an effect' with specific effect words and clear meaning.");
      if (aggregate.literalCount >= 2 && markData.mark < 7) targets.push("Push literal comments further so they explain why the wording matters, not just what it shows on the surface.");
      if (aggregate.evidence.selectiveCount < 2 && markData.mark >= 5) targets.push("Be more selective with quotations: choose fewer, shorter words and analyse them more sharply.");
      if (aggregate.insightfulCount < 2 && markData.mark >= 5) targets.push("To reach secure Level 4, add more genuinely interpretive comments instead of staying at clear explanation.");
      if (aggregate.unsupportedCount >= 1) targets.push("Keep interpretations grounded in the actual wording of the extract; avoid invented symbolism or abstract claims.");
      if (aggregate.uncertaintyCount > 1) targets.push("Avoid repeated 'might' / 'maybe' / 'could' wording unless the quotation genuinely supports the idea.");
      if (aggregate.misusedMethodCount >= 1) targets.push("Only use method terminology when it is correct and clearly supported by the quoted words.");
      if (!targets.length) targets.push("Sustain this standard by keeping evidence selective and the analysis consistently grounded.");
      return targets;
    }

    function analyseAnswer(answerText) {
      const raw = String(answerText || "");
      const norm = normaliseText(raw);
      const tokens = tokenize(raw);
      const sentences = splitSentences(raw);
      const sentenceResults = [];
      let previousSentence = null;
      sentences.forEach(function (sentence, index) {
        const result = analyseSentence(sentence, previousSentence, index);
        sentenceResults.push(result);
        previousSentence = result;
      });

      const copyMetrics = analyseCopying(norm, tokens, sentenceResults);
      const aggregate = buildAggregate(sentenceResults, copyMetrics);
      const inputState = determineInputState(raw, norm, tokens, sentenceResults, copyMetrics, aggregate);
      const markData = determineMark(aggregate, inputState);
      const confidence = computeConfidence(aggregate, markData, inputState);
      const strengths = buildStrengths(aggregate, inputState, markData);
      const targets = buildTargets(aggregate, inputState, markData);

      return {
        rawText: raw,
        wordCount: tokens.length,
        sentenceCount: sentenceResults.length,
        sentences: sentenceResults,
        copyMetrics: copyMetrics,
        aggregate: aggregate,
        inputState: inputState,
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
        summary: {
          analyticalCoverage: aggregate.coverage.analyticalGroups.length,
          supportedCoverage: aggregate.coverage.supportedGroups.length,
          referenceCoverage: aggregate.coverage.referenceGroups.length,
          attachedEvidence: aggregate.evidence.attachedCount,
          usableEvidence: aggregate.evidence.usableCount,
          selectiveEvidence: aggregate.evidence.selectiveCount,
          focus: aggregate.focusScore,
          accuracy: aggregate.accuracyScore,
          clearEquivalent: aggregate.clearEquivalent
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
          confidence: result.confidence.label
        };
      });
    }

    function renderSentenceRow(sentence, index) {
      const issues = [].concat(
        sentence.genericMeta.genericHits || [],
        sentence.genericMeta.literalHits || [],
        sentence.uncertaintyHits || [],
        sentence.contradictionHits || [],
        sentence.unsupportedHits || [],
        sentence.methodEval.misused || []
      );
      const groundedBits = [].concat(
        sentence.grounded.highEffectHits || [],
        sentence.grounded.specificEffectHits || [],
        sentence.grounded.supportedInterpretationHits || []
      );
      return "<tr>" +
        "<td>" + (index + 1) + "</td>" +
        "<td><div class=\"sentence-text\">" + escapeHtml(sentence.text) + "</div></td>" +
        "<td><span class=\"pill pill-" + sentence.classification + "\">" + escapeHtml(sentence.classification.replace(/_/g, " ")) + "</span></td>" +
        "<td>" + escapeHtml(sentence.quoteTexts.join("; ") || "—") + "</td>" +
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
      const sentenceRows = result.sentences.map(renderSentenceRow).join("");

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
              "<div><dt>Supported coverage</dt><dd>" + result.summary.supportedCoverage + " group(s)</dd></div>" +
              "<div><dt>Reference coverage</dt><dd>" + result.summary.referenceCoverage + " group(s)</dd></div>" +
              "<div><dt>Attached evidence</dt><dd>" + result.summary.attachedEvidence + " sentence(s)</dd></div>" +
              "<div><dt>Usable evidence</dt><dd>" + result.summary.usableEvidence + " sentence(s)</dd></div>" +
              "<div><dt>Selective evidence</dt><dd>" + result.summary.selectiveEvidence + " sentence(s)</dd></div>" +
              "<div><dt>Clear-equivalent score</dt><dd>" + result.summary.clearEquivalent + "</dd></div>" +
              "<div><dt>Focus</dt><dd>" + result.summary.focus + " / 4</dd></div>" +
              "<div><dt>Accuracy</dt><dd>" + result.summary.accuracy + " / 4</dd></div>" +
            "</dl>" +
          "</div>" +
          "<div class=\"card\"><h3>Copy / extract checks</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Whole-answer similarity</dt><dd>" + result.copyMetrics.wholeDice.toFixed(2) + "</dd></div>" +
              "<div><dt>4-gram overlap</dt><dd>" + result.copyMetrics.fourGramRatio.toFixed(2) + "</dd></div>" +
              "<div><dt>Extract token share</dt><dd>" + result.copyMetrics.extractTokenShare.toFixed(2) + "</dd></div>" +
              "<div><dt>Copied sentence ratio</dt><dd>" + result.copyMetrics.copiedSentenceRatio.toFixed(2) + "</dd></div>" +
              "<div><dt>Longest copied run</dt><dd>" + result.copyMetrics.longestRun + " token(s)</dd></div>" +
            "</dl>" +
          "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Strengths</h3>" + strengthsHtml + "</div>" +
          "<div class=\"card\"><h3>Next steps</h3>" + targetsHtml + "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Why it stayed at this level</h3>" + boundaryHtml + "</div>" +
          "<div class=\"card\"><h3>Level caps and restrictions</h3>" + capsHtml + "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Classification counts</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Insightful analysis</dt><dd>" + result.aggregate.insightfulCount + "</dd></div>" +
              "<div><dt>Clear analysis</dt><dd>" + result.aggregate.clearCount + "</dd></div>" +
              "<div><dt>Simple comments</dt><dd>" + result.aggregate.simpleCount + "</dd></div>" +
              "<div><dt>Literal comments</dt><dd>" + result.aggregate.literalCount + "</dd></div>" +
              "<div><dt>Feature spotting</dt><dd>" + result.aggregate.featureSpottingCount + "</dd></div>" +
              "<div><dt>Generic comments</dt><dd>" + result.aggregate.genericCount + "</dd></div>" +
              "<div><dt>Reference only</dt><dd>" + result.aggregate.referenceOnlyCount + "</dd></div>" +
              "<div><dt>Unsupported interpretation</dt><dd>" + result.aggregate.unsupportedCount + "</dd></div>" +
            "</dl>" +
          "</div>" +
          "<div class=\"card\"><h3>Quality flags</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Generic openings</dt><dd>" + result.aggregate.genericOpeningCount + "</dd></div>" +
              "<div><dt>Method misuse</dt><dd>" + result.aggregate.misusedMethodCount + "</dd></div>" +
              "<div><dt>Correct method links</dt><dd>" + result.aggregate.correctMethodLinks + "</dd></div>" +
              "<div><dt>Uncertainty flags</dt><dd>" + result.aggregate.uncertaintyCount + "</dd></div>" +
              "<div><dt>Contradiction flags</dt><dd>" + result.aggregate.contradictionCount + "</dd></div>" +
              "<div><dt>Quote dumps</dt><dd>" + result.aggregate.quoteDumpCount + "</dd></div>" +
            "</dl>" +
          "</div>" +
        "</section>" +
        "<section class=\"card\"><h3>Sentence audit</h3><table class=\"data-table\"><thead><tr><th>#</th><th>Sentence</th><th>Class</th><th>Evidence</th><th>Grounded effect / meaning</th><th>Issues</th></tr></thead><tbody>" + sentenceRows + "</tbody></table></section>" +
        (calibrationResults ? "<section class=\"card\"><h3>Calibration runner</h3>" + renderCalibrationTable(calibrationResults) + "</section>" : "");
    }

    function bindUI(marker) {
      const prompt = $("questionPrompt");
      const extractBox = $("sourceExtract");
      const answerBox = $("answerInput");
      const status = $("systemStatus");
      if (prompt) prompt.textContent = config.questionPrompt;
      if (extractBox) extractBox.textContent = config.sourceExtract;
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
        status.textContent = getNlp() ? "Compromise loaded: sentence splitting + POS checks active." : "Compromise unavailable: heuristic fallback active.";
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

    return {
      analyseAnswer: analyseAnswer,
      runCalibration: runCalibration,
      bindUI: bindUI,
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

  async function initBrowser() {
    const status = $("systemStatus");
    try {
      const config = root.QUIZ_CONFIG;
      const rules = await loadRules();
      const marker = createMarker(config, rules, { nlp: getNlp() });
      root.GCSEMarker = marker;
      marker.bindUI(marker);
      if (status) status.textContent = getNlp() ? "Compromise loaded: stricter sentence analysis active." : "Heuristic fallback active. Compromise did not load.";
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
