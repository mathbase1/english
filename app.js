(function (root, factory) {
  const exported = factory(root);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  } else {
    root.GCSEMarkerApp = exported;
  }
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const STORAGE_KEY = "gcse_english_github_pages_answer_v6";

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
    const regex = /(?:^|[\s(])(?:["“”]|[‘’'])([^"“”'‘’]{2,160}?)(?:["“”]|[‘’'])(?=$|[\s),.;:!?])/g;
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
    return /^(this|these|it|they|which|that)\b/.test(norm);
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
      const label = methodName;
      if (!["adjective", "verb", "noun", "adverb"].includes(label)) return false;
      const targetTag = {
        adjective: "#Adjective",
        verb: "#Verb",
        noun: "#Noun",
        adverb: "#Adverb"
      }[label];

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

      if (label === "verb") {
        return quotes.some(function (quote) {
          return /\boozing\b|\bstifled\b|\bstaring\b/.test(normaliseText(quote.text));
        });
      }
      if (label === "adjective") {
        return quotes.some(function (quote) {
          return /\bblurred\b|\bmisty\b|\bhorribly\b|\bwet\b|\bblack\b|\bgreasy\b|\bsickening\b|\bmeaningless\b/.test(normaliseText(quote.text));
        });
      }
      return false;
    }

    function evaluateMethodUse(textNorm, methodMentions, matchedQuotes, groupIds, grounded) {
      const comparisonHits = phraseHits(textNorm, rules.comparisonTerms || []);
      const genericMethodHits = phraseHits(textNorm, rules.genericMethodLabels || []);
      const correct = [];
      const misused = [];
      const featureSpotters = [];
      const available = getAllowedPools((matchedQuotes || []).map(function (quote) { return quote.id; }), groupIds);

      (methodMentions || []).forEach(function (mention) {
        const name = mention.canonical;
        let supported = false;

        if (name === "symbolism") {
          supported = false;
        } else if (name === "contrast") {
          supported = comparisonHits.length > 0 && groupIds.length >= 2;
        } else if (["adjective", "verb", "noun", "adverb"].includes(name)) {
          supported = available.methods.indexOf(name) !== -1 || grammarLabelSupported(name, matchedQuotes || []);
        } else if (name === "punctuation") {
          supported = /semicolon|dash|ellipsis|punctuation|sentence form|long sentence/.test(textNorm);
        } else {
          supported = available.methods.indexOf(name) !== -1;
        }

        if (!supported) {
          misused.push(name);
        } else if ((grounded.effectHits.length + grounded.interpretationHits.length) === 0) {
          featureSpotters.push(name);
        } else {
          correct.push(name);
        }
      });

      return {
        correctLinks: uniqueArray(correct),
        misused: uniqueArray(misused),
        genericMethodHits: genericMethodHits,
        featureSpottingMethods: uniqueArray(featureSpotters)
      };
    }

    function detectGroundedHits(textNorm, tokens, quoteIds, groupIds) {
      const pools = getAllowedPools(quoteIds, groupIds);
      const effectHits = findApproxHits(textNorm, tokens, pools.effects, 0.72);
      const interpretationHits = findApproxHits(textNorm, tokens, pools.interpretations, 0.72);
      const comparisonHits = phraseHits(textNorm, rules.comparisonTerms || []);

      if (comparisonHits.length) {
        const hasOutside = groupIds.indexOf("magical_outside") !== -1 || groupIds.indexOf("outside_view") !== -1;
        const hasInside = groupIds.indexOf("physical_discomfort") !== -1 || groupIds.indexOf("smell_heat") !== -1 || groupIds.indexOf("blank_passengers") !== -1;
        if (hasOutside && hasInside) {
          interpretationHits.push("outside-inside contrast");
        }
      }

      return {
        effectHits: uniqueArray(effectHits),
        interpretationHits: uniqueArray(interpretationHits),
        comparisonHits: uniqueArray(comparisonHits)
      };
    }

    function detectGenericAnalysis(textNorm) {
      const generic = uniqueArray([].concat(
        phraseHits(textNorm, rules.genericEffectPhrases || []),
        phraseHits(textNorm, rules.genericFrames || []),
        phraseHits(textNorm, rules.featureSpottingPhrases || [])
      ));
      if (/help(s)? the reader/.test(textNorm) && generic.indexOf("helps the reader imagine") === -1) {
        generic.push("generic reader-effect frame");
      }
      if (/create(s)? (a )?certain atmosphere/.test(textNorm) && generic.indexOf("creates a certain atmosphere") === -1) {
        generic.push("creates a certain atmosphere");
      }
      if (/show(s)? what the journey is like/.test(textNorm) && generic.indexOf("shows what the journey is like") === -1) {
        generic.push("shows what the journey is like");
      }
      return uniqueArray(generic);
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
      const hasGrounding = grounded.effectHits.length + grounded.interpretationHits.length > 0;

      if (abstractHits.length && !hasGrounding && (hasSymbolLanguage || hasMetaphorLanguage)) {
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
      if ((methodMentions || []).some(function (item) { return item.canonical === "symbolism"; }) && !hasGrounding) {
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

    function analyseSentence(sentenceText, previousSentence) {
      const text = String(sentenceText || "").trim();
      const norm = normaliseText(text);
      const tokens = tokenize(text);
      const directQuotes = getQuoteMatches(norm, tokens);
      let groupIds = getGroupMatches(norm, tokens, directQuotes);
      const hasDirectEvidence = directQuotes.length > 0;
      const hasLooseReference = groupIds.length > 0;
      const inheritContext = !hasDirectEvidence && previousSentence && startsWithReferentialCue(text) && previousSentence.groupIds.length > 0;

      if (inheritContext) {
        groupIds = uniqueArray(groupIds.concat(previousSentence.groupIds));
      }

      const grounded = detectGroundedHits(norm, tokens, directQuotes.map(function (quote) { return quote.id; }), groupIds);
      const strongHits = phraseHits(norm, rules.analysisVerbsStrong || []);
      const weakHits = phraseHits(norm, rules.analysisVerbsWeak || []);
      const interpretiveHits = phraseHits(norm, rules.interpretivePhrases || []);
      const genericHits = detectGenericAnalysis(norm);
      const methodMentions = detectMethodMentions(norm);
      const uncertaintyHits = detectUncertainty(norm);
      const contradictionHits = detectContradictions(norm, uncertaintyHits);
      const unsupportedHits = detectUnsupportedInterpretation(norm, grounded, methodMentions, groupIds);
      const methodEval = evaluateMethodUse(norm, methodMentions, directQuotes, groupIds, grounded);
      const quoteInfo = detectQuotedSegments(text);
      const quoteWordCount = quoteInfo.reduce(function (sum, item) { return sum + item.wordCount; }, 0);
      const copyMetrics = computeSentenceCopyMetrics(tokens);
      const evidenceUsed = hasDirectEvidence || inheritContext;
      const groundedTotal = grounded.effectHits.length + grounded.interpretationHits.length;
      const strongCueCount = strongHits.length + interpretiveHits.length;
      const nonExtractTokenCount = tokens.filter(function (token) {
        return !extract.stemSet.has(simpleStem(token));
      }).length;
      const commentaryDensity = tokens.length ? nonExtractTokenCount / tokens.length : 0;
      const meaningfulCue = strongCueCount > 0 || (weakHits.length > 0 && genericHits.length === 0) || (commentaryDensity >= 0.28 && genericHits.length === 0);
      const genericOnly = genericHits.length > 0 && grounded.interpretationHits.length === 0;
      const methodOnly = methodMentions.length > 0 && groundedTotal === 0 && methodEval.correctLinks.length === 0;
      const featureSpotting = methodMentions.length > 0 && (methodEval.featureSpottingMethods.length > 0 || (methodEval.correctLinks.length === 0 && (genericHits.length > 0 || groundedTotal === 0)));
      const quoteDump = hasDirectEvidence && (directQuotes.length >= 2 || quoteWordCount >= 10) && strongCueCount === 0 && weakHits.length === 0 && grounded.interpretationHits.length === 0;
      const copiedSentence = copyMetrics.bestSentenceDice >= rules.copyThresholds.sentenceDice && commentaryDensity < 0.22 && strongCueCount === 0 && weakHits.length === 0 && methodMentions.length === 0;
      const insightfulCandidate = (hasDirectEvidence || inheritContext) && grounded.interpretationHits.length > 0 && grounded.effectHits.length > 0 && genericHits.length === 0 && meaningfulCue;

      let classification = "neutral";
      if (copiedSentence) {
        classification = "copied_extract";
      } else if (unsupportedHits.length > 0 || contradictionHits.length > 0 || (methodEval.misused.length > 0 && groundedTotal === 0)) {
        classification = "unsupported_interpretation";
      } else if (featureSpotting || methodOnly) {
        classification = "feature_spotting";
      } else if (quoteDump) {
        classification = "quote_dump";
      } else if (hasDirectEvidence && groundedTotal === 0 && strongCueCount === 0 && weakHits.length === 0) {
        classification = "reference_only";
      } else if (genericOnly || (genericHits.length > 0 && grounded.interpretationHits.length === 0 && strongCueCount === 0)) {
        classification = "generic_comment";
      } else if (insightfulCandidate && uncertaintyHits.length === 0 && methodEval.misused.length === 0 && commentaryDensity >= 0.18) {
        classification = "insightful_analysis";
      } else if ((hasDirectEvidence || (inheritContext && previousSentence && previousSentence.hasDirectEvidence)) && groundedTotal > 0 && meaningfulCue && methodEval.misused.length === 0 && unsupportedHits.length === 0 && genericHits.length === 0) {
        classification = "clear_analysis";
      } else if (groundedTotal > 0 && (meaningfulCue || commentaryDensity >= 0.18) && genericHits.length < 2) {
        classification = "simple_comment";
      } else if (hasLooseReference && weakHits.length > 0 && genericHits.length === 0) {
        classification = "simple_comment";
      }

      return {
        text: text,
        norm: norm,
        tokens: tokens,
        groupIds: groupIds,
        quoteIds: directQuotes.map(function (quote) { return quote.id; }),
        quoteTexts: directQuotes.map(function (quote) { return quote.text; }),
        hasDirectEvidence: hasDirectEvidence,
        hasLooseReference: hasLooseReference,
        inheritedContext: inheritContext,
        evidenceUsed: evidenceUsed,
        grounded: grounded,
        strongHits: strongHits,
        weakHits: weakHits,
        interpretiveHits: interpretiveHits,
        genericHits: genericHits,
        methodMentions: methodMentions.map(function (item) { return item.canonical; }),
        methodEval: methodEval,
        uncertaintyHits: uncertaintyHits,
        contradictionHits: contradictionHits,
        unsupportedHits: unsupportedHits,
        quoteWordCount: quoteWordCount,
        quoteCount: directQuotes.length,
        copyMetrics: copyMetrics,
        classification: classification
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

    function analyticalCoverage(sentenceResults) {
      const clearGroups = new Set();
      const evidenceGroups = new Set();
      sentenceResults.forEach(function (sentence) {
        sentence.groupIds.forEach(function (id) { evidenceGroups.add(id); });
        if (sentence.classification === "clear_analysis" || sentence.classification === "insightful_analysis") {
          sentence.groupIds.forEach(function (id) { clearGroups.add(id); });
        }
      });
      return {
        analyticalGroups: Array.from(clearGroups),
        referenceGroups: Array.from(evidenceGroups)
      };
    }

    function evaluateEvidence(sentenceResults) {
      const usable = [];
      const selective = [];
      const dumped = [];
      sentenceResults.forEach(function (sentence) {
        if (sentence.classification === "quote_dump" || sentence.classification === "reference_only") {
          if (sentence.hasDirectEvidence) dumped.push(sentence);
          return;
        }
        if ((sentence.classification === "clear_analysis" || sentence.classification === "insightful_analysis") && sentence.hasDirectEvidence) {
          usable.push(sentence);
          if (sentence.quoteWordCount <= 8 && sentence.quoteCount <= 2 && sentence.copyMetrics.bestSentenceDice < 0.75) {
            selective.push(sentence);
          }
        }
      });
      return {
        usableCount: usable.length,
        selectiveCount: selective.length,
        dumpedCount: dumped.length,
        judicious: selective.length >= 3 && usable.length >= 3
      };
    }

    function evaluateFocus(sentenceResults) {
      const total = sentenceResults.length;
      if (!total) return 0;
      const creditworthy = sentenceResults.filter(function (item) {
        return ["simple_comment", "clear_analysis", "insightful_analysis"].indexOf(item.classification) !== -1;
      }).length;
      if (creditworthy === 0) return 0;
      const drag = sentenceResults.filter(function (item) {
        return ["generic_comment", "reference_only", "quote_dump", "copied_extract", "unsupported_interpretation", "feature_spotting"].indexOf(item.classification) !== -1;
      }).length;
      const ratio = (creditworthy - drag * 0.5) / total;
      if (ratio <= 0.2) return 1;
      if (ratio <= 0.45) return 2;
      if (ratio <= 0.72) return 3;
      return 4;
    }

    function evaluateAccuracy(sentenceResults, aggregate) {
      let score = 4;
      score -= aggregate.unsupportedCount * 1.2;
      score -= aggregate.misusedMethodCount * 0.8;
      score -= aggregate.contradictionCount * 1.1;
      score -= Math.max(0, aggregate.uncertaintyCount - 1) * 0.5;
      if (aggregate.copyingStrong) score -= 3;
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
        return { status: "paraphrased_extract", mark: 0, level: "Level 0", reason: "The response is too close to the extract and does not add creditworthy analysis." };
      }
      if (nonAnswerHits.length && aggregate.creditworthyCount === 0 && aggregate.referenceOnlyCount === 0) {
        return { status: "not_answer", mark: 0, level: "Level 0", reason: "The response does not answer the task." };
      }
      return { status: "answer", mark: null, level: null, reason: "Creditworthy answer detected." };
    }

    function determineMark(aggregate, inputState) {
      if (inputState.status !== "answer") {
        return {
          mark: inputState.mark,
          level: inputState.level,
          descriptor: config.levelDescriptors[inputState.level],
          caps: [inputState.reason],
          evidenceDescriptor: "No creditworthy evidence",
          analysisDescriptor: "No creditworthy analysis"
        };
      }

      const caps = [];
      let hardCap = config.maxMark;
      if (aggregate.unsupportedCount > 0 || aggregate.misusedMethodCount > 0 || aggregate.contradictionCount > 0 || aggregate.uncertaintyCount > 1) {
        hardCap = Math.min(hardCap, 6);
        caps.push("Accuracy issue: unsupported interpretation, contradiction, method misuse, or repeated uncertainty blocks Level 4.");
      }
      if (aggregate.unsupportedCount > 1 || aggregate.contradictionCount > 1 || aggregate.misusedMethodCount > 2) {
        hardCap = Math.min(hardCap, 4);
        caps.push("Multiple accuracy problems cap the response in Level 2.");
      }
      if (aggregate.referenceOnlyCount >= 3 && aggregate.clearCount + aggregate.insightfulCount === 0) {
        hardCap = Math.min(hardCap, 2);
        caps.push("Quote listing without analysis caps the response in Level 1.");
      }
      if (aggregate.quoteDumpCount >= 2 && aggregate.clearCount + aggregate.insightfulCount === 0) {
        hardCap = Math.min(hardCap, 2);
        caps.push("Quote dumping without analysis caps the response in Level 1.");
      }
      if (aggregate.copyingStrong && aggregate.creditworthyCount === 0) {
        hardCap = 0;
        caps.push("Copied extract: no creditworthy response.");
      }

      const clearEquivalent = aggregate.insightfulCount * 1.5 + aggregate.clearCount + aggregate.simpleCount * 0.45;
      const genericRatio = aggregate.totalSentences ? (aggregate.genericCount + aggregate.featureSpottingCount + aggregate.referenceOnlyCount + aggregate.quoteDumpCount) / aggregate.totalSentences : 1;

      let provisional = 0;
      let level = "Level 0";

      const level4Ready = (
        aggregate.insightfulCount >= rules.scoringThresholds.level4.minInsightful &&
        clearEquivalent >= rules.scoringThresholds.level4.minClearEquivalent &&
        aggregate.evidence.selectiveCount >= rules.scoringThresholds.level4.minSelective &&
        aggregate.evidence.usableCount >= rules.scoringThresholds.level4.minEvidence &&
        aggregate.coverage.analyticalGroups.length >= rules.scoringThresholds.level4.minCoverage &&
        genericRatio <= rules.scoringThresholds.level4.maxGenericRatio &&
        aggregate.unsupportedCount === 0 &&
        aggregate.misusedMethodCount === 0 &&
        aggregate.contradictionCount === 0 &&
        aggregate.uncertaintyCount <= 1 &&
        aggregate.focusScore >= 2
      );

      const level3Ready = (
        clearEquivalent >= rules.scoringThresholds.level3.minClearEquivalent &&
        aggregate.evidence.usableCount >= rules.scoringThresholds.level3.minEvidence &&
        aggregate.coverage.analyticalGroups.length >= rules.scoringThresholds.level3.minCoverage &&
        genericRatio <= rules.scoringThresholds.level3.maxGenericRatio &&
        aggregate.focusScore >= 1 &&
        aggregate.creditworthyCount >= 2
      );

      const level2Ready = (
        aggregate.creditworthyCount >= rules.scoringThresholds.level2.minCreditworthy ||
        aggregate.featureSpottingCount >= 2 ||
        (aggregate.genericCount >= 2 && aggregate.coverage.referenceGroups.length >= 2)
      );

      if (level4Ready) {
        level = "Level 4";
        provisional = 7;
        if (
          aggregate.insightfulCount >= 4 &&
          aggregate.clearCount + aggregate.insightfulCount >= 5 &&
          aggregate.evidence.selectiveCount >= 4 &&
          aggregate.coverage.analyticalGroups.length >= 3 &&
          aggregate.genericCount === 0 &&
          aggregate.featureSpottingCount === 0 &&
          aggregate.correctMethodLinks >= 1
        ) {
          provisional = 8;
        }
      } else if (level3Ready) {
        level = "Level 3";
        provisional = 5;
        if (
          aggregate.insightfulCount >= 1 &&
          aggregate.clearCount + aggregate.insightfulCount >= 3 &&
          aggregate.evidence.selectiveCount >= 2 &&
          aggregate.genericCount <= 1 &&
          aggregate.featureSpottingCount <= 1 &&
          aggregate.unsupportedCount === 0
        ) {
          provisional = 6;
        }
      } else if (level2Ready) {
        level = "Level 2";
        provisional = 3;
        if (
          aggregate.clearCount >= 1 &&
          aggregate.evidence.usableCount >= 1 &&
          aggregate.referenceOnlyCount < aggregate.totalSentences &&
          aggregate.genericCount <= Math.max(2, aggregate.totalSentences - 1)
        ) {
          provisional = 4;
        }
      } else if (aggregate.referenceOnlyCount > 0 || aggregate.genericCount > 0 || aggregate.featureSpottingCount > 0) {
        level = "Level 1";
        provisional = 1;
        if (aggregate.referenceOnlyCount >= 2 || aggregate.genericCount >= 1 || aggregate.simpleCount >= 1) {
          provisional = 2;
        }
      } else {
        level = "Level 0";
        provisional = 0;
      }

      provisional = Math.min(provisional, hardCap);
      if (provisional === 0) {
        level = "Level 0";
      } else if (provisional <= 2) {
        level = "Level 1";
      } else if (provisional <= 4) {
        level = "Level 2";
      } else if (provisional <= 6) {
        level = "Level 3";
      } else {
        level = "Level 4";
      }

      const evidenceDescriptor = aggregate.evidence.judicious
        ? "Judicious evidence"
        : aggregate.evidence.selectiveCount >= 2
          ? "Selective evidence"
          : aggregate.evidence.usableCount >= 1
            ? "Relevant evidence"
            : aggregate.coverage.referenceGroups.length >= 1
              ? "Quoted / mentioned evidence, but not used judiciously"
              : "Little usable evidence";

      const analysisDescriptor = aggregate.insightfulCount >= 2 && aggregate.unsupportedCount === 0
        ? "Consistently grounded, perceptive analysis"
        : aggregate.clearCount + aggregate.insightfulCount >= 2
          ? "Clear grounded analysis"
          : aggregate.simpleCount >= 1
            ? "Some relevant explanation"
            : aggregate.featureSpottingCount >= 1
              ? "Feature spotting, not full analysis"
              : aggregate.referenceOnlyCount >= 1
                ? "Retelling / quotation without analysis"
                : "No creditworthy analysis";

      return {
        mark: provisional,
        level: level,
        descriptor: config.levelDescriptors[level],
        caps: caps,
        evidenceDescriptor: evidenceDescriptor,
        analysisDescriptor: analysisDescriptor
      };
    }

    function computeConfidence(aggregate, markData, inputState) {
      if (inputState.status !== "answer") {
        return { label: "High", range: [markData.mark, markData.mark] };
      }

      let confidence = "High";
      if (
        aggregate.unsupportedCount > 0 ||
        aggregate.misusedMethodCount > 0 ||
        aggregate.contradictionCount > 0 ||
        aggregate.uncertaintyCount > 1 ||
        aggregate.genericCount >= 2 ||
        aggregate.featureSpottingCount >= 2 ||
        aggregate.copyingModerate ||
        (markData.mark >= 7 && aggregate.insightfulCount === 2 && aggregate.clearCount === 1) ||
        (aggregate.coverage.analyticalGroups.length <= 1 && markData.mark >= 5)
      ) {
        confidence = "Medium";
      }
      if (
        aggregate.copyingStrong ||
        aggregate.unsupportedCount > 1 ||
        aggregate.contradictionCount > 0 ||
        aggregate.misusedMethodCount > 2 ||
        aggregate.uncertaintyCount > 3 ||
        (aggregate.interpretationCount > 2 && aggregate.groundedInterpretationCount === 0)
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
        interpretationCount: 0,
        groundedInterpretationCount: 0,
        creditworthyCount: 0,
        copyingStrong: false,
        copyingModerate: false
      };

      sentenceResults.forEach(function (sentence) {
        if (sentence.classification === "insightful_analysis") aggregate.insightfulCount += 1;
        if (sentence.classification === "clear_analysis") aggregate.clearCount += 1;
        if (sentence.classification === "simple_comment") aggregate.simpleCount += 1;
        if (sentence.classification === "feature_spotting") aggregate.featureSpottingCount += 1;
        if (sentence.classification === "generic_comment") aggregate.genericCount += 1;
        if (sentence.classification === "reference_only") aggregate.referenceOnlyCount += 1;
        if (sentence.classification === "quote_dump") aggregate.quoteDumpCount += 1;
        if (sentence.classification === "copied_extract") aggregate.copiedCount += 1;
        if (sentence.classification === "unsupported_interpretation") aggregate.unsupportedCount += 1;
        aggregate.uncertaintyCount += sentence.uncertaintyHits.length;
        aggregate.contradictionCount += sentence.contradictionHits.length;
        aggregate.misusedMethodCount += sentence.methodEval.misused.length;
        aggregate.correctMethodLinks += sentence.methodEval.correctLinks.length;
        aggregate.interpretationCount += sentence.interpretiveHits.length;
        aggregate.groundedInterpretationCount += sentence.grounded.interpretationHits.length;
      });

      aggregate.creditworthyCount = aggregate.insightfulCount + aggregate.clearCount + aggregate.simpleCount;
      aggregate.copyingStrong = copyMetrics.wholeDice >= rules.copyThresholds.wholeDice || copyMetrics.copiedSentenceRatio >= 0.8 || copyMetrics.longestRun >= rules.copyThresholds.longRun;
      aggregate.copyingModerate = copyMetrics.wholeDice >= rules.copyThresholds.nearDice || copyMetrics.copiedSentenceRatio >= 0.5 || copyMetrics.extractTokenShare >= rules.copyThresholds.paraphraseShare;
      aggregate.coverage = analyticalCoverage(sentenceResults);
      aggregate.evidence = evaluateEvidence(sentenceResults);
      aggregate.focusScore = evaluateFocus(sentenceResults);
      aggregate.accuracyScore = evaluateAccuracy(sentenceResults, aggregate);
      return aggregate;
    }

    function buildStrengths(aggregate, sentenceResults, markData, inputState) {
      const strengths = [];
      if (inputState.status !== "answer") return strengths;
      if (aggregate.insightfulCount >= 2) strengths.push("There are multiple sentences with grounded interpretation rather than feature spotting.");
      if (aggregate.clearCount + aggregate.insightfulCount >= 3) strengths.push("The response sustains clear AO2 commentary across several sentences.");
      if (aggregate.evidence.selectiveCount >= 2) strengths.push("The quotations are mostly short and purposeful, so the evidence is selective rather than dumped.");
      if (aggregate.coverage.analyticalGroups.length >= 2) strengths.push("The answer analyses more than one part of the extract, not just one isolated detail.");
      if (aggregate.correctMethodLinks >= 1) strengths.push("At least one method is correctly identified and linked to effect.");
      if (markData.mark === 0 && inputState.status === "copied_extract") strengths.push("The system correctly recognised that the response is the extract, not an answer.");
      return strengths;
    }

    function buildTargets(aggregate, inputState) {
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
      if (aggregate.genericCount >= 1) targets.push("Replace generic phrases like ‘creates an effect’ with specific effects such as ‘claustrophobic’, ‘magical’, or ‘lifeless’.");
      if (aggregate.unsupportedCount >= 1) targets.push("Keep interpretations grounded in the actual wording of the extract; avoid invented symbolism or abstract claims.");
      if (aggregate.uncertaintyCount > 1) targets.push("Avoid repeated ‘might’ / ‘maybe’ / ‘could’ language unless you can prove the point from the quotation.");
      if (aggregate.misusedMethodCount >= 1) targets.push("Only use method terminology when it is correct and clearly supported by the quoted words.");
      if (!targets.length) targets.push("Push one or two comments further by explaining why the language matters, not just what it describes.");
      return targets;
    }

    function analyseAnswer(answerText) {
      const raw = String(answerText || "");
      const norm = normaliseText(raw);
      const tokens = tokenize(raw);
      const sentences = splitSentences(raw);
      const sentenceResults = [];
      let previousSentence = null;
      sentences.forEach(function (sentence) {
        const result = analyseSentence(sentence, previousSentence);
        sentenceResults.push(result);
        previousSentence = result;
      });

      const copyMetrics = analyseCopying(norm, tokens, sentenceResults);
      const aggregate = buildAggregate(sentenceResults, copyMetrics);
      const inputState = determineInputState(raw, norm, tokens, sentenceResults, copyMetrics, aggregate);
      const markData = determineMark(aggregate, inputState);
      const confidence = computeConfidence(aggregate, markData, inputState);
      const strengths = buildStrengths(aggregate, sentenceResults, markData, inputState);
      const targets = buildTargets(aggregate, inputState);

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
        caps: markData.caps,
        confidence: confidence,
        strengths: strengths,
        targets: targets,
        summary: {
          analyticalCoverage: aggregate.coverage.analyticalGroups.length,
          referenceCoverage: aggregate.coverage.referenceGroups.length,
          usableEvidence: aggregate.evidence.usableCount,
          selectiveEvidence: aggregate.evidence.selectiveCount,
          focus: aggregate.focusScore,
          accuracy: aggregate.accuracyScore
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
        sentence.genericHits || [],
        sentence.uncertaintyHits || [],
        sentence.contradictionHits || [],
        sentence.unsupportedHits || [],
        sentence.methodEval.misused || []
      );
      return "<tr>" +
        "<td>" + (index + 1) + "</td>" +
        "<td><div class=\"sentence-text\">" + escapeHtml(sentence.text) + "</div></td>" +
        "<td><span class=\"pill pill-" + sentence.classification + "\">" + escapeHtml(sentence.classification.replace(/_/g, " ")) + "</span></td>" +
        "<td>" + escapeHtml(sentence.quoteTexts.join("; ") || "—") + "</td>" +
        "<td>" + escapeHtml(sentence.grounded.effectHits.concat(sentence.grounded.interpretationHits).join("; ") || "—") + "</td>" +
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
          "</div>" +
        "</section>" +
        "<section class=\"grid-two\">" +
          "<div class=\"card\"><h3>Domain summary</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Analytical coverage</dt><dd>" + result.summary.analyticalCoverage + " group(s)</dd></div>" +
              "<div><dt>Reference coverage</dt><dd>" + result.summary.referenceCoverage + " group(s)</dd></div>" +
              "<div><dt>Usable evidence</dt><dd>" + result.summary.usableEvidence + " sentence(s)</dd></div>" +
              "<div><dt>Selective evidence</dt><dd>" + result.summary.selectiveEvidence + " sentence(s)</dd></div>" +
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
          "<div class=\"card\"><h3>Level caps and restrictions</h3>" + capsHtml + "</div>" +
          "<div class=\"card\"><h3>Classification counts</h3>" +
            "<dl class=\"kv\">" +
              "<div><dt>Insightful analysis</dt><dd>" + result.aggregate.insightfulCount + "</dd></div>" +
              "<div><dt>Clear analysis</dt><dd>" + result.aggregate.clearCount + "</dd></div>" +
              "<div><dt>Simple comments</dt><dd>" + result.aggregate.simpleCount + "</dd></div>" +
              "<div><dt>Feature spotting</dt><dd>" + result.aggregate.featureSpottingCount + "</dd></div>" +
              "<div><dt>Generic comments</dt><dd>" + result.aggregate.genericCount + "</dd></div>" +
              "<div><dt>Reference only</dt><dd>" + result.aggregate.referenceOnlyCount + "</dd></div>" +
              "<div><dt>Unsupported interpretation</dt><dd>" + result.aggregate.unsupportedCount + "</dd></div>" +
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
      if (status) status.textContent = getNlp() ? "Compromise loaded: sentence splitting + POS checks active." : "Heuristic fallback active. Compromise did not load.";
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
