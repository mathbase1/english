(function (root) {
  "use strict";

  const CONFIG = root.QUIZ_CONFIG || null;
  const STORAGE_KEY = "gcse_english_github_pages_answer_v5";

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
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function uniqueArray(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce(function (sum, value) {
      return sum + value;
    }, 0) / values.length;
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

  function tokenize(text) {
    return normaliseText(text)
      .replace(/["']/g, " ")
      .split(/\s+/)
      .map(function (token) {
        return token.replace(/^'+|'+$/g, "");
      })
      .filter(Boolean);
  }

  function splitSentences(text) {
    const nlp = getNlp();
    if (nlp) {
      try {
        const doc = nlp(String(text || ""));
        const out = doc.sentences().out("array");
        if (Array.isArray(out) && out.length) {
          return out.map(function (sentence) {
            return String(sentence).trim();
          }).filter(Boolean);
        }
      } catch (error) {
        // fall through to heuristic splitter
      }
    }

    return String(text || "")
      .split(/(?<=[.!?])\s+|\n+/)
      .map(function (sentence) {
        return sentence.trim();
      })
      .filter(Boolean);
  }

  function countWords(text) {
    return tokenize(text).length;
  }

  function containsPhrase(text, phrase) {
    const haystack = normaliseText(text);
    const needle = normaliseText(phrase);
    return Boolean(needle) && haystack.indexOf(needle) !== -1;
  }

  function buildNgrams(tokens, size) {
    const grams = [];
    if (!Array.isArray(tokens) || tokens.length < size) return grams;
    for (let i = 0; i <= tokens.length - size; i += 1) {
      grams.push(tokens.slice(i, i + size).join(" "));
    }
    return grams;
  }

  function makeStemSet(tokens) {
    return new Set(tokens.map(simpleStem));
  }

  function termScore(text, stemSet, term) {
    const termNormal = normaliseText(term);
    if (!termNormal) return 0;

    if (containsPhrase(text, term)) return 1;

    const termTokens = tokenize(termNormal).map(simpleStem);
    if (!termTokens.length) return 0;

    let overlap = 0;
    for (let i = 0; i < termTokens.length; i += 1) {
      if (stemSet.has(termTokens[i])) overlap += 1;
    }

    const ratio = overlap / termTokens.length;
    if (termTokens.length === 1) return ratio >= 1 ? 0.95 : 0;
    if (ratio === 1) return 0.92;
    if (ratio >= 0.75) return 0.75;
    if (ratio >= 0.6) return 0.6;
    return 0;
  }

  function findExactPhraseMatches(text, list) {
    const matches = [];
    const source = String(text || "");
    for (let i = 0; i < list.length; i += 1) {
      if (containsPhrase(source, list[i])) matches.push(list[i]);
    }
    return uniqueArray(matches);
  }

  function findApproxMatches(text, tokens, list, threshold) {
    const matches = [];
    const stemSet = makeStemSet(tokens);
    const cutOff = typeof threshold === "number" ? threshold : 0.7;
    for (let i = 0; i < list.length; i += 1) {
      const score = termScore(text, stemSet, list[i]);
      if (score >= cutOff) matches.push(list[i]);
    }
    return uniqueArray(matches);
  }

  function findSingleWordMatches(tokens, list) {
    const tokenSet = new Set(tokens.map(function (token) { return token.toLowerCase(); }));
    const stemSet = makeStemSet(tokens);
    const matches = [];
    for (let i = 0; i < list.length; i += 1) {
      const item = normaliseText(list[i]);
      if (!item) continue;
      if (item.indexOf(" ") !== -1) {
        if (containsPhrase(tokens.join(" "), item)) matches.push(list[i]);
        continue;
      }
      const stem = simpleStem(item);
      if (tokenSet.has(item) || stemSet.has(stem)) matches.push(list[i]);
    }
    return uniqueArray(matches);
  }

  const EXTRACT_TOKENS = CONFIG ? tokenize(CONFIG.sourceExtract) : [];
  const EXTRACT_STEM_SET = makeStemSet(EXTRACT_TOKENS);
  const EXTRACT_4GRAMS = new Set(buildNgrams(EXTRACT_TOKENS, 4));
  const CONTENT_GROUP_MAP = CONFIG
    ? Object.fromEntries(CONFIG.contentGroups.map(function (group) { return [group.id, group]; }))
    : {};

  const METHOD_ALIAS_TO_RULE = CONFIG ? (function buildMethodMap() {
    const aliasMap = {};
    Object.keys(CONFIG.methodRules).forEach(function (key) {
      const rule = CONFIG.methodRules[key];
      (rule.aliases || [key]).forEach(function (alias) {
        aliasMap[alias] = { name: key, rule: rule };
      });
    });
    return aliasMap;
  })() : {};

  function detectQuotedSegments(text) {
    const segments = [];
    const regex = /(?:^|[\s(])(?:["“”]|[‘’'])([^"“”'‘’]{2,160}?)(?:["“”]|[‘’'])(?=$|[\s),.;:!?])/g;
    const source = String(text || "");
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

  function isLikelyExtractQuote(quoteText) {
    if (!quoteText) return false;
    if (containsPhrase(CONFIG.sourceExtract, quoteText)) return true;
    const tokens = tokenize(quoteText);
    if (!tokens.length) return false;

    let overlap = 0;
    for (let i = 0; i < tokens.length; i += 1) {
      if (EXTRACT_STEM_SET.has(simpleStem(tokens[i]))) overlap += 1;
    }

    if (tokens.length === 1) {
      return tokens[0].length > 3 && overlap === 1;
    }

    return overlap / tokens.length >= 0.8;
  }

  function classifyQuotedSegments(text) {
    const segments = detectQuotedSegments(text);
    const extractQuotes = [];
    const shortExtractQuotes = [];
    const mediumExtractQuotes = [];
    const longExtractQuotes = [];
    const nonExtractQuotes = [];
    let quotedExtractWordCount = 0;

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (isLikelyExtractQuote(segment.text)) {
        extractQuotes.push(segment);
        quotedExtractWordCount += segment.wordCount;
        if (segment.wordCount <= 8) {
          shortExtractQuotes.push(segment);
        } else if (segment.wordCount <= 13) {
          mediumExtractQuotes.push(segment);
        } else {
          longExtractQuotes.push(segment);
        }
      } else {
        nonExtractQuotes.push(segment);
      }
    }

    return {
      allQuotes: segments,
      extractQuotes: extractQuotes,
      shortExtractQuotes: shortExtractQuotes,
      mediumExtractQuotes: mediumExtractQuotes,
      longExtractQuotes: longExtractQuotes,
      nonExtractQuotes: nonExtractQuotes,
      quotedExtractWordCount: quotedExtractWordCount
    };
  }

  function findGroupMatches(text, tokens) {
    const stemSet = makeStemSet(tokens);
    const matches = [];

    for (let i = 0; i < CONFIG.contentGroups.length; i += 1) {
      const group = CONFIG.contentGroups[i];
      let bestScore = 0;
      let bestTerm = "";

      for (let j = 0; j < group.terms.length; j += 1) {
        const term = group.terms[j];
        const score = termScore(text, stemSet, term);
        if (score > bestScore) {
          bestScore = score;
          bestTerm = term;
        }
      }

      if (bestScore >= 0.55) {
        matches.push({
          id: group.id,
          label: group.label,
          matchedBy: bestTerm,
          confidence: bestScore
        });
      }
    }

    const ids = new Set(matches.map(function (item) { return item.id; }));
    const hasOutside = ids.has("outside_magic");
    const hasInside = ids.has("dirty_discomfort") || ids.has("smell_closeness") || ids.has("blank_passengers");
    const hasComparison = findExactPhraseMatches(text, CONFIG.comparisonTerms).length > 0;

    if ((hasOutside && hasInside && hasComparison) || containsPhrase(text, "outside") && containsPhrase(text, "inside")) {
      if (!ids.has("contrast_inside_outside")) {
        matches.push({
          id: "contrast_inside_outside",
          label: CONTENT_GROUP_MAP.contrast_inside_outside.label,
          matchedBy: "comparison / shift",
          confidence: 0.9
        });
      }
    }

    return matches.sort(function (a, b) {
      return b.confidence - a.confidence;
    });
  }

  function findSupportedMeaningHits(text, tokens, groupMatches) {
    const stemSet = makeStemSet(tokens);
    const hits = [];

    for (let i = 0; i < groupMatches.length; i += 1) {
      const group = CONTENT_GROUP_MAP[groupMatches[i].id];
      if (!group) continue;
      for (let j = 0; j < group.supportedMeanings.length; j += 1) {
        const meaning = group.supportedMeanings[j];
        const score = termScore(text, stemSet, meaning);
        if (score >= 0.55) {
          hits.push({
            groupId: group.id,
            term: meaning,
            confidence: score
          });
        }
      }
    }

    return hits.sort(function (a, b) {
      return b.confidence - a.confidence;
    });
  }

  function extractSalientOverlap(tokens) {
    const stemSet = makeStemSet(tokens);
    const matched = [];
    for (let i = 0; i < CONFIG.salientExtractTerms.length; i += 1) {
      const term = CONFIG.salientExtractTerms[i];
      if (stemSet.has(simpleStem(term))) {
        matched.push(term);
      }
    }
    return uniqueArray(matched);
  }

  function quoteSupportsGrammarLabel(quoteInfo, label) {
    const quotes = quoteInfo.extractQuotes.map(function (item) { return item.text; });
    const nlp = getNlp();

    if (nlp) {
      try {
        for (let i = 0; i < quotes.length; i += 1) {
          const doc = nlp(quotes[i]);
          if (label === "adjective" && doc.has("#Adjective")) return true;
          if (label === "verb" && doc.has("#Verb")) return true;
          if (label === "noun" && doc.has("#Noun")) return true;
          if (label === "adverb" && doc.has("#Adverb")) return true;
        }
      } catch (error) {
        // fall through to lexical support
      }
    }

    const supportList = CONFIG.grammarSupport[label] || [];
    for (let i = 0; i < quotes.length; i += 1) {
      const quoteTokens = tokenize(quotes[i]);
      for (let j = 0; j < supportList.length; j += 1) {
        if (quoteTokens.indexOf(simpleStem(supportList[j])) !== -1 || containsPhrase(quotes[i], supportList[j])) {
          return true;
        }
      }
      for (let k = 0; k < quoteTokens.length; k += 1) {
        if (supportList.indexOf(quoteTokens[k]) !== -1) return true;
      }
    }
    return false;
  }

  function detectUnsupportedInterpretation(text) {
    const hits = findExactPhraseMatches(text, CONFIG.unsupportedInterpretationPhrases);
    const normal = normaliseText(text);

    const hasAbstract = CONFIG.unsupportedAbstractTerms.some(function (term) {
      return containsPhrase(normal, term);
    });

    if (/(symbol|symbolism|symbolises|symbolizes|represents)/.test(normal) && hasAbstract) {
      hits.push("unsupported abstract symbolism");
    }
    if (/metaphor/.test(normal) && /(transformation|transition|spiritual|existential|society)/.test(normal)) {
      hits.push("unsupported abstract metaphor");
    }
    if (/(mud)/.test(normal) && /(emotion|emotional)/.test(normal) && /(symbol|represents|symbolises|symbolizes)/.test(normal)) {
      hits.push("unsupported emotional symbolism");
    }
    if (/(society)/.test(normal) && /(judge|judging|judgement|judgment|corruption|force|oppressive)/.test(normal)) {
      hits.push("unsupported social reading");
    }

    return uniqueArray(hits);
  }

  function detectContradictions(text, hardUncertaintyHits, certaintyHits) {
    const hits = [];
    const normal = normaliseText(text);

    if (hardUncertaintyHits.length > 0 && certaintyHits.length > 0) {
      hits.push("certainty mixed with uncertainty");
    }
    if (/(but|however|although).{0,20}(maybe|might|could be|perhaps|not sure)/.test(normal)) {
      hits.push("self-contradicting hedge");
    }
    if (/(definitely|clearly|certainly).{0,30}(maybe|might|could be|perhaps)/.test(normal)) {
      hits.push("conflicting certainty");
    }
    if (/(maybe not|or maybe not|but maybe not)/.test(normal)) {
      hits.push("explicit contradiction");
    }
    if (/(metaphor|simile|symbolism).{0,15}(or|maybe).{0,15}(metaphor|simile|symbolism)/.test(normal)) {
      hits.push("contradictory method labelling");
    }

    return uniqueArray(hits);
  }

  function findMethodMentions(text) {
    const hits = [];
    Object.keys(METHOD_ALIAS_TO_RULE).forEach(function (alias) {
      if (containsPhrase(text, alias)) {
        hits.push(alias);
      }
    });
    return uniqueArray(hits);
  }

  function hasComparisonSupport(groupIds, comparisonHits, normal) {
    const hasOutside = groupIds.indexOf("outside_magic") !== -1;
    const hasInside = groupIds.indexOf("dirty_discomfort") !== -1 || groupIds.indexOf("smell_closeness") !== -1 || groupIds.indexOf("blank_passengers") !== -1;
    return comparisonHits.length > 0 || (hasOutside && hasInside) || (containsPhrase(normal, "outside") && containsPhrase(normal, "inside"));
  }

  function evaluateMethods(text, tokens, groupMatches, supportedMeaningHits, specificEffectHits, quoteInfo, highValueHits, comparisonHits, genericEffectHits, pseudoMethodHits) {
    const mentions = findMethodMentions(text);
    const groupIds = groupMatches.map(function (item) { return item.id; });
    const normal = normaliseText(text);
    const correct = [];
    const lowValueCorrect = [];
    const featureSpotted = [];
    const misapplied = [];
    const unlinked = [];

    const hasSpecificEffect = specificEffectHits.length > 0 || supportedMeaningHits.length > 0;
    const hasEvidence = quoteInfo.extractQuotes.length > 0 || highValueHits.length > 0 || groupMatches.length > 0;

    for (let i = 0; i < mentions.length; i += 1) {
      const alias = mentions[i];
      const entry = METHOD_ALIAS_TO_RULE[alias];
      if (!entry) continue;
      const methodName = entry.name;
      const rule = entry.rule;

      const supportedPhraseHit = (rule.supportedPhrases || []).some(function (phrase) {
        return containsPhrase(text, phrase);
      });
      const supportedGroupHit = (rule.supportedGroups || []).some(function (groupId) {
        return groupIds.indexOf(groupId) !== -1;
      });
      let grammarSupported = false;
      if (methodName === "adjective" || methodName === "verb" || methodName === "noun" || methodName === "adverb") {
        grammarSupported = quoteSupportsGrammarLabel(quoteInfo, methodName);
      }
      const comparisonSupported = !rule.requiresComparison || hasComparisonSupport(groupIds, comparisonHits, normal);
      const evidenceSupported = supportedPhraseHit || supportedGroupHit || grammarSupported;

      if (rule.unsupportedByDefault) {
        misapplied.push(methodName);
        continue;
      }

      if (!hasEvidence) {
        unlinked.push(methodName);
        continue;
      }

      if (!comparisonSupported) {
        featureSpotted.push(methodName);
        continue;
      }

      if (evidenceSupported && (!rule.requiresSpecificEffect || hasSpecificEffect)) {
        if (rule.lowValue) {
          lowValueCorrect.push(methodName);
        } else {
          correct.push(methodName);
        }
        continue;
      }

      if (evidenceSupported && rule.requiresSpecificEffect && !hasSpecificEffect) {
        featureSpotted.push(methodName);
        continue;
      }

      if (pseudoMethodHits.length > 0 || genericEffectHits.length > 0) {
        featureSpotted.push(methodName);
      } else {
        misapplied.push(methodName);
      }
    }

    return {
      mentions: mentions,
      correct: uniqueArray(correct),
      lowValueCorrect: uniqueArray(lowValueCorrect),
      featureSpotted: uniqueArray(featureSpotted),
      misapplied: uniqueArray(misapplied),
      unlinked: uniqueArray(unlinked)
    };
  }

  function hasWeakBridge(text, weakVerbHits, supportedMeaningHits, specificEffectHits) {
    if (supportedMeaningHits.length === 0 && specificEffectHits.length === 0) return false;
    if (weakVerbHits.length > 0) return true;
    const normal = normaliseText(text);
    if (/makes?.{0,20}seem/.test(normal)) return true;
    if (/showing.{0,20}(how|that)/.test(normal)) return true;
    if (/through details like/.test(normal)) return true;
    return false;
  }

  function analyseSpag(answerText, sentences) {
    let issues = [];
    let errorCount = 0;

    const originalSentences = String(answerText || "")
      .split(/(?<=[.!?])\s+|\n+/)
      .map(function (sentence) {
        return sentence.trim();
      })
      .filter(Boolean);

    for (let i = 0; i < originalSentences.length; i += 1) {
      const sentence = originalSentences[i];
      const firstLetterMatch = sentence.match(/[A-Za-z]/);
      if (firstLetterMatch && firstLetterMatch[0] !== firstLetterMatch[0].toUpperCase()) {
        issues.push("A sentence appears to start with a lowercase letter.");
        errorCount += 1;
      }
    }

    for (let i = 0; i < originalSentences.length; i += 1) {
      const sentence = originalSentences[i];
      if (!/[.!?\"'”’)]$/.test(sentence)) {
        issues.push("A sentence seems to end without full punctuation.");
        errorCount += 1;
      }
    }

    const lowerCaseICount = (answerText.match(/\bi\b/g) || []).length;
    if (lowerCaseICount > 0) {
      issues.push("Use a capital letter for the pronoun “I”.");
      errorCount += lowerCaseICount;
    }

    const repeatedPunctuationMatches = answerText.match(/([!?;,])\1{1,}|\.{4,}/g) || [];
    if (repeatedPunctuationMatches.length > 0) {
      issues.push("Repeated punctuation has been detected.");
      errorCount += repeatedPunctuationMatches.length;
    }

    const rawTokens = tokenize(answerText);
    for (let i = 0; i < rawTokens.length; i += 1) {
      const token = rawTokens[i];
      if (Object.prototype.hasOwnProperty.call(CONFIG.commonMisspellings, token)) {
        issues.push("Possible spelling issue: “" + token + "” could be “" + CONFIG.commonMisspellings[token] + "”.");
        errorCount += 1;
      }
    }

    const veryLongRunOns = sentences.filter(function (sentence) {
      return countWords(sentence) > 45 && !/[;,:-]/.test(sentence);
    }).length;
    if (veryLongRunOns > 0) {
      issues.push("One sentence looks very long and may need clearer punctuation.");
      errorCount += veryLongRunOns;
    }

    issues = uniqueArray(issues);
    errorCount = Math.min(errorCount, 10);

    let band = "Strong control";
    if (errorCount >= 7) {
      band = "Weak control";
    } else if (errorCount >= 3) {
      band = "Mostly secure";
    }

    const unreadable =
      errorCount >= 8 ||
      (countWords(answerText) > 55 && originalSentences.length <= 1) ||
      veryLongRunOns >= 2;

    return { errorCount: errorCount, issues: issues, band: band, unreadable: unreadable };
  }

  function buildSentenceProfile(sentenceText, index) {
    const tokens = tokenize(sentenceText);
    const groupMatches = findGroupMatches(sentenceText, tokens);
    const highValueHits = findApproxMatches(sentenceText, tokens, CONFIG.highValueReferences, 0.7);
    const salientHits = extractSalientOverlap(tokens);
    const quoteInfo = classifyQuotedSegments(sentenceText);
    const supportedMeaningHits = findSupportedMeaningHits(sentenceText, tokens, groupMatches);
    const specificEffectHits = uniqueArray(
      findApproxMatches(sentenceText, tokens, CONFIG.specificEffectTerms, 0.7)
        .concat(supportedMeaningHits.map(function (item) { return item.term; }))
    );
    const genericEffectHits = findExactPhraseMatches(sentenceText, CONFIG.genericEffectPhrases);
    const circularHits = findExactPhraseMatches(sentenceText, CONFIG.circularReasoningPhrases);
    const pseudoMethodHits = findExactPhraseMatches(sentenceText, CONFIG.pseudoMethodPhrases);
    const featureTriggerHits = findExactPhraseMatches(sentenceText, CONFIG.featureSpottingTriggers);
    const hardUncertaintyHits = findExactPhraseMatches(sentenceText, CONFIG.hardUncertaintyPhrases);
    const certaintyHits = findExactPhraseMatches(sentenceText, CONFIG.certaintyPhrases);
    const contradictionHits = detectContradictions(sentenceText, hardUncertaintyHits, certaintyHits);
    const comparisonHits = findExactPhraseMatches(sentenceText, CONFIG.comparisonTerms);
    const unsupportedHits = detectUnsupportedInterpretation(sentenceText);
    const strongVerbHits = findSingleWordMatches(tokens, CONFIG.strongAnalyticalVerbs);
    const weakVerbHits = findSingleWordMatches(tokens, CONFIG.weakAnalyticalVerbs);
    const strongLinkHits = findExactPhraseMatches(sentenceText, CONFIG.strongLinkPhrases);

    const hasEvidence =
      quoteInfo.extractQuotes.length > 0 ||
      highValueHits.length > 0 ||
      groupMatches.length > 0 ||
      salientHits.length >= 2;

    const methodAssessment = evaluateMethods(
      sentenceText,
      tokens,
      groupMatches,
      supportedMeaningHits,
      specificEffectHits,
      quoteInfo,
      highValueHits,
      comparisonHits,
      genericEffectHits,
      pseudoMethodHits
    );

    const hasSupportedMeaning = supportedMeaningHits.length > 0;
    const hasSpecificEffect = specificEffectHits.length > 0 && !(genericEffectHits.length > 0 && specificEffectHits.length === 0);
    const hasStrongBridge =
      strongVerbHits.length > 0 ||
      strongLinkHits.length > 0 ||
      methodAssessment.correct.length > 0 ||
      comparisonHits.length > 0;
    const hasWeakAnalysisBridge = hasWeakBridge(sentenceText, weakVerbHits, supportedMeaningHits, specificEffectHits);

    const genericHeavy = genericEffectHits.length > 0 || circularHits.length > 0 || pseudoMethodHits.length > 0;
    const quoteDump =
      (quoteInfo.extractQuotes.length >= 3 || quoteInfo.quotedExtractWordCount >= 16 || (quoteInfo.longExtractQuotes.length >= 1 && quoteInfo.shortExtractQuotes.length === 0)) &&
      !(hasSupportedMeaning || hasSpecificEffect) &&
      !(hasStrongBridge || hasWeakAnalysisBridge || methodAssessment.correct.length > 0 || comparisonHits.length > 0);

    const grounded =
      hasEvidence &&
      !quoteDump &&
      !genericHeavy &&
      unsupportedHits.length === 0 &&
      contradictionHits.length === 0 &&
      (hasStrongBridge || hasWeakAnalysisBridge || methodAssessment.correct.length > 0 || methodAssessment.lowValueCorrect.length > 0 || comparisonHits.length > 0) &&
      (hasSupportedMeaning || hasSpecificEffect || methodAssessment.lowValueCorrect.length > 0);

    const developed =
      grounded &&
      ([hasSupportedMeaning, strongLinkHits.length > 0, comparisonHits.length > 0, methodAssessment.correct.length > 0, specificEffectHits.length >= 2]
        .filter(Boolean).length >= 2);

    const clearAnalysis =
      grounded ||
      (hasEvidence &&
        unsupportedHits.length === 0 &&
        contradictionHits.length === 0 &&
        !genericHeavy &&
        !quoteDump &&
        hasSpecificEffect &&
        (hasStrongBridge || hasWeakAnalysisBridge || methodAssessment.lowValueCorrect.length > 0));

    const genericAnalysis =
      hasEvidence &&
      !clearAnalysis &&
      unsupportedHits.length === 0 &&
      (genericHeavy || (weakVerbHits.length > 0 && !hasSpecificEffect) || circularHits.length > 0);

    const featureSpotting =
      hasEvidence &&
      !clearAnalysis &&
      unsupportedHits.length === 0 &&
      (featureTriggerHits.length > 0 || (methodAssessment.featureSpotted.length > 0 && methodAssessment.correct.length === 0));

    const unsupportedInterpretation = hasEvidence && unsupportedHits.length > 0;
    const referenceOnly =
      hasEvidence &&
      !clearAnalysis &&
      !genericAnalysis &&
      !featureSpotting &&
      !unsupportedInterpretation;

    let type = "neutral";
    let label = "Neutral";
    if (unsupportedInterpretation) {
      type = "unsupported-interpretation";
      label = "Unsupported interpretation";
    } else if (developed) {
      type = "developed-analysis";
      label = "Grounded developed analysis";
    } else if (clearAnalysis) {
      type = "analysis";
      label = "Grounded analysis";
    } else if (featureSpotting) {
      type = "feature-spotting";
      label = "Feature spotting";
    } else if (genericAnalysis) {
      type = "generic";
      label = "Generic / vague analysis";
    } else if (referenceOnly || quoteDump) {
      type = "reference-only";
      label = quoteDump ? "Quote dump / retelling" : "Reference only";
    }

    let evidenceCredit = 0;
    let selectiveEvidence = false;
    if (clearAnalysis || developed) {
      if (quoteInfo.shortExtractQuotes.length > 0) {
        evidenceCredit = 1;
        selectiveEvidence = true;
      } else if (highValueHits.length > 0 || quoteInfo.mediumExtractQuotes.length > 0) {
        evidenceCredit = 0.75;
        selectiveEvidence = quoteInfo.longExtractQuotes.length === 0;
      } else if (salientHits.length >= 2) {
        evidenceCredit = 0.5;
      }
      if (developed && quoteInfo.shortExtractQuotes.length >= 2) {
        evidenceCredit = Math.min(1.25, evidenceCredit + 0.25);
      }
    }
    if (quoteDump || featureSpotting || genericAnalysis || unsupportedInterpretation) {
      evidenceCredit = 0;
      selectiveEvidence = false;
    }

    const analyticalCoverageGroups = (clearAnalysis || developed)
      ? uniqueArray(groupMatches.map(function (item) { return item.id; }))
      : [];

    return {
      index: index,
      text: sentenceText,
      tokens: tokens,
      groupMatches: groupMatches,
      groupIds: uniqueArray(groupMatches.map(function (item) { return item.id; })),
      highValueHits: highValueHits,
      salientHits: salientHits,
      quoteInfo: quoteInfo,
      supportedMeaningHits: supportedMeaningHits,
      specificEffectHits: specificEffectHits,
      genericEffectHits: genericEffectHits,
      circularHits: circularHits,
      pseudoMethodHits: pseudoMethodHits,
      featureTriggerHits: featureTriggerHits,
      hardUncertaintyHits: hardUncertaintyHits,
      certaintyHits: certaintyHits,
      contradictionHits: contradictionHits,
      unsupportedHits: unsupportedHits,
      comparisonHits: comparisonHits,
      strongVerbHits: strongVerbHits,
      weakVerbHits: weakVerbHits,
      strongLinkHits: strongLinkHits,
      methodAssessment: methodAssessment,
      hasEvidence: hasEvidence,
      hasSpecificEffect: hasSpecificEffect,
      hasSupportedMeaning: hasSupportedMeaning,
      quoteDump: quoteDump,
      grounded: grounded,
      developed: developed,
      clearAnalysis: clearAnalysis,
      genericAnalysis: genericAnalysis,
      featureSpotting: featureSpotting,
      unsupportedInterpretation: unsupportedInterpretation,
      referenceOnly: referenceOnly,
      analyticalCoverageGroups: analyticalCoverageGroups,
      evidenceCredit: evidenceCredit,
      selectiveEvidence: selectiveEvidence,
      type: type,
      label: label
    };
  }

  function analyseCopying(answerTokens, profiles) {
    const answer4grams = buildNgrams(answerTokens, 4);
    let overlapCount = 0;
    for (let i = 0; i < answer4grams.length; i += 1) {
      if (EXTRACT_4GRAMS.has(answer4grams[i])) overlapCount += 1;
    }
    const overlap4GramRatio = answer4grams.length ? overlapCount / answer4grams.length : 0;
    const quoteShare = answerTokens.length
      ? profiles.reduce(function (sum, profile) {
          return sum + profile.quoteInfo.quotedExtractWordCount;
        }, 0) / answerTokens.length
      : 0;
    return {
      overlap4GramRatio: Number(overlap4GramRatio.toFixed(2)),
      quoteShare: Number(quoteShare.toFixed(2)),
      heavyCopying: overlap4GramRatio >= 0.28 || quoteShare >= 0.45,
      moderateCopying: overlap4GramRatio >= 0.15 || quoteShare >= 0.28
    };
  }

  function scoreCoverage(features) {
    const n = features.analyticalCoverageGroupCount;
    let score = 0;
    if (n >= 1) score = 1;
    if (n >= 2) score = 2;
    if (n >= 3) score = 3;
    if ((n >= 4 && features.groundedSentenceCount >= 3) || n >= 5) score = 4;
    return clamp(score, 0, 4);
  }

  function scoreEvidence(features) {
    let score = 0;
    if (features.evidenceCreditSum >= 0.5) score = 1;
    if (features.evidenceCreditSum >= 1.5 && features.preciseEvidenceSentenceCount >= 1) score = 2;
    if (features.evidenceCreditSum >= 2.5 && features.preciseEvidenceSentenceCount >= 2 && features.quoteDumpCount === 0) {
      score = 3;
    }
    if (
      features.evidenceCreditSum >= 3.25 &&
      features.preciseEvidenceSentenceCount >= 3 &&
      features.selectiveEvidenceSentenceCount >= 2 &&
      features.quoteDumpCount === 0 &&
      features.unsupportedInterpretationCount === 0 &&
      features.genericSentenceCount <= 1
    ) {
      score = 4;
    }

    if (features.referenceOnlyRatio > CONFIG.strictness.moderateRetellRatio && score > 2) score = 2;
    if (features.quoteDumpCount > 0 && score > 2) score -= 1;
    return clamp(score, 0, 4);
  }

  function scoreAnalysis(features) {
    let score = 0;

    if (features.clearAnalysisCount >= 1 || features.genericSentenceCount >= 1) score = 1;
    if ((features.clearAnalysisCount + features.developedSentenceCount) >= 1 && (features.genericSentenceCount + features.groundedSentenceCount) >= 2) {
      score = 2;
    }
    if (
      (features.clearAnalysisCount + features.developedSentenceCount) >= 2 &&
      features.groundedSentenceCount >= 1 &&
      features.unsupportedInterpretationCount === 0 &&
      features.contradictionCount === 0
    ) {
      score = 3;
    }
    if (
      features.developedSentenceCount >= 2 &&
      features.groundedSentenceCount >= 2 &&
      features.supportedMeaningSentenceCount >= 2 &&
      features.unsupportedInterpretationCount === 0 &&
      features.contradictionCount === 0 &&
      features.hardUncertaintySentenceCount === 0
    ) {
      score = 4;
    }
    if (
      features.developedSentenceCount >= 3 &&
      features.groundedSentenceCount >= 3 &&
      features.supportedMeaningSentenceCount >= 3 &&
      features.genericSentenceCount <= 1 &&
      features.unsupportedInterpretationCount === 0 &&
      features.contradictionCount === 0 &&
      features.hardUncertaintySentenceCount === 0
    ) {
      score = 5;
    }

    if (features.featureSpottingCount > features.groundedSentenceCount && score > 0) score -= 1;
    if (features.genericHeavy && score > 0) score -= 1;
    if (features.unsupportedInterpretationCount >= 1) score = Math.min(score, 3);
    if (features.unsupportedInterpretationCount >= 2) score = Math.min(score, 2);
    if (features.contradictionCount >= 1) score = Math.min(score, 3);
    if (features.hardUncertaintySentenceCount >= 2) score = Math.min(score, 3);

    return clamp(score, 0, 5);
  }

  function scoreMethods(features) {
    let score = 0;
    const correctTotal = features.correctMethodCount + features.lowValueCorrectMethodCount;
    if (correctTotal >= 1) score = 1;
    if (features.correctMethodCount >= 2 || (features.correctMethodCount >= 1 && features.lowValueCorrectMethodCount >= 1)) score = 2;
    if (features.correctMethodCount >= 3 || (features.correctMethodCount >= 2 && features.developedSentenceCount >= 1)) score = 3;
    if (features.misappliedMethodCount > correctTotal) score = 0;
    else if (features.misappliedMethodCount >= 1 && score > 1) score -= 1;
    return clamp(score, 0, 3);
  }

  function scoreControl(features) {
    if (features.spag.unreadable || features.relevantSentenceCount === 0) return 0;

    const groundedRatio = features.sentenceCount ? features.groundedSentenceCount / features.sentenceCount : 0;
    const weakRatio = features.sentenceCount
      ? (features.genericSentenceCount + features.referenceOnlyCount + features.featureSpottingCount + features.unsupportedInterpretationCount) / features.sentenceCount
      : 0;

    let score = 1;
    if (features.groundedSentenceCount >= 1 && weakRatio < 0.75) score = 2;
    if (
      features.groundedSentenceCount >= 2 &&
      groundedRatio >= 0.34 &&
      features.referenceOnlyRatio < 0.5 &&
      !features.genericHeavy
    ) {
      score = 3;
    }
    if (
      features.groundedSentenceCount >= 2 &&
      groundedRatio >= 0.45 &&
      weakRatio <= 0.25 &&
      features.unsupportedInterpretationCount === 0 &&
      features.contradictionCount === 0 &&
      features.hardUncertaintySentenceCount === 0
    ) {
      score = 4;
    }

    if (features.genericHeavy) score = Math.min(score, 2);
    if (features.referenceOnlyRatio > CONFIG.strictness.severeRetellRatio) score = Math.min(score, 1);
    if (features.quoteDumpCount > 0 && features.groundedSentenceCount === 0) score = Math.min(score, 1);

    return clamp(score, 0, 4);
  }

  function levelDescriptor(levelText) {
    const found = CONFIG.levelDescriptors.find(function (item) {
      return item.level === levelText;
    });
    return found ? found.summary : "";
  }

  function levelFromMark(mark) {
    if (mark >= 7) return "Level 4";
    if (mark >= 5) return "Level 3";
    if (mark >= 3) return "Level 2";
    if (mark >= 1) return "Level 1";
    return "Level 0";
  }

  function computeConfidence(mark, features, domainScores, capsApplied) {
    let label = "High";
    const reasons = [];

    if (capsApplied.length > 0) {
      label = "Low";
      reasons.push("Penalty caps were applied because the answer had reliability issues such as retelling, generic analysis, or unsupported interpretation.");
    }

    if (features.unsupportedInterpretationCount > 0 || features.misappliedMethodCount > 0) {
      label = "Low";
      reasons.push("Some interpretation or terminology looked unsupported by the extract.");
    }

    if (features.contradictionCount > 0 || features.hardUncertaintySentenceCount > 0) {
      label = label === "Low" ? "Low" : "Medium";
      reasons.push("Uncertainty or contradiction makes the estimate less secure.");
    }

    if (features.genericHeavy || features.featureSpottingCount > features.groundedSentenceCount) {
      label = label === "Low" ? "Low" : "Medium";
      reasons.push("A large share of the response is generic or feature-spotted rather than grounded analysis.");
    }

    if (mark === 7 || mark === 6 || mark === 4) {
      label = label === "Low" ? "Low" : "Medium";
      reasons.push("This sits near a level boundary, so teacher judgement could still move it by a mark.");
    }

    if (features.groundedSentenceCount >= 2 && features.wordCount < 65 && label === "Medium") {
      reasons.push("The answer is concise but strong; the model no longer treats brevity as weakness, though there is slightly less material to cross-check.");
    }

    if (!reasons.length) {
      reasons.push("The response shows a stable pattern with few warning signs.");
    }

    return { label: label, reasons: uniqueArray(reasons) };
  }

  function computeRange(mark, confidence) {
    if (mark === 0) return { low: 0, high: 0 };
    if (confidence.label === "High") return { low: mark, high: mark };
    return {
      low: clamp(mark - 1, 0, CONFIG.maxMark),
      high: clamp(mark + 1, 0, CONFIG.maxMark)
    };
  }

  function determineMark(features) {
    if (features.wordCount < 6 || features.relevanceSignals < 1) {
      return {
        level: "Level 0",
        mark: 0,
        summary: levelDescriptor("Level 0"),
        domainScores: { coverage: 0, evidence: 0, analysis: 0, methods: 0, control: 0, total: 0 },
        confidence: { label: "Low", reasons: ["There is too little relevant material to judge securely."] },
        range: { low: 0, high: 0 },
        capsApplied: []
      };
    }

    const domainScores = {
      coverage: scoreCoverage(features),
      evidence: scoreEvidence(features),
      analysis: scoreAnalysis(features),
      methods: scoreMethods(features),
      control: scoreControl(features)
    };
    domainScores.total = domainScores.coverage + domainScores.evidence + domainScores.analysis + domainScores.methods + domainScores.control;

    const capsApplied = [];
    const accuracyClean =
      features.unsupportedInterpretationCount === 0 &&
      features.misappliedMethodCount === 0 &&
      features.contradictionCount === 0 &&
      features.hardUncertaintySentenceCount === 0;

    let level = "Level 1";

    const level4Gate =
      domainScores.analysis >= 4 &&
      domainScores.evidence >= CONFIG.strictness.l4MinEvidenceScore &&
      domainScores.coverage >= CONFIG.strictness.l4MinAnalyticalGroups &&
      domainScores.control >= 3 &&
      features.groundedSentenceCount >= CONFIG.strictness.l4MinGroundedSentences &&
      features.supportedMeaningSentenceCount >= 2 &&
      !features.genericHeavy &&
      features.referenceOnlyRatio < CONFIG.strictness.moderateRetellRatio &&
      accuracyClean;

    const level3Gate =
      domainScores.analysis >= 3 &&
      domainScores.evidence >= CONFIG.strictness.l3MinEvidenceScore &&
      (features.groundedSentenceCount + features.clearAnalysisCount) >= CONFIG.strictness.l3MinGroundedOrClear &&
      features.referenceOnlyRatio < CONFIG.strictness.severeRetellRatio &&
      features.unsupportedInterpretationCount <= 1 &&
      features.contradictionCount === 0;

    const level2Gate =
      domainScores.analysis >= 1 &&
      domainScores.evidence >= 1 &&
      (features.groundedSentenceCount >= 1 || features.genericSentenceCount >= 1 || features.clearAnalysisCount >= 1);

    if (level4Gate) {
      level = "Level 4";
    } else if (level3Gate) {
      level = "Level 3";
    } else if (level2Gate) {
      level = "Level 2";
    }

    let mark = 1;
    if (level === "Level 4") {
      mark = 7;
      if (
        domainScores.analysis === 5 &&
        domainScores.evidence === 4 &&
        domainScores.control === 4 &&
        features.developedSentenceCount >= 4 &&
        features.supportedMeaningSentenceCount >= 4 &&
        features.analyticalCoverageGroupCount >= 5 &&
        features.correctMethodCount + features.lowValueCorrectMethodCount >= 1 &&
        !features.genericHeavy
      ) {
        mark = 8;
      }
    } else if (level === "Level 3") {
      mark = 5;
      if (
        domainScores.analysis >= 4 ||
        (features.groundedSentenceCount >= 2 && features.evidenceCreditSum >= 2.5 && !features.genericHeavy)
      ) {
        mark = 6;
      }
    } else if (level === "Level 2") {
      mark = 3;
      if (
        features.clearAnalysisCount >= 1 &&
        features.groundedSentenceCount >= 1 &&
        features.referenceOnlyRatio < CONFIG.strictness.moderateRetellRatio &&
        !features.genericHeavy
      ) {
        mark = 4;
      }
    } else {
      mark = features.relevanceSignals >= 2 ? 2 : 1;
    }

    if (features.referenceOnlyRatio > CONFIG.strictness.severeRetellRatio || features.quoteDumpCount >= 1 && features.groundedSentenceCount === 0) {
      mark = Math.min(mark, 2);
      capsApplied.push("Heavy retelling / quote dumping capped the mark.");
    } else if (features.referenceOnlyRatio > CONFIG.strictness.moderateRetellRatio && mark > 4) {
      mark = 4;
      capsApplied.push("Too much of the answer relied on reference rather than analysis.");
    }

    if (features.genericHeavy && mark > 4) {
      mark = 4;
      capsApplied.push("Generic reader-effect language capped the mark at Level 2.");
    }

    if (features.unsupportedInterpretationCount >= 2 || features.misappliedMethodCount >= 2) {
      mark = Math.min(mark, CONFIG.strictness.severeUnsupportedCapMark);
      capsApplied.push("Repeated unsupported interpretation or method misuse capped the mark.");
    } else if (features.unsupportedInterpretationCount >= 1 || features.misappliedMethodCount >= 1) {
      mark = Math.min(mark, CONFIG.strictness.unsupportedCapMark);
      capsApplied.push("Unsupported interpretation or incorrect terminology prevented a higher band.");
    }

    if (features.contradictionCount >= 2 || features.hardUncertaintySentenceCount >= 2) {
      mark = Math.min(mark, CONFIG.strictness.severeContradictionCapMark);
      capsApplied.push("Repeated uncertainty or contradiction capped the mark.");
    } else if (features.contradictionCount >= 1) {
      mark = Math.min(mark, CONFIG.strictness.contradictionCapMark);
      capsApplied.push("Contradiction prevented Level 4.");
    }

    level = levelFromMark(mark);
    const confidence = computeConfidence(mark, features, domainScores, capsApplied);
    const range = computeRange(mark, confidence);

    return {
      level: level,
      mark: mark,
      summary: levelDescriptor(level),
      domainScores: domainScores,
      confidence: confidence,
      range: range,
      capsApplied: capsApplied
    };
  }

  function buildWatchouts(features, grade) {
    const watchouts = [];

    if (features.quoteDumpCount > 0) {
      watchouts.push({ text: "Long quote-dumping or extract listing was detected.", tone: "danger" });
    }
    if (features.referenceOnlyRatio > CONFIG.strictness.moderateRetellRatio) {
      watchouts.push({ text: "Too many sentences mention evidence without analysing it.", tone: "warn" });
    }
    if (features.genericHeavy) {
      watchouts.push({ text: "Generic “reader effect” phrasing is weakening the mark.", tone: "danger" });
    }
    if (features.featureSpottingCount > 0) {
      watchouts.push({ text: "Some sentences only name techniques instead of explaining meaning.", tone: "warn" });
    }
    if (features.unsupportedInterpretationCount > 0) {
      watchouts.push({ text: "At least one interpretation looked unsupported by the extract.", tone: "danger" });
    }
    if (features.misappliedMethodCount > 0) {
      watchouts.push({ text: "Some method labels looked incorrect or ungrounded.", tone: "danger" });
    }
    if (features.hardUncertaintySentenceCount > 0) {
      watchouts.push({ text: "Hedging such as “maybe” or “could be” reduced the score.", tone: "warn" });
    }
    if (features.contradictionCount > 0) {
      watchouts.push({ text: "Contradictory analysis was detected.", tone: "danger" });
    }
    if (grade.capsApplied.length) {
      grade.capsApplied.forEach(function (item) {
        watchouts.push({ text: item, tone: "danger" });
      });
    }
    if (features.spag.unreadable) {
      watchouts.push({ text: "Some sentences are hard to follow.", tone: "warn" });
    }

    return watchouts;
  }

  function buildStrengths(features, grade) {
    const strengths = [];

    if (features.groundedSentenceCount >= 2) {
      strengths.push("You ground several points in the extract instead of relying on vague comment.");
    }
    if (features.supportedMeaningSentenceCount >= 2) {
      strengths.push("You explain specific effects or meanings, not just that language “has an effect”.");
    }
    if (grade.domainScores.evidence >= 3) {
      strengths.push("Your quotations are mostly selective and actually used to support meaning.");
    }
    if (grade.domainScores.coverage >= 3) {
      strengths.push("You cover more than one important part of the extract through actual analysis, not just by listing details.");
    }
    if (features.correctMethodCount + features.lowValueCorrectMethodCount >= 1) {
      strengths.push("Any explicit method comment that scored did so because it was correctly linked to effect.");
    }
    if (features.developedSentenceCount >= 2) {
      strengths.push("More than one sentence counts as developed, grounded analysis.");
    }
    if (!strengths.length) {
      strengths.push("The response is relevant enough to begin collecting marks.");
    }

    return strengths.slice(0, 6);
  }

  function buildTargets(features, grade) {
    const targets = [];

    if (grade.domainScores.evidence < 3) {
      targets.push("Use shorter, embedded quotations and explain them immediately, instead of listing details.");
    }
    if (grade.domainScores.analysis < 4) {
      targets.push("After each quotation, say exactly what the language suggests about Rosabel's experience or the passengers, not just that it “creates an effect”.");
    }
    if (features.featureSpottingCount > 0) {
      targets.push("Do not stop at naming a technique. Only mention a method when you can explain why the writer used it here.");
    }
    if (features.genericHeavy) {
      targets.push("Cut vague phrases such as “helps the reader imagine” and replace them with a specific effect such as claustrophobic, magical, lifeless, or draining.");
    }
    if (features.unsupportedInterpretationCount > 0) {
      targets.push("Keep interpretation grounded in the actual quotation. Avoid invented symbolism or abstract claims the extract does not support.");
    }
    if (features.misappliedMethodCount > 0) {
      targets.push("Check that any method label is correct before using it. Incorrect terminology earns no credit here.");
    }
    if (features.hardUncertaintySentenceCount > 0) {
      targets.push("Avoid repeated hedging such as “maybe” or “could be”. GCSE AO2 rewards accurate explanation, not guesswork.");
    }
    if (features.referenceOnlyRatio > CONFIG.strictness.moderateRetellRatio) {
      targets.push("Turn more of your references into analysis. Coverage only counts when you say something meaningful about the detail.");
    }
    if (!targets.length) {
      if (grade.mark < CONFIG.maxMark) {
        targets.push("To move higher, add one more sharply selective quotation and push the effect into a more precise interpretation.");
      } else {
        targets.push("This already matches the strict top band in this calibrated rule-based marker.");
      }
    }

    return targets.slice(0, 6);
  }

  function analyseAnswer(answerText) {
    const sentences = splitSentences(answerText);
    const answerTokens = tokenize(answerText);
    const profiles = sentences.map(function (sentence, index) {
      return buildSentenceProfile(sentence, index);
    });

    const spag = analyseSpag(answerText, sentences);

    const groundedSentenceCount = profiles.filter(function (profile) {
      return profile.grounded;
    }).length;
    const developedSentenceCount = profiles.filter(function (profile) {
      return profile.developed;
    }).length;
    const clearAnalysisCount = profiles.filter(function (profile) {
      return profile.clearAnalysis;
    }).length;
    const genericSentenceCount = profiles.filter(function (profile) {
      return profile.genericAnalysis;
    }).length;
    const featureSpottingCount = profiles.filter(function (profile) {
      return profile.featureSpotting;
    }).length;
    const unsupportedInterpretationCount = profiles.filter(function (profile) {
      return profile.unsupportedInterpretation;
    }).length;
    const referenceOnlyCount = profiles.filter(function (profile) {
      return profile.referenceOnly || profile.quoteDump;
    }).length;
    const quoteDumpCount = profiles.filter(function (profile) {
      return profile.quoteDump;
    }).length;
    const supportedMeaningSentenceCount = profiles.filter(function (profile) {
      return profile.supportedMeaningHits.length > 0;
    }).length;
    const hardUncertaintySentenceCount = profiles.filter(function (profile) {
      return profile.hardUncertaintyHits.length > 0;
    }).length;
    const contradictionCount = profiles.filter(function (profile) {
      return profile.contradictionHits.length > 0;
    }).length;
    const preciseEvidenceSentenceCount = profiles.filter(function (profile) {
      return profile.evidenceCredit >= 0.75;
    }).length;
    const selectiveEvidenceSentenceCount = profiles.filter(function (profile) {
      return profile.selectiveEvidence;
    }).length;
    const relevantSentenceCount = profiles.filter(function (profile) {
      return profile.hasEvidence || profile.groupMatches.length > 0 || profile.supportedMeaningHits.length > 0;
    }).length;

    const correctMethodCount = profiles.reduce(function (sum, profile) {
      return sum + profile.methodAssessment.correct.length;
    }, 0);
    const lowValueCorrectMethodCount = profiles.reduce(function (sum, profile) {
      return sum + profile.methodAssessment.lowValueCorrect.length;
    }, 0);
    const misappliedMethodCount = profiles.reduce(function (sum, profile) {
      return sum + profile.methodAssessment.misapplied.length;
    }, 0);

    const analyticalCoverageGroups = uniqueArray(
      profiles.reduce(function (acc, profile) {
        return acc.concat(profile.analyticalCoverageGroups);
      }, [])
    );

    const evidenceCreditSum = profiles.reduce(function (sum, profile) {
      return sum + profile.evidenceCredit;
    }, 0);

    const copying = analyseCopying(answerTokens, profiles);
    const genericHeavy = sentences.length > 0
      ? genericSentenceCount / sentences.length > CONFIG.strictness.genericHeavyRatio
      : false;
    const referenceOnlyRatio = sentences.length > 0 ? referenceOnlyCount / sentences.length : 0;

    const matchedContent = uniqueArray(
      profiles.reduce(function (acc, profile) {
        return acc.concat(profile.groupMatches.map(function (item) { return item.id; }));
      }, [])
    ).map(function (groupId) {
      const group = CONTENT_GROUP_MAP[groupId];
      return {
        id: groupId,
        label: group ? group.label : groupId,
        confidence: average(
          profiles
            .filter(function (profile) { return profile.groupIds.indexOf(groupId) !== -1; })
            .map(function (profile) {
              const match = profile.groupMatches.find(function (item) { return item.id === groupId; });
              return match ? match.confidence : 0;
            })
        ) || 0.7
      };
    });

    const features = {
      wordCount: answerTokens.length,
      sentenceCount: sentences.length,
      sentenceProfiles: profiles,
      matchedContent: matchedContent,
      matchedGroupCount: matchedContent.length,
      analyticalCoverageGroups: analyticalCoverageGroups,
      analyticalCoverageGroupCount: analyticalCoverageGroups.length,
      groundedSentenceCount: groundedSentenceCount,
      developedSentenceCount: developedSentenceCount,
      clearAnalysisCount: clearAnalysisCount,
      genericSentenceCount: genericSentenceCount,
      featureSpottingCount: featureSpottingCount,
      unsupportedInterpretationCount: unsupportedInterpretationCount,
      referenceOnlyCount: referenceOnlyCount,
      quoteDumpCount: quoteDumpCount,
      supportedMeaningSentenceCount: supportedMeaningSentenceCount,
      hardUncertaintySentenceCount: hardUncertaintySentenceCount,
      contradictionCount: contradictionCount,
      relevantSentenceCount: relevantSentenceCount,
      preciseEvidenceSentenceCount: preciseEvidenceSentenceCount,
      selectiveEvidenceSentenceCount: selectiveEvidenceSentenceCount,
      evidenceCreditSum: Number(evidenceCreditSum.toFixed(2)),
      genericHeavy: genericHeavy,
      referenceOnlyRatio: Number(referenceOnlyRatio.toFixed(2)),
      copying: copying,
      correctMethodCount: correctMethodCount,
      lowValueCorrectMethodCount: lowValueCorrectMethodCount,
      misappliedMethodCount: misappliedMethodCount,
      spag: spag,
      highValueHits: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.highValueHits); }, [])),
      preciseQuotes: uniqueArray(
        profiles.reduce(function (acc, profile) {
          return acc.concat(profile.quoteInfo.shortExtractQuotes.map(function (item) { return item.text; }));
        }, [])
      ),
      specificEffectHits: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.specificEffectHits); }, [])),
      supportedMeaningHits: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.supportedMeaningHits.map(function (item) { return item.term; })); }, [])),
      genericEffectHits: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.genericEffectHits); }, [])),
      strongVerbHits: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.strongVerbHits); }, [])),
      weakVerbHits: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.weakVerbHits); }, [])),
      methodMentions: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.methodAssessment.mentions); }, [])),
      misappliedMethods: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.methodAssessment.misapplied); }, [])),
      unsupportedHits: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.unsupportedHits); }, [])),
      hardUncertaintyHits: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.hardUncertaintyHits); }, [])),
      contradictionHits: uniqueArray(profiles.reduce(function (acc, profile) { return acc.concat(profile.contradictionHits); }, []))
    };

    features.relevanceSignals =
      features.matchedGroupCount +
      features.preciseEvidenceSentenceCount +
      features.groundedSentenceCount +
      (features.highValueHits.length > 0 ? 1 : 0);

    const grade = determineMark(features);
    const strengths = buildStrengths(features, grade);
    const targets = buildTargets(features, grade);
    const watchouts = buildWatchouts(features, grade);

    return {
      features: features,
      grade: grade,
      strengths: strengths,
      targets: targets,
      watchouts: watchouts
    };
  }

  function runCalibration() {
    return CONFIG.calibrationSet.map(function (sample) {
      const result = analyseAnswer(sample.answer);
      const delta = result.grade.mark - sample.expectedMark;
      return {
        name: sample.name,
        expectedMark: sample.expectedMark,
        actualMark: result.grade.mark,
        delta: delta,
        pass: Math.abs(delta) <= 0,
        level: result.grade.level,
        confidence: result.grade.confidence.label
      };
    });
  }

  function createChip(text, tone) {
    const extra = tone ? " " + tone : "";
    return '<span class="chip' + extra + '">' + escapeHtml(text) + "</span>";
  }

  function renderChipList(container, items, fallbackText, fallbackTone) {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = createChip(fallbackText, fallbackTone || "dim");
      return;
    }
    container.innerHTML = items.map(function (item) {
      if (typeof item === "string") return createChip(item, "");
      if (item.label && typeof item.confidence === "number") {
        return '<span class="chip">' + escapeHtml(item.label) + ' <strong>' + Math.round(item.confidence * 100) + '%</strong></span>';
      }
      return createChip(item.text || item.label || "", item.tone || "");
    }).join("");
  }

  function renderList(container, items, fallbackText) {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = "<li>" + escapeHtml(fallbackText || "None detected.") + "</li>";
      return;
    }
    container.innerHTML = items.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
  }

  function renderRubric() {
    const rubricGrid = $("rubricGrid");
    if (!rubricGrid) return;
    rubricGrid.innerHTML = CONFIG.levelDescriptors.map(function (item) {
      return (
        '<article class="rubric-card">' +
          '<span class="rubric-level">' + escapeHtml(item.level) + ' · ' + escapeHtml(item.marks) + ' marks</span>' +
          '<p>' + escapeHtml(item.summary) + '</p>' +
        '</article>'
      );
    }).join("");
  }

  function renderSentenceAudit(profiles) {
    const container = $("sentenceAudit");
    if (!container) return;

    if (!profiles.length) {
      container.innerHTML = '<div class="sentence-item"><p>No sentences detected.</p></div>';
      return;
    }

    container.innerHTML = profiles.map(function (profile) {
      const tags = [];

      if (profile.type === "developed-analysis") tags.push('<span class="audit-tag good">Grounded developed analysis</span>');
      else if (profile.type === "analysis") tags.push('<span class="audit-tag good">Grounded analysis</span>');
      else if (profile.type === "feature-spotting") tags.push('<span class="audit-tag warn">Feature spotting</span>');
      else if (profile.type === "generic") tags.push('<span class="audit-tag warn">Generic / vague</span>');
      else if (profile.type === "unsupported-interpretation") tags.push('<span class="audit-tag danger">Unsupported interpretation</span>');
      else if (profile.type === "reference-only") tags.push('<span class="audit-tag warn">Reference only / quote dump</span>');
      else tags.push('<span class="audit-tag dim">Neutral</span>');

      if (profile.methodAssessment.correct.length > 0 || profile.methodAssessment.lowValueCorrect.length > 0) {
        tags.push('<span class="audit-tag good">Correct method link</span>');
      }
      if (profile.methodAssessment.misapplied.length > 0) {
        tags.push('<span class="audit-tag danger">Misapplied method</span>');
      }
      if (profile.hardUncertaintyHits.length > 0) {
        tags.push('<span class="audit-tag warn">Uncertainty</span>');
      }
      if (profile.contradictionHits.length > 0) {
        tags.push('<span class="audit-tag danger">Contradiction</span>');
      }
      if (profile.quoteDump) {
        tags.push('<span class="audit-tag danger">Quote dump</span>');
      }
      if (profile.supportedMeaningHits.length > 0) {
        tags.push('<span class="audit-tag good">Specific effect</span>');
      }

      const details = [];
      if (profile.supportedMeaningHits.length > 0) details.push("Supported meaning: " + profile.supportedMeaningHits.map(function (item) { return item.term; }).join(", "));
      if (profile.genericEffectHits.length > 0) details.push("Generic phrases: " + profile.genericEffectHits.join(", "));
      if (profile.methodAssessment.misapplied.length > 0) details.push("Method issues: " + profile.methodAssessment.misapplied.join(", "));
      if (profile.unsupportedHits.length > 0) details.push("Unsupported: " + profile.unsupportedHits.join(", "));

      return (
        '<article class="sentence-item">' +
          '<p>' + escapeHtml(profile.text) + '</p>' +
          '<div class="sentence-tags">' + tags.join("") + '</div>' +
          (details.length ? '<p class="sentence-meta">' + escapeHtml(details.join(" · ")) + '</p>' : '') +
        '</article>'
      );
    }).join("");
  }

  function buildFeedbackText(result) {
    const grade = result.grade;
    const features = result.features;
    const strengths = result.strengths;
    const targets = result.targets;
    const watchouts = result.watchouts.map(function (item) { return item.text; });

    return [
      "Mark: " + grade.mark + " / " + CONFIG.maxMark,
      "Likely range: " + grade.range.low + "–" + grade.range.high,
      grade.level + ": " + grade.summary,
      "Confidence: " + grade.confidence.label,
      "",
      "Domain scores:",
      "- Coverage: " + grade.domainScores.coverage + "/4",
      "- Evidence: " + grade.domainScores.evidence + "/4",
      "- Analysis: " + grade.domainScores.analysis + "/5",
      "- Methods: " + grade.domainScores.methods + "/3",
      "- Focus: " + grade.domainScores.control + "/4",
      "",
      "Key diagnostics:",
      "- Grounded analytical sentences: " + features.groundedSentenceCount,
      "- Developed analytical sentences: " + features.developedSentenceCount,
      "- Generic sentences: " + features.genericSentenceCount,
      "- Unsupported interpretations: " + features.unsupportedInterpretationCount,
      "- Misapplied methods: " + features.misappliedMethodCount,
      "",
      "Strengths:",
      strengths.map(function (item) { return "- " + item; }).join("\n"),
      "",
      "Targets:",
      targets.map(function (item) { return "- " + item; }).join("\n"),
      "",
      "Watch-outs:",
      (watchouts.length ? watchouts : ["None"]).map(function (item) { return item.startsWith("- ") ? item : "- " + item; }).join("\n")
    ].join("\n");
  }

  function getDomainDescriptor(domain, score) {
    const descriptors = CONFIG.domainDescriptors[domain] || [];
    const index = clamp(score, 0, descriptors.length - 1);
    return descriptors[index] || "";
  }

  function renderDomainCard(idPrefix, score, domain) {
    const scoreEl = $(idPrefix + "Score");
    const copyEl = $(idPrefix + "Copy");
    if (!scoreEl || !copyEl) return;
    scoreEl.textContent = String(score);
    copyEl.textContent = getDomainDescriptor(domain, score);
  }

  function renderCalibrationTable() {
    const btn = $("runCalibrationBtn");
    const status = $("calibrationSummary");
    const table = $("calibrationTableBody");
    if (!btn || !status || !table) return;

    btn.addEventListener("click", function () {
      const rows = runCalibration();
      const exactMatches = rows.filter(function (row) { return row.delta === 0; }).length;
      const averageError = average(rows.map(function (row) { return Math.abs(row.delta); }));

      status.textContent =
        "Exact matches: " + exactMatches + " / " + rows.length +
        " · average absolute error: " + averageError.toFixed(2) +
        " marks.";

      table.innerHTML = rows.map(function (row) {
        const cls = row.delta === 0 ? "pass" : Math.abs(row.delta) === 1 ? "near" : "fail";
        return (
          "<tr class='" + cls + "'>" +
            "<td>" + escapeHtml(row.name) + "</td>" +
            "<td>" + escapeHtml(String(row.expectedMark)) + "</td>" +
            "<td>" + escapeHtml(String(row.actualMark)) + "</td>" +
            "<td>" + escapeHtml(String(row.delta)) + "</td>" +
            "<td>" + escapeHtml(row.level) + "</td>" +
            "<td>" + escapeHtml(row.confidence) + "</td>" +
          "</tr>"
        );
      }).join("");
    });
  }

  function renderResults(result) {
    const features = result.features;
    const grade = result.grade;

    $("resultsCard").hidden = false;
    $("markHeading").textContent = grade.mark + " / " + CONFIG.maxMark;
    $("rangeText").textContent = "Likely range: " + grade.range.low + "–" + grade.range.high;
    $("levelPill").textContent = grade.level;
    $("bandSummary").textContent = grade.summary;
    $("scoreBarFill").style.width = ((grade.mark / CONFIG.maxMark) * 100) + "%";

    const confidencePill = $("confidencePill");
    confidencePill.textContent = grade.confidence.label + " confidence";
    confidencePill.className = "confidence-pill confidence-" + grade.confidence.label.toLowerCase();

    renderDomainCard("coverage", grade.domainScores.coverage, "coverage");
    renderDomainCard("evidence", grade.domainScores.evidence, "evidence");
    renderDomainCard("analysis", grade.domainScores.analysis, "analysis");
    renderDomainCard("methods", grade.domainScores.methods, "methods");
    renderDomainCard("control", grade.domainScores.control, "control");

    renderList($("strengthList"), result.strengths, "No strengths generated yet.");
    renderList($("targetList"), result.targets, "No targets generated.");

    renderChipList($("matchedContent"), features.matchedContent, "No analytical coverage detected yet.", "dim");
    renderChipList($("referenceList"), uniqueArray(features.preciseQuotes.concat(features.highValueHits)), "No usable evidence counted yet.", "dim");
    renderChipList($("analysisLanguage"), uniqueArray(features.supportedMeaningHits.concat(features.specificEffectHits).concat(features.strongVerbHits)), "No specific effect language detected yet.", "dim");
    renderChipList($("methodLanguage"), uniqueArray(features.methodMentions.concat(features.misappliedMethods.map(function (item) { return item + " (issue)"; }))), "No explicit method credit detected.", "dim");
    renderChipList($("watchouts"), result.watchouts, "No major watch-outs detected.", "good");

    $("spagSummary").textContent =
      "Estimated clarity issues: " + features.spag.errorCount + ". Band: " + features.spag.band + ".";
    renderList($("spagList"), features.spag.issues.slice(0, 5), "No obvious SPaG issues detected by the rule-based checker.");

    $("accuracySummary").innerHTML = [
      createChip("Grounded sentences: " + features.groundedSentenceCount, "good"),
      createChip("Developed: " + features.developedSentenceCount, features.developedSentenceCount ? "good" : "dim"),
      createChip("Generic: " + features.genericSentenceCount, features.genericSentenceCount ? "warn" : "good"),
      createChip("Unsupported: " + features.unsupportedInterpretationCount, features.unsupportedInterpretationCount ? "danger" : "good"),
      createChip("Misapplied methods: " + features.misappliedMethodCount, features.misappliedMethodCount ? "danger" : "good"),
      createChip("Uncertainty: " + features.hardUncertaintySentenceCount, features.hardUncertaintySentenceCount ? "warn" : "good")
    ].join("");

    $("confidenceReasons").innerHTML = grade.confidence.reasons.map(function (reason) {
      return "<li>" + escapeHtml(reason) + "</li>";
    }).join("");

    renderSentenceAudit(features.sentenceProfiles);

    $("copyFeedbackBtn").dataset.feedback = buildFeedbackText(result);
    $("resultsCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateWordCounter() {
    const box = $("answerBox");
    const counter = $("wordCount");
    if (!box || !counter) return;
    counter.textContent = String(countWords(box.value));
  }

  function initialisePage() {
    if (!CONFIG) {
      document.body.innerHTML = "<p style='padding:24px;font-family:Arial,sans-serif;'>config.js could not be loaded.</p>";
      return;
    }

    $("examInfo").textContent = CONFIG.examLabel;
    $("marksBadge").textContent = CONFIG.maxMark + " marks";
    $("questionText").textContent = CONFIG.questionPrompt;
    $("extractText").textContent = CONFIG.sourceExtract;
    $("engineTag").textContent = getNlp() ? "Compromise NLP active" : "Heuristic fallback active";
    renderRubric();
    renderCalibrationTable();

    const saved = root.localStorage ? localStorage.getItem(STORAGE_KEY) : "";
    if (saved) $("answerBox").value = saved;
    updateWordCounter();

    $("answerBox").addEventListener("input", function () {
      if (root.localStorage) localStorage.setItem(STORAGE_KEY, $("answerBox").value);
      updateWordCounter();
    });

    $("markBtn").addEventListener("click", function () {
      const answer = $("answerBox").value.trim();
      if (!answer) {
        root.alert("Please type an answer first.");
        return;
      }
      const result = analyseAnswer(answer);
      renderResults(result);
    });

    $("clearBtn").addEventListener("click", function () {
      const confirmed = root.confirm("Clear the saved answer from this browser?");
      if (!confirmed) return;
      $("answerBox").value = "";
      if (root.localStorage) localStorage.removeItem(STORAGE_KEY);
      updateWordCounter();
      $("resultsCard").hidden = true;
    });

    $("copyFeedbackBtn").addEventListener("click", async function () {
      const feedback = $("copyFeedbackBtn").dataset.feedback;
      if (!feedback) {
        root.alert("Mark an answer first, then copy the feedback.");
        return;
      }
      try {
        await navigator.clipboard.writeText(feedback);
        $("copyFeedbackBtn").textContent = "Feedback copied";
        root.setTimeout(function () {
          $("copyFeedbackBtn").textContent = "Copy feedback";
        }, 1400);
      } catch (error) {
        root.alert("Could not copy automatically. Please try again.");
      }
    });
  }

  root.GCSEMarker = {
    analyseAnswer: analyseAnswer,
    runCalibration: runCalibration,
    normaliseText: normaliseText,
    tokenize: tokenize,
    splitSentences: splitSentences
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.GCSEMarker;
  }

  if (hasDocument()) {
    document.addEventListener("DOMContentLoaded", initialisePage);
  }
})(typeof window !== "undefined" ? window : globalThis);
