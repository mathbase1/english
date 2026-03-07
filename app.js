(function (root) {
  "use strict";

  const CONFIG = root.QUIZ_CONFIG || null;
  const STORAGE_KEY = "gcse_english_github_pages_answer_v3";

  function hasDocument() {
    return typeof document !== "undefined";
  }

  function $(id) {
    return hasDocument() ? document.getElementById(id) : null;
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

  function uniqueArray(values) {
    return Array.from(new Set(values));
  }

  function containsPhrase(text, phrase) {
    const haystack = normaliseText(text);
    const needle = normaliseText(phrase);
    return Boolean(needle) && haystack.indexOf(needle) !== -1;
  }

  function buildNgrams(tokens, size) {
    const grams = [];
    if (tokens.length < size) return grams;
    for (let i = 0; i <= tokens.length - size; i += 1) {
      grams.push(tokens.slice(i, i + size).join(" "));
    }
    return grams;
  }

  function makeStemSet(tokens) {
    return new Set(tokens.map(simpleStem));
  }

  function termScore(answerText, answerStemSet, term) {
    const termNormal = normaliseText(term);
    if (!termNormal) return 0;

    if (containsPhrase(answerText, term)) {
      return 1;
    }

    const termTokens = tokenize(termNormal).map(simpleStem);
    if (!termTokens.length) return 0;

    let overlap = 0;
    for (let i = 0; i < termTokens.length; i += 1) {
      if (answerStemSet.has(termTokens[i])) overlap += 1;
    }

    const ratio = overlap / termTokens.length;
    if (termTokens.length === 1) return ratio >= 1 ? 0.95 : 0;
    if (ratio === 1) return 0.92;
    if (ratio >= 0.67) return 0.7;
    if (ratio >= 0.5) return 0.55;
    return 0;
  }

  function findMatchesFromList(text, list) {
    const matches = [];
    for (let i = 0; i < list.length; i += 1) {
      if (containsPhrase(text, list[i])) {
        matches.push(list[i]);
      }
    }
    return uniqueArray(matches);
  }

  function findSingleWordMatches(answerTokens, list) {
    const tokenSet = new Set(answerTokens.map(function (token) {
      return token.toLowerCase();
    }));
    const stemSet = makeStemSet(answerTokens);
    const matches = [];

    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      const itemNormal = normaliseText(item);
      if (!itemNormal) continue;

      if (itemNormal.indexOf(" ") !== -1) {
        const termTokens = tokenize(itemNormal);
        const matchedAll = termTokens.every(function (token) {
          const stem = simpleStem(token);
          return tokenSet.has(token) || stemSet.has(stem);
        });
        if (matchedAll) matches.push(item);
      } else {
        const stem = simpleStem(itemNormal);
        if (tokenSet.has(itemNormal) || stemSet.has(stem)) {
          matches.push(item);
        }
      }
    }

    return uniqueArray(matches);
  }

  function findIndicativeContent(answerText, answerTokens) {
    const answerStemSet = makeStemSet(answerTokens);
    const matches = [];

    for (let i = 0; i < CONFIG.indicativeContentGroups.length; i += 1) {
      const group = CONFIG.indicativeContentGroups[i];
      let bestScore = 0;
      let bestTerm = "";

      for (let j = 0; j < group.terms.length; j += 1) {
        const term = group.terms[j];
        const score = termScore(answerText, answerStemSet, term);
        if (score > bestScore) {
          bestScore = score;
          bestTerm = term;
        }
      }

      if (bestScore >= 0.55) {
        matches.push({
          label: group.label,
          matchedBy: bestTerm,
          confidence: bestScore
        });
      }
    }

    return matches.sort(function (a, b) {
      return b.confidence - a.confidence;
    });
  }

  const EXTRACT_TOKENS = CONFIG ? tokenize(CONFIG.sourceExtract) : [];
  const EXTRACT_STEM_SET = makeStemSet(EXTRACT_TOKENS);
  const EXTRACT_4GRAM_SET = new Set(buildNgrams(EXTRACT_TOKENS, 4));

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

  function classifyQuotedSegments(answerText) {
    const segments = detectQuotedSegments(answerText);
    const extractQuotes = [];
    const shortExtractQuotes = [];
    const longExtractQuotes = [];
    const nonExtractQuotes = [];
    let quotedExtractWordCount = 0;

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (isLikelyExtractQuote(segment.text)) {
        extractQuotes.push(segment);
        quotedExtractWordCount += segment.wordCount;
        if (segment.wordCount <= 8) shortExtractQuotes.push(segment);
        if (segment.wordCount >= 9) longExtractQuotes.push(segment);
      } else {
        nonExtractQuotes.push(segment);
      }
    }

    return {
      allQuotes: segments,
      extractQuotes: extractQuotes,
      shortExtractQuotes: shortExtractQuotes,
      longExtractQuotes: longExtractQuotes,
      nonExtractQuotes: nonExtractQuotes,
      quotedExtractWordCount: quotedExtractWordCount
    };
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
      if (!/[.!?'"”’)]$/.test(sentence)) {
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

  function extractSalientOverlap(answerTokens) {
    const stemSet = makeStemSet(answerTokens);
    const matched = [];
    for (let i = 0; i < CONFIG.salientExtractTerms.length; i += 1) {
      const term = CONFIG.salientExtractTerms[i];
      if (stemSet.has(simpleStem(term))) matched.push(term);
    }
    return uniqueArray(matched);
  }

  function hasInterpretivePattern(sentenceText) {
    const text = normaliseText(sentenceText);
    const patterns = [
      /almost like/,
      /as if/,
      /for a moment/,
      /too [a-z]+ to/,
      /not just .* but/,
      /rather than/,
      /more than just/,
      /lost in the crowd/,
      /in her imagination/,
      /highlights how/,
      /makes .* seem/,
      /turns .* into/,
      /resolve into/,
      /become[s]? .* seem/
    ];
    return patterns.some(function (pattern) {
      return pattern.test(text);
    });
  }

  function hasSpecificMeaningPhrase(sentenceText) {
    const text = normaliseText(sentenceText);
    const patterns = [
      /too tired to focus/,
      /escaping the bus/,
      /lost in the crowd/,
      /drained and disconnected/,
      /beauty outside .* unpleasant inside/,
      /outside world .* magical/,
      /overwhelmed by/,
      /blank and lifeless/,
      /dehumanis/,
      /robotic/
    ];
    return patterns.some(function (pattern) {
      return pattern.test(text);
    });
  }

  function analyseSentenceAudit(answerText) {
    const sentences = splitSentences(answerText);
    const audit = [];

    for (let i = 0; i < sentences.length; i += 1) {
      const sentence = sentences[i];
      const tokens = tokenize(sentence);
      const quotedInfo = classifyQuotedSegments(sentence);
      const highValueHits = findMatchesFromList(sentence, CONFIG.highValueReferences);
      const indicativeMatches = findIndicativeContent(sentence, tokens);
      const salientHits = extractSalientOverlap(tokens);
      const strongVerbs = findSingleWordMatches(tokens, CONFIG.strongAnalysisVerbs);
      const weakVerbs = findSingleWordMatches(tokens, CONFIG.weakAnalysisVerbs);
      const analyticalFrames = findMatchesFromList(sentence, CONFIG.analyticalFrames);
      const interpretiveFrames = findMatchesFromList(sentence, CONFIG.interpretiveFrames);
      const explicitMethods = findSingleWordMatches(tokens, CONFIG.explicitMethodTerms);
      const sentenceTerms = findSingleWordMatches(tokens, CONFIG.sentenceTerms);
      const implicitMethodCues = findMatchesFromList(sentence, CONFIG.implicitMethodCues);
      const specificEffects = findSingleWordMatches(tokens, CONFIG.specificEffectTerms);
      const genericEffects = uniqueArray(
        findSingleWordMatches(tokens, CONFIG.genericEffectTerms).concat(
          findMatchesFromList(sentence, CONFIG.readerEffectTerms)
        )
      );
      const comparisons = findMatchesFromList(sentence, CONFIG.comparisonTerms);
      const bannedGenericFrames = findMatchesFromList(sentence, CONFIG.bannedGenericFrames);
      const circularFrames = findMatchesFromList(sentence, CONFIG.circularReasoningFrames);
      const genericRetellFrames = findMatchesFromList(sentence, CONFIG.genericRetellFrames);

      const evidenceHits = uniqueArray(
        highValueHits
          .concat(indicativeMatches.map(function (item) { return item.matchedBy; }))
          .concat(quotedInfo.extractQuotes.map(function (item) { return item.text; }))
      );

      const hasEvidence =
        quotedInfo.extractQuotes.length > 0 ||
        highValueHits.length > 0 ||
        indicativeMatches.length > 0 ||
        salientHits.length >= 2;
      const hasStrongAnalysisVerb = strongVerbs.length + analyticalFrames.length > 0;
      const hasWeakAnalysisVerb = weakVerbs.length > 0;
      const hasInterpretation =
        interpretiveFrames.length > 0 || hasInterpretivePattern(sentence) || hasSpecificMeaningPhrase(sentence);
      const hasSpecificEffect = specificEffects.length > 0;
      const hasComparison = comparisons.length > 0;
      const explicitMethod = explicitMethods.length + sentenceTerms.length > 0;
      const implicitMethod =
        implicitMethodCues.length > 0 ||
        (hasEvidence && hasSpecificEffect && (highValueHits.length > 0 || quotedInfo.extractQuotes.length > 0));
      const linkedMethod = (explicitMethod || implicitMethod) && (hasSpecificEffect || hasInterpretation || hasComparison);
      const genericOnlyEffect = genericEffects.length > 0 && !hasSpecificEffect && !hasInterpretation;
      const genericHeavy = bannedGenericFrames.length + circularFrames.length + genericRetellFrames.length > 0;
      const quoteDump = hasEvidence && !hasStrongAnalysisVerb && !hasInterpretation && !hasSpecificEffect && !hasComparison && !explicitMethod;
      const featureSpotting = hasEvidence && explicitMethod && !hasInterpretation && !hasSpecificEffect && !hasComparison;
      const strongButImplicit = hasEvidence && (
        (hasInterpretation && (hasSpecificEffect || hasStrongAnalysisVerb || hasComparison || linkedMethod)) ||
        (hasStrongAnalysisVerb && hasSpecificEffect) ||
        (hasComparison && hasSpecificEffect)
      );
      const weakButValid = hasEvidence && !quoteDump && (
        hasInterpretation ||
        hasStrongAnalysisVerb ||
        hasComparison ||
        (hasSpecificEffect && (hasWeakAnalysisVerb || linkedMethod))
      );
      const weakVerbOnly = hasEvidence && hasWeakAnalysisVerb && !hasSpecificEffect && !hasInterpretation && !hasStrongAnalysisVerb;

      let type = "neutral";
      let label = "Neutral";

      if (genericHeavy && !hasSpecificEffect && !hasInterpretation && !hasStrongAnalysisVerb) {
        type = "generic";
        label = "Generic / circular";
      } else if (featureSpotting || (weakVerbOnly && explicitMethod)) {
        type = "feature-spotting";
        label = "Feature spotting";
      } else if (quoteDump) {
        type = "reference-only";
        label = "Reference / retelling risk";
      } else if (
        strongButImplicit &&
        tokens.length >= 10 &&
        !(genericOnlyEffect && !hasInterpretation) &&
        bannedGenericFrames.length === 0
      ) {
        type = "developed-analysis";
        label = "Developed analysis";
      } else if (weakButValid && !(genericOnlyEffect && !hasInterpretation) && bannedGenericFrames.length === 0) {
        type = "analysis";
        label = "Analysis";
      } else if (explicitMethod && !hasEvidence) {
        type = "method-no-evidence";
        label = "Method with no evidence";
      } else if (genericHeavy || genericOnlyEffect || weakVerbOnly) {
        type = "generic";
        label = "Generic / circular";
      }

      const supportiveEvidence =
        (type === "analysis" || type === "developed-analysis") &&
        (quotedInfo.shortExtractQuotes.length > 0 || highValueHits.length > 0 || indicativeMatches.length > 0);
      const basicRelevantComment =
        (type === "generic") && hasEvidence && (hasWeakAnalysisVerb || genericEffects.length > 0 || explicitMethod || implicitMethod);

      audit.push({
        text: sentence,
        tokens: tokens,
        type: type,
        label: label,
        hasEvidence: hasEvidence,
        hasInterpretation: hasInterpretation,
        hasSpecificEffect: hasSpecificEffect,
        hasComparison: hasComparison,
        explicitMethod: explicitMethod,
        implicitMethod: implicitMethod,
        linkedMethod: linkedMethod,
        supportiveEvidence: supportiveEvidence,
        basicRelevantComment: basicRelevantComment,
        featureSpotting: type === "feature-spotting",
        retellRisk: type === "reference-only",
        genericHeavy: type === "generic",
        strongVerbs: strongVerbs,
        weakVerbs: weakVerbs,
        analyticalFrames: analyticalFrames,
        interpretiveFrames: interpretiveFrames,
        methods: uniqueArray(explicitMethods.concat(sentenceTerms).concat(implicitMethodCues)),
        specificEffects: specificEffects,
        genericEffects: genericEffects,
        comparisons: comparisons,
        genericTerms: uniqueArray(bannedGenericFrames.concat(circularFrames).concat(genericRetellFrames)),
        evidenceHits: evidenceHits,
        indicativeLabels: indicativeMatches.map(function (item) { return item.label; }),
        quotedSegments: quotedInfo.extractQuotes,
        quotedShortCount: quotedInfo.shortExtractQuotes.length,
        quotedLongCount: quotedInfo.longExtractQuotes.length
      });
    }

    return audit;
  }

  function analyseCopying(answerTokens, quoteInfo, sentenceAudit) {
    const answer4grams = buildNgrams(answerTokens, 4);
    let overlapCount = 0;
    for (let i = 0; i < answer4grams.length; i += 1) {
      if (EXTRACT_4GRAM_SET.has(answer4grams[i])) overlapCount += 1;
    }

    const overlap4GramRatio = answer4grams.length ? overlapCount / answer4grams.length : 0;
    const quoteShare = answerTokens.length ? quoteInfo.quotedExtractWordCount / answerTokens.length : 0;
    const longCopiedQuoteCount = quoteInfo.longExtractQuotes.length;
    const referenceOnlyCount = sentenceAudit.filter(function (item) {
      return item.type === "reference-only";
    }).length;

    const heavyCopying =
      (answer4grams.length >= 3 && overlap4GramRatio >= 0.24) ||
      quoteShare >= 0.38 ||
      longCopiedQuoteCount >= 2;

    const moderateCopying =
      !heavyCopying &&
      ((answer4grams.length >= 3 && overlap4GramRatio >= 0.14) ||
      quoteShare >= 0.24 ||
      longCopiedQuoteCount >= 1);

    return {
      overlap4GramRatio: Number(overlap4GramRatio.toFixed(2)),
      quoteShare: Number(quoteShare.toFixed(2)),
      longCopiedQuoteCount: longCopiedQuoteCount,
      heavyCopying: heavyCopying,
      moderateCopying: moderateCopying,
      referenceOnlyCount: referenceOnlyCount
    };
  }

  function getDomainDescriptor(domain, score) {
    const descriptors = CONFIG.domainDescriptors[domain] || [];
    const index = clamp(score, 0, descriptors.length - 1);
    return descriptors[index] || "";
  }

  function scoreCoverage(features) {
    const groups = features.analyticalGroupCount;
    if (groups >= 5) return 4;
    if (groups >= 3) return 3;
    if (groups >= 2) return 2;
    if (groups >= 1) return 1;
    return 0;
  }

  function scoreEvidence(features) {
    const supportiveRefs = features.supportiveReferenceCount;
    const supportiveSentences = features.supportiveEvidenceSentenceCount;
    let score = 0;
    if (supportiveRefs >= 1 && supportiveSentences >= 1) score = 1;
    if (score === 0 && features.basicRelevantEvidenceCount >= 2) score = 1;
    if (supportiveRefs >= 2 && supportiveSentences >= 2) score = 2;
    if (supportiveRefs >= 3 && supportiveSentences >= 3) score = 3;
    if (supportiveRefs >= 5 && supportiveSentences >= 4 && !features.copying.moderateCopying) score = 4;

    if (features.referenceOnlyRatio > 0.4) score = Math.min(score, 1);
    if (features.copying.heavyCopying) score = Math.min(score, 1);
    return clamp(score, 0, 4);
  }

  function scoreAnalysis(features) {
    let score = 0;
    if (features.analyticalSentenceCount >= 1) score = 1;
    if (score === 0 && features.basicRelevantCommentCount >= 2 && features.basicRelevantEvidenceCount >= 2) score = 1;
    if (features.analyticalSentenceCount >= 2 && (features.specificEffectSentenceCount >= 1 || features.interpretiveSentenceCount >= 1)) {
      score = 2;
    }
    if (
      features.analyticalSentenceCount >= 3 &&
      features.developedAnalyticalSentenceCount >= 1 &&
      features.specificEffectSentenceCount >= 2
    ) {
      score = 3;
    }
    if (
      features.developedAnalyticalSentenceCount >= 2 &&
      features.interpretiveSentenceCount >= 2 &&
      features.specificEffectSentenceCount >= 3 &&
      features.genericSentenceRatio < 0.35
    ) {
      score = 4;
    }
    if (
      features.developedAnalyticalSentenceCount >= 3 &&
      features.interpretiveSentenceCount >= 2 &&
      features.specificEffectSentenceCount >= 4 &&
      features.analyticalGroupCount >= 4 &&
      features.genericSentenceRatio < 0.2
    ) {
      score = 5;
    }

    if (features.featureSpottingCount > features.developedAnalyticalSentenceCount + 1 && score > 0) score -= 1;
    if (features.genericSentenceRatio >= 0.3 && score > 2) score -= 1;
    if (features.referenceOnlyRatio >= 0.4 && score > 1) score -= 1;
    if (features.keywordStuffing && score > 2) score -= 1;
    return clamp(score, 0, 5);
  }

  function scoreMethods(features) {
    let score = 0;
    if (features.linkedMethodSentenceCount >= 1) score = 1;
    if (features.linkedMethodSentenceCount >= 2 || features.explicitLinkedMethodSentenceCount >= 1) score = 2;
    if (features.linkedMethodSentenceCount >= 3 && (features.explicitLinkedMethodSentenceCount >= 1 || features.sentenceFormLinkedCount >= 1)) {
      score = 3;
    }
    if (features.featureSpottingCount > features.linkedMethodSentenceCount + 1 && score > 1) score -= 1;
    return clamp(score, 0, 3);
  }

  function scoreControl(features) {
    let score = 0;
    if (features.wordCount >= 18 && features.analyticalSentenceCount >= 1) score = 1;
    if (features.wordCount >= 45 && features.analyticalSentenceCount >= 2) score = 2;
    if (
      features.wordCount >= 70 &&
      features.analyticalSentenceCount >= 3 &&
      features.genericSentenceRatio < 0.35 &&
      features.referenceOnlyRatio < 0.5
    ) {
      score = 3;
    }
    if (
      features.wordCount >= 85 &&
      features.developedAnalyticalSentenceCount >= 2 &&
      features.genericSentenceRatio < 0.2 &&
      features.referenceOnlyRatio < 0.25 &&
      !features.keywordStuffing
    ) {
      score = 4;
    }

    if (features.genericSentenceRatio > 0.3) score = Math.min(score, 1);
    if (features.referenceOnlyRatio > 0.4) score = Math.min(score, 1);
    if (features.copying.heavyCopying) score = Math.min(score, 1);
    if (features.spag.unreadable) score = Math.min(score, 1);
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

  function computeConfidence(mark, domainScores, features) {
    let label = "High";
    const reasons = [];

    if (features.copying.heavyCopying || features.keywordStuffing) {
      label = "Low";
      reasons.push("The answer shows strong copying or buzzword-stuffing patterns.");
    } else if (
      features.copying.moderateCopying ||
      features.genericSentenceRatio >= 0.25 ||
      features.referenceOnlyRatio >= 0.25
    ) {
      label = "Medium";
      reasons.push("The answer mixes stronger material with retelling or generic comments.");
    }

    if (features.wordCount < 35) {
      label = label === "High" ? "Medium" : label;
      reasons.push("The answer is quite short, so the estimate is less secure.");
    }

    if (features.analysisScoreRaw >= 4 && features.linkedMethodSentenceCount === 0) {
      label = label === "High" ? "Medium" : label;
      reasons.push("There is strong effect analysis, but very little explicit language-method linking.");
    }

    if (mark === 7 || mark === 6 || mark === 4 || mark === 2) {
      label = label === "High" ? "Medium" : label;
      reasons.push("This sits close to a boundary mark.");
    }

    if (features.genericSentenceRatio >= 0.35 || features.referenceOnlyRatio >= 0.4) {
      label = "Low";
      reasons.push("Too much of the answer is generic or reference-only, so the estimate is unstable.");
    }

    if (features.spag.unreadable) {
      label = "Low";
      reasons.push("Some sentences are hard to follow, which makes the estimate less secure.");
    }

    return { label: label, reasons: uniqueArray(reasons) };
  }

  function computeRange(mark, confidence) {
    if (mark === 0) return { low: 0, high: 0 };
    if (confidence.label === "High") return { low: mark, high: mark };
    return { low: clamp(mark - 1, 0, CONFIG.maxMark), high: clamp(mark + 1, 0, CONFIG.maxMark) };
  }

  function determineMark(features) {
    if (features.wordCount < 8 || features.relevanceSignals < 2) {
      return {
        level: "Level 0",
        mark: 0,
        summary: levelDescriptor("Level 0"),
        domainScores: { coverage: 0, evidence: 0, analysis: 0, methods: 0, control: 0, total: 0 },
        confidence: { label: "Low", reasons: ["There is too little relevant material to judge securely."] },
        range: { low: 0, high: 0 }
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
    features.analysisScoreRaw = domainScores.analysis;

    let level = "Level 1";

    const level4Gate =
      domainScores.analysis >= 4 &&
      domainScores.evidence >= 3 &&
      domainScores.coverage >= 3 &&
      domainScores.control >= 2 &&
      features.developedAnalyticalSentenceCount >= 3 &&
      features.interpretiveSentenceCount >= 2 &&
      features.specificEffectSentenceCount >= 3 &&
      features.genericSentenceRatio < 0.25 &&
      !features.copying.heavyCopying &&
      !features.keywordStuffing;

    const level3Gate =
      domainScores.analysis >= 3 &&
      domainScores.evidence >= 2 &&
      domainScores.coverage >= 2 &&
      domainScores.control >= 1 &&
      features.analyticalSentenceCount >= 2 &&
      (features.interpretiveSentenceCount >= 1 || features.linkedMethodSentenceCount >= 1 || features.specificEffectSentenceCount >= 2) &&
      !features.copying.heavyCopying;

    const level2Gate =
      (domainScores.analysis >= 1 || features.basicRelevantCommentCount >= 2) &&
      (features.analyticalSentenceCount >= 1 || features.basicRelevantCommentCount >= 2) &&
      domainScores.evidence >= 1;

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
        features.developedAnalyticalSentenceCount >= 4 &&
        features.interpretiveSentenceCount >= 3 &&
        features.explicitLinkedMethodSentenceCount >= 1 &&
        features.genericSentenceCount === 0 &&
        !features.copying.moderateCopying
      ) {
        mark = 8;
      }
    } else if (level === "Level 3") {
      mark = 5;
      if (
        domainScores.evidence >= 3 &&
        features.developedAnalyticalSentenceCount >= 2 &&
        (features.interpretiveSentenceCount >= 1 || features.linkedMethodSentenceCount >= 1)
      ) {
        mark = 6;
      }
    } else if (level === "Level 2") {
      mark = 3;
      if (
        domainScores.analysis >= 2 &&
        domainScores.evidence >= 2 &&
        features.analyticalSentenceCount >= 2 &&
        features.genericSentenceRatio < 0.35
      ) {
        mark = 4;
      }
    } else {
      mark = features.relevanceSignals >= 3 && features.wordCount >= 18 ? 2 : 1;
    }

    if ((features.referenceOnlyRatio > 0.4 && features.analyticalSentenceCount <= 1) ||
        (features.referenceOnlyRatio >= 0.35 && features.genericSentenceRatio >= 0.4)) {
      mark = Math.min(mark, 2);
    } else if (features.referenceOnlyRatio > 0.25) {
      mark = Math.min(mark, 4);
    }

    if (features.genericSentenceRatio > 0.35 && features.interpretiveSentenceCount === 0) {
      mark = Math.min(mark, 3);
    } else if (features.genericSentenceRatio > 0.25) {
      mark = Math.min(mark, 4);
    }

    if (features.keywordStuffing) {
      mark = Math.min(mark, 4);
    }

    if (features.copying.heavyCopying && features.developedAnalyticalSentenceCount === 0) {
      mark = Math.min(mark, 2);
    } else if (features.copying.moderateCopying) {
      mark = Math.min(mark, 4);
    }

    if (domainScores.control === 0 && domainScores.analysis === 0) {
      mark = Math.min(mark, 2);
    }

    level = levelFromMark(mark);
    const confidence = computeConfidence(mark, domainScores, features);
    const range = computeRange(mark, confidence);

    return {
      level: level,
      mark: mark,
      summary: levelDescriptor(level),
      domainScores: domainScores,
      confidence: confidence,
      range: range
    };
  }

  function buildWatchouts(features) {
    const watchouts = [];
    if (features.copying.heavyCopying) {
      watchouts.push({ text: "Heavy copying / long extract chunks detected", tone: "danger" });
    } else if (features.copying.moderateCopying) {
      watchouts.push({ text: "Some long or closely copied extract wording detected", tone: "warn" });
    }
    if (features.referenceOnlyRatio > 0.25) {
      watchouts.push({ text: "Too many sentences are quote-dumps or retelling", tone: "danger" });
    }
    if (features.keywordStuffing) {
      watchouts.push({ text: "Method words or generic verbs appear without enough interpretation", tone: "danger" });
    }
    if (features.featureSpottingCount >= 2) {
      watchouts.push({ text: "Feature-spotting is outweighing real explanation", tone: "warn" });
    }
    if (features.genericSentenceCount >= 2) {
      watchouts.push({ text: "Generic filler phrases are reducing precision", tone: "warn" });
    }
    if (features.interpretiveSentenceCount === 0) {
      watchouts.push({ text: "There is very little interpretation of meaning", tone: "warn" });
    }
    if (features.wordCount < 35) {
      watchouts.push({ text: "Short answer: harder to place securely in a band", tone: "warn" });
    }
    if (features.spag.unreadable) {
      watchouts.push({ text: "Some sentences are hard to follow", tone: "danger" });
    }
    return watchouts;
  }

  function buildStrengths(features, grade) {
    const strengths = [];
    if (grade.domainScores.coverage >= 3) {
      strengths.push("You move across several meaningful parts of the extract, not just one quoted detail.");
    }
    if (grade.domainScores.evidence >= 3) {
      strengths.push("Your quotations are usually short and used to support actual analysis, not just dropped in.");
    }
    if (grade.domainScores.analysis >= 4) {
      strengths.push("Several sentences explain a specific effect or interpretation, which is what pushes answers toward the top band.");
    } else if (grade.domainScores.analysis >= 3) {
      strengths.push("You often explain what the language suggests, rather than only naming techniques.");
    }
    if (features.interpretiveSentenceCount >= 2) {
      strengths.push("You include interpretation, not just surface description.");
    }
    if (features.linkedMethodSentenceCount >= 1) {
      strengths.push("At least one sentence links a language choice to a clear effect or meaning.");
    }
    if (!strengths.length) {
      strengths.push("Your response is relevant enough to begin collecting marks.");
    }
    return strengths.slice(0, 6);
  }

  function buildTargets(features, grade) {
    const targets = [];
    if (grade.domainScores.coverage < 3) {
      targets.push("Cover more than one strand of the extract with analysis, not just quotation coverage.");
    }
    if (grade.domainScores.evidence < 3) {
      targets.push("Use short quotations only when you are going to explain what they mean or suggest.");
    }
    if (features.interpretiveSentenceCount === 0) {
      targets.push("Push beyond description: explain what the language suggests about Rosabel's feelings or perspective.");
    }
    if (features.featureSpottingCount >= 1) {
      targets.push("Do not stop at naming a technique. Say what that choice makes the bus, people, or outside world feel like.");
    }
    if (features.genericSentenceCount >= 1) {
      targets.push("Cut vague phrases like “creates an effect” or “helps the reader imagine” and replace them with a precise effect.");
    }
    if (features.referenceOnlyRatio > 0.25) {
      targets.push("Reduce quote-listing. One analysed quotation is worth more than several unanalysed ones.");
    }
    if (grade.domainScores.methods < 2) {
      targets.push("Where useful, link a language choice to the meaning it creates, even without naming a technique every time.");
    }
    if (!targets.length) {
      if (grade.mark < CONFIG.maxMark) {
        targets.push("To move even higher, add one more developed interpretation and make the comparison between outside beauty and inside discomfort even sharper.");
      } else {
        targets.push("This already matches the top band in this stricter rule-based marker.");
      }
    }
    return targets.slice(0, 6);
  }

  function analyseAnswer(answerText) {
    const answerTokens = tokenize(answerText);
    const sentences = splitSentences(answerText);
    const matchedContent = findIndicativeContent(answerText, answerTokens);
    const highValueReferences = findMatchesFromList(answerText, CONFIG.highValueReferences);
    const salientOverlap = extractSalientOverlap(answerTokens);
    const strongVerbsFound = findSingleWordMatches(answerTokens, CONFIG.strongAnalysisVerbs);
    const weakVerbsFound = findSingleWordMatches(answerTokens, CONFIG.weakAnalysisVerbs);
    const analyticalFramesFound = findMatchesFromList(answerText, CONFIG.analyticalFrames);
    const interpretiveFramesFound = findMatchesFromList(answerText, CONFIG.interpretiveFrames);
    const explicitMethodsFound = findSingleWordMatches(answerTokens, CONFIG.explicitMethodTerms);
    const sentenceTermsFound = findSingleWordMatches(answerTokens, CONFIG.sentenceTerms);
    const specificEffectTermsFound = findSingleWordMatches(answerTokens, CONFIG.specificEffectTerms);
    const genericPhrasesFound = uniqueArray(
      findMatchesFromList(answerText, CONFIG.bannedGenericFrames)
        .concat(findMatchesFromList(answerText, CONFIG.circularReasoningFrames))
        .concat(findMatchesFromList(answerText, CONFIG.genericRetellFrames))
    );
    const quoteInfo = classifyQuotedSegments(answerText);
    const sentenceAudit = analyseSentenceAudit(answerText);
    const spag = analyseSpag(answerText, sentences);

    const analyticalSentences = sentenceAudit.filter(function (item) {
      return item.type === "analysis" || item.type === "developed-analysis";
    });
    const developedAnalyticalSentences = sentenceAudit.filter(function (item) {
      return item.type === "developed-analysis";
    });
    const featureSpottingSentences = sentenceAudit.filter(function (item) {
      return item.type === "feature-spotting";
    });
    const genericSentences = sentenceAudit.filter(function (item) {
      return item.type === "generic";
    });
    const basicRelevantComments = sentenceAudit.filter(function (item) {
      return item.basicRelevantComment;
    });
    const referenceOnlySentences = sentenceAudit.filter(function (item) {
      return item.type === "reference-only";
    });
    const interpretiveSentences = sentenceAudit.filter(function (item) {
      return item.type === "analysis" || item.type === "developed-analysis";
    }).filter(function (item) {
      return item.hasInterpretation;
    });
    const specificEffectSentences = sentenceAudit.filter(function (item) {
      return (item.type === "analysis" || item.type === "developed-analysis") && item.hasSpecificEffect;
    });
    const linkedMethodSentences = sentenceAudit.filter(function (item) {
      return (item.type === "analysis" || item.type === "developed-analysis") && item.linkedMethod;
    });
    const explicitLinkedMethodSentences = linkedMethodSentences.filter(function (item) {
      return item.explicitMethod;
    });
    const sentenceFormLinkedCount = linkedMethodSentences.filter(function (item) {
      return item.methods.some(function (term) {
        return containsPhrase(term, "sentence") || containsPhrase(term, "semicolon") || containsPhrase(term, "ellipsis") || containsPhrase(term, "dash") || containsPhrase(term, "punctuation");
      });
    }).length;

    const analyticalGroupLabels = uniqueArray(
      analyticalSentences.flatMap(function (item) {
        return item.indicativeLabels;
      })
    );

    const supportiveReferences = uniqueArray(
      analyticalSentences.flatMap(function (item) {
        return item.evidenceHits;
      })
    );

    const copying = analyseCopying(answerTokens, quoteInfo, sentenceAudit);

    const weakBuzzwordCount = weakVerbsFound.length + explicitMethodsFound.length + sentenceTermsFound.length;
    const keywordStuffing =
      weakBuzzwordCount >= 5 &&
      developedAnalyticalSentences.length === 0 &&
      interpretiveSentences.length === 0 &&
      (genericSentences.length >= 2 || featureSpottingSentences.length >= 2);

    const features = {
      wordCount: answerTokens.length,
      sentenceCount: sentences.length,
      matchedGroupCount: matchedContent.length,
      matchedContent: matchedContent,
      analyticalGroupCount: analyticalGroupLabels.length,
      analyticalGroupLabels: analyticalGroupLabels,
      highValueReferences: highValueReferences,
      highValueReferenceCount: highValueReferences.length,
      salientOverlap: salientOverlap,
      quoteInfo: quoteInfo,
      preciseQuoteCount: quoteInfo.shortExtractQuotes.length,
      strongVerbsFound: strongVerbsFound,
      weakVerbsFound: weakVerbsFound,
      analyticalFramesFound: analyticalFramesFound,
      interpretiveFramesFound: interpretiveFramesFound,
      explicitMethodsFound: explicitMethodsFound,
      sentenceTermsFound: sentenceTermsFound,
      specificEffectTermsFound: specificEffectTermsFound,
      genericPhrasesFound: genericPhrasesFound,
      supportiveReferences: supportiveReferences,
      supportiveReferenceCount: supportiveReferences.length,
      supportiveEvidenceSentenceCount: analyticalSentences.filter(function (item) { return item.supportiveEvidence; }).length,
      basicRelevantCommentCount: basicRelevantComments.length,
      basicRelevantEvidenceCount: uniqueArray(
        basicRelevantComments.flatMap(function (item) { return item.evidenceHits; })
      ).length,
      analyticalSentenceCount: analyticalSentences.length,
      developedAnalyticalSentenceCount: developedAnalyticalSentences.length,
      interpretiveSentenceCount: interpretiveSentences.length,
      specificEffectSentenceCount: specificEffectSentences.length,
      linkedMethodSentenceCount: linkedMethodSentences.length,
      explicitLinkedMethodSentenceCount: explicitLinkedMethodSentences.length,
      sentenceFormLinkedCount: sentenceFormLinkedCount,
      featureSpottingCount: featureSpottingSentences.length,
      genericSentenceCount: genericSentences.length,
      genericSentenceRatio: sentences.length ? genericSentences.length / sentences.length : 0,
      referenceOnlyCount: referenceOnlySentences.length,
      referenceOnlyRatio: sentences.length ? referenceOnlySentences.length / sentences.length : 0,
      sentenceAudit: sentenceAudit,
      spag: spag,
      copying: copying,
      keywordStuffing: keywordStuffing
    };

    features.relevanceSignals =
      features.matchedGroupCount +
      features.preciseQuoteCount +
      features.analyticalSentenceCount +
      features.interpretiveSentenceCount +
      features.linkedMethodSentenceCount;

    const grade = determineMark(features);
    const strengths = buildStrengths(features, grade);
    const targets = buildTargets(features, grade);
    const watchouts = buildWatchouts(features);

    return {
      features: features,
      grade: grade,
      strengths: strengths,
      targets: targets,
      watchouts: watchouts
    };
  }

  function createChip(text, tone) {
    const extra = tone ? " " + tone : "";
    return '<span class="chip' + extra + '">' + escapeHtml(text) + '</span>';
  }

  function renderChipList(container, items, fallbackText, fallbackTone) {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = createChip(fallbackText, fallbackTone || "dim");
      return;
    }
    container.innerHTML = items.map(function (item) {
      if (typeof item === "string") return createChip(item, "");
      if (item.label && item.confidence) {
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

  function renderSentenceAudit(audit) {
    const container = $("sentenceAudit");
    if (!container) return;
    if (!audit.length) {
      container.innerHTML = '<div class="sentence-item"><p>No sentences detected.</p></div>';
      return;
    }

    container.innerHTML = audit.map(function (item) {
      const tags = [];
      if (item.type === "developed-analysis") {
        tags.push('<span class="audit-tag good">Developed analysis</span>');
      } else if (item.type === "analysis") {
        tags.push('<span class="audit-tag">Analysis</span>');
      } else if (item.type === "reference-only") {
        tags.push('<span class="audit-tag danger">Reference only</span>');
      } else if (item.type === "feature-spotting") {
        tags.push('<span class="audit-tag warn">Feature spotting</span>');
      } else if (item.type === "method-no-evidence") {
        tags.push('<span class="audit-tag warn">Method without evidence</span>');
      } else if (item.type === "generic") {
        tags.push('<span class="audit-tag warn">Generic / circular</span>');
      } else {
        tags.push('<span class="audit-tag dim">Neutral</span>');
      }
      if (item.hasInterpretation) tags.push('<span class="audit-tag good">Interpretation</span>');
      if (item.hasSpecificEffect) tags.push('<span class="audit-tag good">Specific effect</span>');
      if (item.linkedMethod) tags.push('<span class="audit-tag">Language link</span>');
      if (item.retellRisk) tags.push('<span class="audit-tag danger">Retelling risk</span>');
      return (
        '<article class="sentence-item">' +
          '<p>' + escapeHtml(item.text) + '</p>' +
          '<div class="sentence-tags">' + tags.join("") + '</div>' +
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
      'Mark: ' + grade.mark + ' / ' + CONFIG.maxMark,
      'Likely range: ' + grade.range.low + '–' + grade.range.high,
      grade.level + ': ' + grade.summary,
      'Confidence: ' + grade.confidence.label,
      '',
      'Domain scores:',
      '- Coverage: ' + grade.domainScores.coverage + '/4 (' + getDomainDescriptor('coverage', grade.domainScores.coverage) + ')',
      '- Evidence: ' + grade.domainScores.evidence + '/4 (' + getDomainDescriptor('evidence', grade.domainScores.evidence) + ')',
      '- Analysis: ' + grade.domainScores.analysis + '/5 (' + getDomainDescriptor('analysis', grade.domainScores.analysis) + ')',
      '- Methods: ' + grade.domainScores.methods + '/3 (' + getDomainDescriptor('methods', grade.domainScores.methods) + ')',
      '- Focus: ' + grade.domainScores.control + '/4 (' + getDomainDescriptor('control', grade.domainScores.control) + ')',
      '',
      'Strengths:',
      strengths.map(function (item) { return '- ' + item; }).join('\n'),
      '',
      'Targets:',
      targets.map(function (item) { return '- ' + item; }).join('\n'),
      '',
      'Watch-outs:',
      (watchouts.length ? watchouts : ['- None']).map(function (item) { return item.startsWith('- ') ? item : '- ' + item; }).join('\n'),
      '',
      'Interpretive sentences detected: ' + features.interpretiveSentenceCount,
      'Reference-only sentences detected: ' + features.referenceOnlyCount,
      'Generic / circular sentences detected: ' + features.genericSentenceCount
    ].join('\n');
  }

  function renderDomainCard(idPrefix, score, domain) {
    const scoreEl = $(idPrefix + 'Score');
    const copyEl = $(idPrefix + 'Copy');
    if (!scoreEl || !copyEl) return;
    scoreEl.textContent = String(score);
    copyEl.textContent = getDomainDescriptor(domain, score);
  }

  function renderResults(result) {
    const features = result.features;
    const grade = result.grade;

    $("resultsCard").hidden = false;
    $("markHeading").textContent = grade.mark + ' / ' + CONFIG.maxMark;
    $("rangeText").textContent = 'Likely range: ' + grade.range.low + '–' + grade.range.high;
    $("levelPill").textContent = grade.level;
    $("bandSummary").textContent = grade.summary;
    $("scoreBarFill").style.width = ((grade.mark / CONFIG.maxMark) * 100) + '%';

    const confidencePill = $("confidencePill");
    confidencePill.textContent = grade.confidence.label + ' confidence';
    confidencePill.className = 'confidence-pill confidence-' + grade.confidence.label.toLowerCase();

    renderDomainCard('coverage', grade.domainScores.coverage, 'coverage');
    renderDomainCard('evidence', grade.domainScores.evidence, 'evidence');
    renderDomainCard('analysis', grade.domainScores.analysis, 'analysis');
    renderDomainCard('methods', grade.domainScores.methods, 'methods');
    renderDomainCard('control', grade.domainScores.control, 'control');

    renderList($("strengthList"), result.strengths, 'None yet.');
    renderList($("targetList"), result.targets, 'No targets generated.');

    renderChipList(
      $("matchedContent"),
      features.matchedContent.map(function (item) {
        return { label: item.label, confidence: item.confidence };
      }),
      'No strong indicative content detected yet.',
      'dim'
    );

    renderChipList($("referenceList"), features.supportiveReferences, 'Add short quotations tied to analysis.', 'dim');

    const analysisItems = uniqueArray(
      features.strongVerbsFound
        .concat(features.analyticalFramesFound)
        .concat(features.interpretiveFramesFound)
        .concat(features.specificEffectTermsFound)
    );
    renderChipList($("analysisLanguage"), analysisItems, 'Add more precise effect or interpretation language.', 'dim');

    const methodItems = uniqueArray(features.explicitMethodsFound.concat(features.sentenceTermsFound));
    renderChipList($("methodLanguage"), methodItems, 'Explicit method terms are optional; meaning matters more.', 'dim');

    renderChipList($("watchouts"), result.watchouts, 'No major watch-outs detected.', 'good');

    $("spagSummary").textContent =
      'Estimated clarity issues: ' + features.spag.errorCount + '. Band: ' + features.spag.band + '.';
    renderList($("spagList"), features.spag.issues.slice(0, 5), 'No obvious SPaG issues detected by the rule-based checker.');

    renderSentenceAudit(features.sentenceAudit);

    $("copyFeedbackBtn").dataset.feedback = buildFeedbackText(result);
    $("resultsCard").scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    $("marksBadge").textContent = CONFIG.maxMark + ' marks';
    $("questionText").textContent = CONFIG.questionPrompt;
    $("extractText").textContent = CONFIG.sourceExtract;
    renderRubric();

    const saved = root.localStorage ? localStorage.getItem(STORAGE_KEY) : '';
    if (saved) $("answerBox").value = saved;
    updateWordCounter();

    $("answerBox").addEventListener('input', function () {
      if (root.localStorage) localStorage.setItem(STORAGE_KEY, $("answerBox").value);
      updateWordCounter();
    });

    $("markBtn").addEventListener('click', function () {
      const answer = $("answerBox").value.trim();
      if (!answer) {
        root.alert('Please type an answer first.');
        return;
      }
      renderResults(analyseAnswer(answer));
    });

    $("clearBtn").addEventListener('click', function () {
      const confirmed = root.confirm('Clear the saved answer from this browser?');
      if (!confirmed) return;
      $("answerBox").value = '';
      if (root.localStorage) localStorage.removeItem(STORAGE_KEY);
      updateWordCounter();
      $("resultsCard").hidden = true;
    });

    $("copyFeedbackBtn").addEventListener('click', async function () {
      const feedback = $("copyFeedbackBtn").dataset.feedback;
      if (!feedback) {
        root.alert('Mark an answer first, then copy the feedback.');
        return;
      }
      try {
        await navigator.clipboard.writeText(feedback);
        $("copyFeedbackBtn").textContent = 'Feedback copied';
        root.setTimeout(function () {
          $("copyFeedbackBtn").textContent = 'Copy feedback';
        }, 1600);
      } catch (error) {
        root.alert('Clipboard copy failed on this browser.');
      }
    });
  }

  root.GCSEMarker = {
    analyseAnswer: analyseAnswer,
    config: CONFIG
  };

  if (hasDocument()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialisePage);
    } else {
      initialisePage();
    }
  }
})(window);
