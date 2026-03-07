(function (root) {
  "use strict";

  const CONFIG = root.QUIZ_CONFIG || null;
  const STORAGE_KEY = "gcse_english_github_pages_answer_v2";

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

  function average(values) {
    if (!values.length) return 0;
    return values.reduce(function (sum, value) {
      return sum + value;
    }, 0) / values.length;
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

  const EXTRACT_TOKENS = CONFIG ? tokenize(CONFIG.sourceExtract) : [];
  const EXTRACT_STEM_SET = makeStemSet(EXTRACT_TOKENS);
  const EXTRACT_4GRAM_SET = new Set(buildNgrams(EXTRACT_TOKENS, 4));

  function detectQuotedSegments(text) {
    const segments = [];
    const regex = /(?:^|[\s(])(?:["“”]|[‘’'])([^"“”'‘’]{2,120}?)(?:["“”]|[‘’'])(?=$|[\s),.;:!?])/g;
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
      const stem = simpleStem(tokens[i]);
      if (EXTRACT_STEM_SET.has(stem)) overlap += 1;
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
        if (segment.wordCount <= 8) {
          shortExtractQuotes.push(segment);
        }
        if (segment.wordCount >= 9) {
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
    }

    for (let i = 0; i < originalSentences.length; i += 1) {
      const sentence = originalSentences[i];
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
      if (stemSet.has(simpleStem(term))) {
        matched.push(term);
      }
    }

    return uniqueArray(matched);
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
      const analysisVerbs = findSingleWordMatches(tokens, CONFIG.analyticalVerbs);
      const methods = findSingleWordMatches(tokens, CONFIG.methodTerms);
      const sentenceTerms = findSingleWordMatches(tokens, CONFIG.sentenceTerms);
      const explanationFrames = findMatchesFromList(sentence, CONFIG.explanationFrames);
      const interpretiveFrames = findMatchesFromList(sentence, CONFIG.interpretiveFrames);
      const effectTerms = findSingleWordMatches(tokens, CONFIG.effectTerms);
      const readerEffectTerms = findMatchesFromList(sentence, CONFIG.readerEffectTerms);
      const comparisonTerms = findMatchesFromList(sentence, CONFIG.comparisonTerms);
      const genericTerms = findMatchesFromList(sentence, CONFIG.genericEmptyPhrases);

      const hasEvidence =
        quotedInfo.extractQuotes.length > 0 ||
        highValueHits.length > 0 ||
        indicativeMatches.length > 0 ||
        salientHits.length >= 2;
      const hasMethod = methods.length + sentenceTerms.length > 0;
      const hasAnalysisVerb = analysisVerbs.length + explanationFrames.length + interpretiveFrames.length > 0;
      const hasEffect = effectTerms.length + readerEffectTerms.length > 0;
      const hasComparison = comparisonTerms.length > 0;
      const developedLinkCount = [hasMethod, hasAnalysisVerb, hasEffect, hasComparison].filter(Boolean).length;
      const methodEffectLink = hasEvidence && hasMethod && (hasAnalysisVerb || hasEffect || hasComparison);
      const featureSpotting = hasEvidence && hasMethod && !hasAnalysisVerb && !hasEffect && !hasComparison;
      const retellRisk = hasEvidence && !hasMethod && !hasAnalysisVerb && !hasEffect && !hasComparison;
      const developedAnalysis = hasEvidence && developedLinkCount >= 2 && tokens.length >= 10;
      const basicAnalysis = hasEvidence && (hasMethod || hasAnalysisVerb || hasEffect || hasComparison);

      let type = "neutral";
      let label = "Neutral";

      if (developedAnalysis) {
        type = "developed-analysis";
        label = "Developed analysis";
      } else if (featureSpotting) {
        type = "feature-spotting";
        label = "Method spotted";
      } else if (basicAnalysis) {
        type = "analysis";
        label = "Analysis";
      } else if (retellRisk) {
        type = "reference-only";
        label = "Reference / retelling risk";
      } else if (hasMethod && !hasEvidence) {
        type = "method-no-evidence";
        label = "Method with no evidence";
      } else if (genericTerms.length > 0) {
        type = "generic";
        label = "Generic comment";
      }

      audit.push({
        text: sentence,
        tokens: tokens,
        type: type,
        label: label,
        hasEvidence: hasEvidence,
        hasMethod: hasMethod,
        hasAnalysisVerb: hasAnalysisVerb,
        hasEffect: hasEffect,
        hasComparison: hasComparison,
        developedAnalysis: developedAnalysis,
        methodEffectLink: methodEffectLink,
        featureSpotting: featureSpotting,
        retellRisk: retellRisk,
        genericTerms: genericTerms,
        methods: uniqueArray(methods.concat(sentenceTerms)),
        analysisTerms: uniqueArray(analysisVerbs.concat(explanationFrames).concat(interpretiveFrames)),
        effectTerms: uniqueArray(effectTerms.concat(readerEffectTerms)),
        evidenceHits: uniqueArray(highValueHits.concat(indicativeMatches.map(function (item) { return item.matchedBy; }))),
        quotedSegments: quotedInfo.extractQuotes
      });
    }

    return audit;
  }

  function analyseCopying(answerTokens, quoteInfo, sentenceAudit, analyticalSentenceCount, developedSentenceCount) {
    const answer4grams = buildNgrams(answerTokens, 4);
    let overlapCount = 0;
    for (let i = 0; i < answer4grams.length; i += 1) {
      if (EXTRACT_4GRAM_SET.has(answer4grams[i])) {
        overlapCount += 1;
      }
    }

    const overlap4GramRatio = answer4grams.length ? overlapCount / answer4grams.length : 0;
    const quoteShare = answerTokens.length ? quoteInfo.quotedExtractWordCount / answerTokens.length : 0;
    const longCopiedQuoteCount = quoteInfo.longExtractQuotes.length;
    const referenceOnlyCount = sentenceAudit.filter(function (item) {
      return item.retellRisk;
    }).length;

    const heavyCopying =
      (answer4grams.length >= 3 && overlap4GramRatio >= 0.25) ||
      quoteShare >= 0.4 ||
      longCopiedQuoteCount >= 2;
    const moderateCopying =
      !heavyCopying &&
      ((answer4grams.length >= 3 && overlap4GramRatio >= 0.15) ||
      quoteShare >= 0.25 ||
      longCopiedQuoteCount >= 1);

    const retellHeavy =
      referenceOnlyCount >= 2 &&
      developedSentenceCount === 0 &&
      analyticalSentenceCount <= referenceOnlyCount;

    return {
      overlap4GramRatio: Number(overlap4GramRatio.toFixed(2)),
      quoteShare: Number(quoteShare.toFixed(2)),
      longCopiedQuoteCount: longCopiedQuoteCount,
      heavyCopying: heavyCopying,
      moderateCopying: moderateCopying,
      retellHeavy: retellHeavy,
      referenceOnlyCount: referenceOnlyCount
    };
  }

  function getDomainDescriptor(domain, score) {
    const descriptors = CONFIG.domainDescriptors[domain] || [];
    const index = clamp(score, 0, descriptors.length - 1);
    return descriptors[index] || "";
  }

  function scoreCoverage(features) {
    let score = 0;
    if (features.matchedGroupCount >= 1) score = 1;
    if (features.matchedGroupCount >= 2) score = 2;
    if (features.matchedGroupCount >= 3) score = 3;
    if (features.matchedGroupCount >= 4) score = 4;
    if (features.matchedGroupCount >= 3 && features.comparisonCount >= 1) {
      score = Math.max(score, 4);
    }
    return clamp(score, 0, 4);
  }

  function scoreEvidence(features) {
    let score = 0;
    const precise = features.preciseQuoteCount;
    const refs = features.highValueReferenceCount;
    const totalPreciseEvidence = precise + refs;

    if (totalPreciseEvidence >= 1 || features.salientOverlap.length >= 2) score = 1;
    if ((precise >= 1 && refs >= 1) || precise >= 2 || refs >= 2) score = 2;
    if (totalPreciseEvidence >= 3 && features.matchedGroupCount >= 2) score = 3;
    if (totalPreciseEvidence >= 4 && features.matchedGroupCount >= 3 && features.copying.longCopiedQuoteCount === 0) {
      score = 4;
    }

    if (features.copying.moderateCopying && score > 1) score -= 1;
    if (features.copying.heavyCopying && score > 2) score = 2;

    return clamp(score, 0, 4);
  }

  function scoreAnalysis(features) {
    let score = 0;
    if (features.analyticalSentenceCount >= 1 || features.analyticalVerbCount >= 1) score = 1;
    if (
      features.analyticalSentenceCount >= 2 &&
      (features.effectTermCount >= 1 || features.analysisFrameCount >= 1 || features.analyticalVerbCount >= 2)
    ) {
      score = 2;
    }
    if (
      features.developedAnalyticalSentenceCount >= 1 &&
      (features.analyticalVerbCount >= 2 || features.comparisonCount >= 1 || features.methodEffectLinkCount >= 1)
    ) {
      score = 3;
    }
    if (
      features.developedAnalyticalSentenceCount >= 2 &&
      features.analyticalVerbCount >= 2 &&
      (features.methodEffectLinkCount >= 1 || features.comparisonCount >= 1 || features.matchedGroupCount >= 3)
    ) {
      score = 4;
    }
    if (
      features.developedAnalyticalSentenceCount >= 3 &&
      features.analyticalVerbCount >= 3 &&
      features.matchedGroupCount >= 3 &&
      (features.methodEffectLinkCount >= 1 || features.comparisonCount >= 1)
    ) {
      score = 5;
    }

    if (features.featureSpottingCount > features.developedAnalyticalSentenceCount + 1 && score > 0) {
      score -= 1;
    }
    if (features.copying.retellHeavy && score > 1) {
      score -= 1;
    }

    return clamp(score, 0, 5);
  }

  function scoreMethods(features) {
    const totalMethods = features.methodCount + features.sentenceTermCount;
    let score = 0;
    if (totalMethods >= 1) score = 1;
    if (features.methodEffectLinkCount >= 1 || totalMethods >= 2) score = 2;
    if (features.methodEffectLinkCount >= 2 || (totalMethods >= 3 && features.sentenceTermCount >= 1)) {
      score = 3;
    }
    if (features.featureSpottingCount > features.methodEffectLinkCount + 1 && score > 1) {
      score -= 1;
    }
    return clamp(score, 0, 3);
  }

  function scoreControl(features) {
    let score = 0;
    if (features.wordCount >= 20 && features.sentenceCount >= 1) score = 1;
    if (features.wordCount >= 45 && features.sentenceCount >= 2 && features.analyticalSentenceCount >= 1) {
      score = 2;
    }
    if (
      features.wordCount >= 70 &&
      features.sentenceCount >= 3 &&
      features.developedAnalyticalSentenceCount >= 1 &&
      !features.copying.retellHeavy
    ) {
      score = 3;
    }
    if (
      features.wordCount >= 85 &&
      features.sentenceCount >= 3 &&
      features.developedAnalyticalSentenceCount >= 2 &&
      !features.copying.heavyCopying &&
      features.genericPhraseCount <= 1
    ) {
      score = 4;
    }

    if (features.copying.retellHeavy && score > 1) score -= 1;
    if (features.keywordStuffing && score > 1) score -= 1;
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
      reasons.push("The answer includes strong copying or buzzword-only patterns.");
    } else if (features.copying.moderateCopying || features.genericPhraseCount >= 2) {
      label = "Medium";
      reasons.push("The answer mixes real analysis with some weaker or generic material.");
    }

    if (features.wordCount < 35) {
      label = label === "High" ? "Medium" : label;
      reasons.push("The answer is quite short, so the estimate is less secure.");
    }

    if (features.spag.unreadable) {
      label = "Low";
      reasons.push("Some sentences are hard to follow, which makes the estimate less secure.");
    }

    if (mark === 8 && domainScores.total < 18) {
      label = label === "High" ? "Medium" : label;
      reasons.push("This sits near the 7/8 boundary.");
    }
    if (mark === 7 && domainScores.total < 16) {
      label = label === "High" ? "Medium" : label;
      reasons.push("This sits near the Level 3 / Level 4 boundary.");
    }
    if (mark === 6 && domainScores.total < 12) {
      label = label === "High" ? "Medium" : label;
      reasons.push("This sits near the 5/6 boundary.");
    }
    if (mark === 4 && domainScores.total < 8) {
      label = label === "High" ? "Medium" : label;
      reasons.push("This sits near the 3/4 boundary.");
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
    if (features.wordCount < 8 || features.relevanceSignals < 2) {
      return {
        level: "Level 0",
        mark: 0,
        summary: levelDescriptor("Level 0"),
        domainScores: {
          coverage: 0,
          evidence: 0,
          analysis: 0,
          methods: 0,
          control: 0,
          total: 0
        },
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
    domainScores.total =
      domainScores.coverage +
      domainScores.evidence +
      domainScores.analysis +
      domainScores.methods +
      domainScores.control;

    let level = "Level 1";
    const extractReferenceSignals =
      features.preciseQuoteCount +
      features.highValueReferenceCount +
      (features.salientOverlap.length >= 2 ? 1 : 0);

    const level4Gate =
      domainScores.analysis >= 4 &&
      domainScores.evidence >= 3 &&
      domainScores.coverage >= 3 &&
      domainScores.methods >= 2 &&
      domainScores.control >= 2 &&
      features.developedAnalyticalSentenceCount >= 2 &&
      features.preciseQuoteCount + features.highValueReferenceCount >= 2 &&
      !features.copying.heavyCopying;

    const level3Gate =
      domainScores.analysis >= 3 &&
      domainScores.evidence >= 2 &&
      domainScores.coverage >= 2 &&
      domainScores.control >= 1 &&
      features.analyticalSentenceCount >= 2 &&
      (domainScores.methods >= 1 || features.comparisonCount >= 1 || features.developedAnalyticalSentenceCount >= 1) &&
      !features.copying.heavyCopying;

    const level2Gate =
      domainScores.analysis >= 1 &&
      (domainScores.evidence >= 1 || (domainScores.methods >= 1 && extractReferenceSignals >= 1)) &&
      domainScores.coverage >= 1 &&
      extractReferenceSignals >= 1;

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
        domainScores.total >= 16 &&
        features.developedAnalyticalSentenceCount >= 3 &&
        features.methodEffectLinkCount >= 2 &&
        features.genericPhraseCount <= 1 &&
        !features.copying.moderateCopying
      ) {
        mark = 8;
      }
    } else if (level === "Level 3") {
      mark = 5;
      if (
        domainScores.total >= 11 &&
        features.developedAnalyticalSentenceCount >= 1 &&
        (features.preciseQuoteCount >= 2 || features.highValueReferenceCount >= 2)
      ) {
        mark = 6;
      }
    } else if (level === "Level 2") {
      mark = 3;
      if (
        domainScores.total >= 7 &&
        features.analyticalSentenceCount >= 2 &&
        features.matchedGroupCount >= 2
      ) {
        mark = 4;
      }
    } else {
      mark = features.relevanceSignals >= 3 && features.wordCount >= 18 ? 2 : 1;
    }

    if (features.copying.heavyCopying && features.developedAnalyticalSentenceCount === 0) {
      mark = Math.min(mark, 2);
    } else if ((features.copying.moderateCopying || features.copying.retellHeavy) && mark > 4) {
      mark = 4;
    }

    if (features.keywordStuffing && mark > 4) {
      mark -= 1;
    }

    if (features.genericPhraseCount >= 3 && mark > 3) {
      mark -= 1;
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

    if (features.copying.retellHeavy) {
      watchouts.push({ text: "More reference than analysis in parts of the answer", tone: "warn" });
    }

    if (features.keywordStuffing) {
      watchouts.push({ text: "Buzzwords detected without enough linked analysis", tone: "danger" });
    }

    if (features.featureSpottingCount > features.methodEffectLinkCount + 1) {
      watchouts.push({ text: "Methods named without explaining their effect enough", tone: "warn" });
    }

    if (features.genericPhraseCount >= 2) {
      watchouts.push({ text: "Generic filler phrases are reducing precision", tone: "warn" });
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
      strengths.push("You range across the extract rather than staying on one single detail.");
    }

    if (grade.domainScores.evidence >= 3) {
      strengths.push("Your references are precise and mostly well chosen, instead of vague retelling.");
    }

    if (grade.domainScores.analysis >= 4) {
      strengths.push("Several sentences link evidence to meaning and effect in a developed way.");
    } else if (grade.domainScores.analysis >= 3) {
      strengths.push("You explain the effect of language clearly, not just what happens.");
    }

    if (grade.domainScores.methods >= 2) {
      strengths.push("You comment on the writer's methods or sentence choices rather than only the content.");
    }

    if (features.comparisonCount >= 1) {
      strengths.push("You notice a contrast or shift in the writing, which often helps responses move up the levels.");
    }

    if (features.developedAnalyticalSentenceCount >= 2) {
      strengths.push("More than one sentence in your answer counts as developed analysis, not just a simple point.");
    }

    if (!strengths.length) {
      strengths.push("Your response is relevant enough to start collecting marks.");
    }

    return strengths.slice(0, 6);
  }

  function buildTargets(features, grade) {
    const targets = [];

    if (grade.domainScores.coverage < 3) {
      targets.push("Range across more of the extract. Try covering beauty outside, discomfort inside, and the blank passengers.");
    }

    if (grade.domainScores.evidence < 3) {
      targets.push("Use shorter, embedded quotations rather than broad retelling or long copied chunks.");
    }

    if (grade.domainScores.analysis < 4) {
      targets.push("After each quotation, explain what it suggests or implies about Rosabel's experience.");
    }

    if (grade.domainScores.methods < 2) {
      targets.push("Name a method only when you can link it to an effect, for example contrast, imagery, dash, ellipsis, or semicolon.");
    }

    if (features.featureSpottingCount >= 1) {
      targets.push("Do not stop at feature spotting. Add the effect: what does that word or method make the bus feel like?");
    }

    if (features.copying.moderateCopying || features.copying.heavyCopying) {
      targets.push("Cut down long copied phrasing from the extract and replace it with your own explanation.");
    }

    if (features.genericPhraseCount >= 1) {
      targets.push("Avoid vague phrases like “this is effective”. Say exactly what is effective and why.");
    }

    if (features.spag.errorCount > 3) {
      targets.push("Tidy up punctuation and spelling so your analysis is easier to follow.");
    }

    if (!targets.length) {
      if (grade.mark < CONFIG.maxMark) {
        targets.push("To move even higher, add another precise quotation and push the effect into a more detailed interpretation.");
      } else {
        targets.push("This already matches the top band in this calibrated rule-based marker.");
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
    const analysisVerbsFound = findSingleWordMatches(answerTokens, CONFIG.analyticalVerbs);
    const methodsFound = findSingleWordMatches(answerTokens, CONFIG.methodTerms);
    const sentenceTermsFound = findSingleWordMatches(answerTokens, CONFIG.sentenceTerms);
    const analysisFramesFound = findMatchesFromList(answerText, CONFIG.explanationFrames);
    const interpretiveFramesFound = findMatchesFromList(answerText, CONFIG.interpretiveFrames);
    const comparisonTermsFound = findMatchesFromList(answerText, CONFIG.comparisonTerms);
    const effectTermsFound = findSingleWordMatches(answerTokens, CONFIG.effectTerms);
    const readerEffectTermsFound = findMatchesFromList(answerText, CONFIG.readerEffectTerms);
    const genericPhrasesFound = findMatchesFromList(answerText, CONFIG.genericEmptyPhrases);
    const quoteInfo = classifyQuotedSegments(answerText);
    const sentenceAudit = analyseSentenceAudit(answerText);
    const spag = analyseSpag(answerText, sentences);

    const analyticalSentenceCount = sentenceAudit.filter(function (item) {
      return item.type === "analysis" || item.type === "developed-analysis";
    }).length;
    const developedAnalyticalSentenceCount = sentenceAudit.filter(function (item) {
      return item.type === "developed-analysis";
    }).length;
    const featureSpottingCount = sentenceAudit.filter(function (item) {
      return item.featureSpotting;
    }).length;
    const methodEffectLinkCount = sentenceAudit.filter(function (item) {
      return item.methodEffectLink;
    }).length;

    const copying = analyseCopying(
      answerTokens,
      quoteInfo,
      sentenceAudit,
      analyticalSentenceCount,
      developedAnalyticalSentenceCount
    );

    const buzzwordCount =
      analysisVerbsFound.length + methodsFound.length + sentenceTermsFound.length + analysisFramesFound.length;
    const keywordStuffing =
      buzzwordCount >= 6 &&
      developedAnalyticalSentenceCount === 0 &&
      quoteInfo.shortExtractQuotes.length === 0 &&
      highValueReferences.length <= 1;

    const features = {
      wordCount: answerTokens.length,
      sentenceCount: sentences.length,
      matchedGroupCount: matchedContent.length,
      matchedContent: matchedContent,
      highValueReferences: highValueReferences,
      highValueReferenceCount: highValueReferences.length,
      salientOverlap: salientOverlap,
      preciseQuoteCount: quoteInfo.shortExtractQuotes.length,
      quoteInfo: quoteInfo,
      analyticalVerbsFound: analysisVerbsFound,
      analyticalVerbCount: analysisVerbsFound.length,
      methodsFound: methodsFound,
      methodCount: methodsFound.length,
      sentenceTermsFound: sentenceTermsFound,
      sentenceTermCount: sentenceTermsFound.length,
      analysisFramesFound: analysisFramesFound,
      analysisFrameCount: analysisFramesFound.length,
      interpretiveFramesFound: interpretiveFramesFound,
      interpretiveFrameCount: interpretiveFramesFound.length,
      comparisonTermsFound: comparisonTermsFound,
      comparisonCount: comparisonTermsFound.length,
      effectTermsFound: uniqueArray(effectTermsFound.concat(readerEffectTermsFound)),
      effectTermCount: uniqueArray(effectTermsFound.concat(readerEffectTermsFound)).length,
      genericPhrasesFound: genericPhrasesFound,
      genericPhraseCount: genericPhrasesFound.length,
      analyticalSentenceCount: analyticalSentenceCount,
      developedAnalyticalSentenceCount: developedAnalyticalSentenceCount,
      featureSpottingCount: featureSpottingCount,
      methodEffectLinkCount: methodEffectLinkCount,
      sentenceAudit: sentenceAudit,
      spag: spag,
      copying: copying,
      keywordStuffing: keywordStuffing
    };

    features.relevanceSignals =
      features.matchedGroupCount +
      features.highValueReferenceCount +
      features.preciseQuoteCount +
      features.analyticalVerbCount +
      features.methodCount +
      features.developedAnalyticalSentenceCount;

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
        tags.push('<span class="audit-tag warn">Reference only</span>');
      } else if (item.type === "feature-spotting") {
        tags.push('<span class="audit-tag warn">Method spotted</span>');
      } else if (item.type === "method-no-evidence") {
        tags.push('<span class="audit-tag warn">Method without evidence</span>');
      } else if (item.type === "generic") {
        tags.push('<span class="audit-tag warn">Generic phrase</span>');
      } else {
        tags.push('<span class="audit-tag dim">Neutral</span>');
      }

      if (item.methodEffectLink) {
        tags.push('<span class="audit-tag good">Method + effect link</span>');
      }
      if (item.retellRisk) {
        tags.push('<span class="audit-tag danger">Retelling risk</span>');
      }

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
      'SPaG issues detected: ' + features.spag.errorCount
    ].join('\n');
  }

  function renderDomainCard(idPrefix, score, max, domain) {
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

    renderDomainCard('coverage', grade.domainScores.coverage, 4, 'coverage');
    renderDomainCard('evidence', grade.domainScores.evidence, 4, 'evidence');
    renderDomainCard('analysis', grade.domainScores.analysis, 5, 'analysis');
    renderDomainCard('methods', grade.domainScores.methods, 3, 'methods');
    renderDomainCard('control', grade.domainScores.control, 4, 'control');

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

    const references = uniqueArray(
      features.highValueReferences.concat(
        features.quoteInfo.shortExtractQuotes.map(function (item) { return item.text; })
      )
    );
    renderChipList($("referenceList"), references, 'Add short precise quotations.', 'dim');

    const analysisItems = uniqueArray(
      features.analyticalVerbsFound
        .concat(features.analysisFramesFound)
        .concat(features.interpretiveFramesFound)
        .concat(features.effectTermsFound)
    );
    renderChipList($("analysisLanguage"), analysisItems, 'Add more analysis language.', 'dim');

    const methodItems = uniqueArray(features.methodsFound.concat(features.sentenceTermsFound));
    renderChipList($("methodLanguage"), methodItems, 'Add method or sentence terminology.', 'dim');

    renderChipList($("watchouts"), result.watchouts, 'No major watch-outs detected.', 'good');

    $("spagSummary").textContent =
      'Estimated clarity issues: ' + features.spag.errorCount + '. ' +
      'Band: ' + features.spag.band + '.';
    renderList(
      $("spagList"),
      features.spag.issues.slice(0, 5),
      'No obvious SPaG issues detected by the rule-based checker.'
    );

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
    if (saved) {
      $("answerBox").value = saved;
    }
    updateWordCounter();

    $("answerBox").addEventListener('input', function () {
      if (root.localStorage) {
        localStorage.setItem(STORAGE_KEY, $("answerBox").value);
      }
      updateWordCounter();
    });

    $("markBtn").addEventListener('click', function () {
      const answer = $("answerBox").value.trim();
      if (!answer) {
        root.alert('Please type an answer first.');
        return;
      }
      const result = analyseAnswer(answer);
      renderResults(result);
    });

    $("clearBtn").addEventListener('click', function () {
      const confirmed = root.confirm('Clear the saved answer from this browser?');
      if (!confirmed) return;
      $("answerBox").value = '';
      if (root.localStorage) {
        localStorage.removeItem(STORAGE_KEY);
      }
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
        }, 1400);
      } catch (error) {
        root.alert('Could not copy automatically. Please try again.');
      }
    });
  }

  root.GCSEMarker = {
    analyseAnswer: analyseAnswer,
    detectQuotedSegments: detectQuotedSegments,
    normaliseText: normaliseText,
    tokenize: tokenize
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.GCSEMarker;
  }

  if (hasDocument()) {
    document.addEventListener('DOMContentLoaded', initialisePage);
  }
})(typeof window !== 'undefined' ? window : globalThis);
