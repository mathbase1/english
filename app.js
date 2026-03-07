(function () {
  "use strict";

  const CONFIG = window.QUIZ_CONFIG;
  const STORAGE_KEY = "gcse_english_github_pages_answer_v1";

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function normaliseText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[^a-z0-9'\s-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function simpleStem(token) {
    let t = token.toLowerCase();
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
      .split(/\s+/)
      .map((token) => token.replace(/^'+|'+$/g, ""))
      .filter(Boolean);
  }

  function countWords(text) {
    return tokenize(text).length;
  }

  function splitSentences(text) {
    return String(text || "")
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function uniqueArray(values) {
    return [...new Set(values)];
  }

  function containsPhrase(text, phrase) {
    const haystack = normaliseText(text);
    const needle = normaliseText(phrase);
    if (!needle) return false;
    return haystack.includes(needle);
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
    if (!termTokens.length) {
      return 0;
    }

    let overlap = 0;
    for (const token of termTokens) {
      if (answerStemSet.has(token)) overlap += 1;
    }

    const ratio = overlap / termTokens.length;
    if (termTokens.length === 1) {
      return ratio >= 1 ? 0.95 : 0;
    }
    if (ratio === 1) return 0.92;
    if (ratio >= 0.67) return 0.7;
    if (ratio >= 0.5) return 0.55;
    return 0;
  }

  function findIndicativeContent(answerText, answerTokens) {
    const answerStemSet = makeStemSet(answerTokens);
    const matches = [];

    for (const group of CONFIG.indicativeContentGroups) {
      let bestScore = 0;
      let bestTerm = "";

      for (const term of group.terms) {
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

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  function findMatchesFromList(answerText, list) {
    const matches = [];
    for (const item of list) {
      if (containsPhrase(answerText, item)) {
        matches.push(item);
      }
    }
    return uniqueArray(matches);
  }

  function findSingleWordMatches(answerTokens, list) {
    const tokenSet = new Set(answerTokens.map((token) => token.toLowerCase()));
    const stemSet = makeStemSet(answerTokens);
    const matches = [];

    for (const item of list) {
      const itemNormal = normaliseText(item);
      if (!itemNormal) continue;

      if (itemNormal.includes(" ")) {
        if (containsPhrase(answerTokens.join(" "), itemNormal)) {
          matches.push(item);
          continue;
        }
        const termTokens = tokenize(itemNormal);
        const matchedAll = termTokens.every((token) => {
          const stem = simpleStem(token);
          return tokenSet.has(token) || stemSet.has(stem);
        });
        if (matchedAll) {
          matches.push(item);
        }
      } else {
        const stem = simpleStem(itemNormal);
        if (tokenSet.has(itemNormal) || stemSet.has(stem)) {
          matches.push(item);
        }
      }
    }

    return uniqueArray(matches);
  }

  function countQuoteSegments(answerText) {
    const matches = answerText.match(/(["“”'‘’])([^"“”'‘’]{3,80})\1/g) || [];
    return matches.length;
  }

  function analyseSyntax(sentences) {
    const lengths = sentences.map((sentence) => countWords(sentence));
    let complexCount = 0;

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      const wordCount = countWords(sentence);
      const hasSubordination = CONFIG.subordinateMarkers.some((marker) => lower.includes(marker));
      const hasClausePunctuation = /[,;:()\-]/.test(sentence);
      if (wordCount >= 12 && (hasSubordination || hasClausePunctuation)) {
        complexCount += 1;
      }
    }

    const sentenceVariety =
      lengths.length >= 2 && Math.max(...lengths) - Math.min(...lengths) >= 6;
    const avgLength = average(lengths);

    return {
      complexCount,
      sentenceVariety,
      avgLength,
      complexSyntax:
        complexCount >= 2 || (complexCount >= 1 && sentenceVariety && avgLength >= 12)
    };
  }

  function contentVocabularyStats(answerTokens) {
    const stopwords = new Set([
      "the", "a", "an", "and", "or", "but", "if", "to", "of", "in", "on", "for",
      "it", "is", "was", "were", "be", "as", "at", "by", "this", "that", "these",
      "those", "with", "from", "into", "so", "than", "then", "they", "their", "them",
      "he", "she", "his", "her", "you", "your", "i", "we", "our", "are", "am", "been",
      "being", "have", "has", "had", "do", "does", "did", "because", "which", "who",
      "what", "when", "where", "while", "although", "however", "also"
    ]);

    const contentWords = answerTokens
      .map((token) => token.toLowerCase())
      .filter((token) => token.length > 2 && !stopwords.has(token));

    const uniqueContent = uniqueArray(contentWords);
    const ttr = contentWords.length ? uniqueContent.length / contentWords.length : 0;

    return {
      contentWordCount: contentWords.length,
      uniqueContentWordCount: uniqueContent.length,
      typeTokenRatio: Number(ttr.toFixed(2)),
      variedVocab: contentWords.length >= 20 && ttr >= 0.54
    };
  }

  function analyseSpag(answerText, sentences) {
    let issues = [];
    let errorCount = 0;

    const originalSentences = String(answerText || "")
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const sentence of originalSentences) {
      const firstLetterMatch = sentence.match(/[A-Za-z]/);
      if (firstLetterMatch && firstLetterMatch[0] !== firstLetterMatch[0].toUpperCase()) {
        issues.push("A sentence appears to start with a lowercase letter.");
        errorCount += 1;
      }
    }

    for (const sentence of originalSentences) {
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

    const repeatedPunctuationMatches =
      answerText.match(/([!?;,])\1{1,}|\.{4,}/g) || [];
    if (repeatedPunctuationMatches.length > 0) {
      issues.push("Repeated punctuation has been detected.");
      errorCount += repeatedPunctuationMatches.length;
    }

    const doubleSpaces = answerText.match(/ {2,}/g) || [];
    if (doubleSpaces.length > 0) {
      issues.push("There are extra spaces in the answer.");
      errorCount += Math.min(doubleSpaces.length, 2);
    }

    const rawTokens = tokenize(answerText);
    for (const token of rawTokens) {
      if (Object.prototype.hasOwnProperty.call(CONFIG.commonMisspellings, token)) {
        issues.push(
          `Possible spelling issue: “${token}” could be “${CONFIG.commonMisspellings[token]}”.`
        );
        errorCount += 1;
      }
    }

    const veryLongRunOns = sentences.filter(
      (sentence) => countWords(sentence) > 40 && !/[;,:\-]/.test(sentence)
    ).length;
    if (veryLongRunOns > 0) {
      issues.push("One sentence looks very long and may need clearer punctuation.");
      errorCount += veryLongRunOns;
    }

    issues = uniqueArray(issues);
    errorCount = Math.min(errorCount, 8);

    let band = "Strong control";
    if (errorCount >= 6) {
      band = "Weak control";
    } else if (errorCount >= 3) {
      band = "Mostly secure";
    }

    return { errorCount, issues, band };
  }

  function extractSalientOverlap(answerTokens) {
    const stemSet = makeStemSet(answerTokens);
    const matched = [];

    for (const term of CONFIG.salientExtractTerms) {
      const stemmed = simpleStem(term);
      if (stemSet.has(stemmed)) {
        matched.push(term);
      }
    }

    return uniqueArray(matched);
  }

  function estimateCopying(answerTokens, analyticalVerbCount, methodCount) {
    const answerStemSet = makeStemSet(answerTokens);
    const extractStemSet = new Set(CONFIG.salientExtractTerms.map(simpleStem));
    const overlapping = [...answerStemSet].filter((token) => extractStemSet.has(token)).length;
    const ratio = answerStemSet.size ? overlapping / answerStemSet.size : 0;
    const isMostlyCopied = ratio > 0.52 && analyticalVerbCount < 2 && methodCount < 2;
    return { ratio: Number(ratio.toFixed(2)), isMostlyCopied };
  }

  function levelDescriptor(levelText) {
    const found = CONFIG.levelDescriptors.find((item) => item.level === levelText);
    return found ? found.summary : "";
  }

  function determineMark(features) {
    if (features.wordCount < 8 || features.relevanceSignals < 2) {
      return {
        level: "Level 0",
        mark: 0,
        summary: levelDescriptor("Level 0")
      };
    }

    const methodTotal = features.methodCount + features.sentenceCountMentioned;

    const meetsLevel4 =
      features.matchedGroupCount >= 4 &&
      features.analyticalVerbCount >= 3 &&
      methodTotal >= 2 &&
      features.quoteEvidenceCount >= 2 &&
      features.analysisFrameCount >= 2 &&
      features.syntax.complexSyntax &&
      features.spag.errorCount <= 2 &&
      features.wordCount >= 85;

    const meetsLevel3 =
      features.matchedGroupCount >= 3 &&
      features.analyticalVerbCount >= 2 &&
      methodTotal >= 1 &&
      features.quoteEvidenceCount >= 1 &&
      (features.analysisFrameCount >= 1 || features.comparisonCount >= 1) &&
      features.vocab.variedVocab &&
      features.spag.errorCount <= 5 &&
      features.wordCount >= 50;

    const meetsLevel2 =
      features.matchedGroupCount >= 1 &&
      (features.analyticalVerbCount >= 1 || methodTotal >= 1 || features.quoteEvidenceCount >= 1) &&
      features.wordCount >= 28;

    let level = "Level 1";
    if (meetsLevel4) {
      level = "Level 4";
    } else if (meetsLevel3) {
      level = "Level 3";
    } else if (meetsLevel2) {
      level = "Level 2";
    }

    let mark = 1;

    if (level === "Level 4") {
      let strength = 0;
      if (features.matchedGroupCount >= 5) strength += 1;
      if (features.quoteEvidenceCount >= 3) strength += 1;
      if (features.analyticalVerbCount >= 4) strength += 1;
      if (methodTotal >= 3) strength += 1;
      if (features.analysisFrameCount >= 3) strength += 1;
      if (features.comparisonCount >= 1) strength += 1;
      if (features.spag.errorCount <= 1) strength += 1;
      mark = strength >= 4 ? 8 : 7;
    } else if (level === "Level 3") {
      let strength = 0;
      if (features.matchedGroupCount >= 4) strength += 1;
      if (features.quoteEvidenceCount >= 2) strength += 1;
      if (features.analyticalVerbCount >= 3) strength += 1;
      if (methodTotal >= 2) strength += 1;
      if (features.analysisFrameCount >= 2) strength += 1;
      if (features.comparisonCount >= 1 || features.sentenceCountMentioned >= 1) strength += 1;
      mark = strength >= 3 ? 6 : 5;
    } else if (level === "Level 2") {
      let strength = 0;
      if (features.matchedGroupCount >= 2) strength += 1;
      if (features.quoteEvidenceCount >= 1) strength += 1;
      if (features.analyticalVerbCount >= 1) strength += 1;
      if (methodTotal >= 1) strength += 1;
      if (features.wordCount >= 45) strength += 1;
      mark = strength >= 3 ? 4 : 3;
    } else {
      let strength = 0;
      if (features.matchedGroupCount >= 1) strength += 1;
      if (features.quoteEvidenceCount >= 1 || features.relevanceSignals >= 3) strength += 1;
      if (features.wordCount >= 18) strength += 1;
      mark = strength >= 2 ? 2 : 1;
    }

    if (features.spag.errorCount >= 7 && mark > 1) {
      mark -= 1;
    }

    if (features.copying.isMostlyCopied && mark > 2) {
      mark = 2;
      level = "Level 1";
    }

    if (features.wordCount < 25 && mark > 3) {
      mark = 3;
      if (level === "Level 4" || level === "Level 3") {
        level = "Level 2";
      }
    }

    return {
      level,
      mark,
      summary: levelDescriptor(level)
    };
  }

  function buildStrengths(features, grade) {
    const strengths = [];

    if (features.matchedGroupCount >= 3) {
      strengths.push(`You covered ${features.matchedGroupCount} different areas of indicative content from the extract.`);
    }

    if (features.quoteEvidenceCount >= 2) {
      strengths.push("You used short evidence or clear references from the extract.");
    }

    if (features.analyticalVerbCount >= 2) {
      strengths.push(
        `Your analysis vocabulary is strong: ${features.analyticalVerbsFound.slice(0, 4).join(", ")}.`
      );
    }

    if (features.methodCount + features.sentenceCountMentioned >= 2) {
      strengths.push("You commented on methods or sentence / punctuation choices, not just the story content.");
    }

    if (features.syntax.complexSyntax) {
      strengths.push("Your own explanation uses developed sentences rather than only short basic comments.");
    }

    if (features.spag.errorCount <= 2) {
      strengths.push("Technical control is secure, with few obvious SPaG issues.");
    }

    if (features.comparisonCount >= 1) {
      strengths.push("You noticed contrast or a shift in the writing, which helps move the answer up the levels.");
    }

    if (!strengths.length) {
      strengths.push("Your response is relevant enough to begin collecting marks.");
    }

    if (features.copying.isMostlyCopied) {
      strengths.push("You clearly referred closely to the extract, but you now need more explanation of effects.");
    }

    return strengths;
  }

  function buildTargets(features, grade) {
    const targets = [];

    if (features.matchedGroupCount < 3) {
      targets.push("Cover more than one detail from the extract. Aim to mention several effects, not just one image.");
    }

    if (features.quoteEvidenceCount < 2) {
      targets.push("Embed short quotations such as “opal and silver” or “one meaningless, staring face”.");
    }

    if (features.analyticalVerbCount < 2) {
      targets.push("Use more analytical verbs such as suggests, implies, conveys, emphasises, or highlights.");
    }

    if (features.methodCount + features.sentenceCountMentioned < 2) {
      targets.push("Name the writer's methods more directly, for example imagery, contrast, dash, ellipsis, or semicolon.");
    }

    if (features.analysisFrameCount < 2) {
      targets.push("Push your explanation further with phrases like “this suggests...” or “which shows...”.");
    }

    if (!features.syntax.complexSyntax) {
      targets.push("Develop points into fuller sentences using connectives such as because, although, or while.");
    }

    if (features.spag.errorCount > 2) {
      targets.push("Tidy up punctuation and spelling so the analysis reads more fluently.");
    }

    if (features.copying.isMostlyCopied) {
      targets.push("Do not just retell or copy the extract. Explain the effect of the language on the reader.");
    }

    if (!targets.length) {
      if (grade.mark < CONFIG.maxMark) {
        targets.push("To move higher, add even more precise quotations and explore effects in finer detail.");
      } else {
        targets.push("This is already hitting the top band for this rule-based marker.");
      }
    }

    return targets.slice(0, 6);
  }

  function createChip(text, extra = "") {
    return `<span class="chip ${extra}">${escapeHtml(text)}</span>`;
  }

  function renderChipList(container, items, fallbackText) {
    if (!items.length) {
      container.innerHTML = createChip(fallbackText, "dim");
      return;
    }
    container.innerHTML = items.map((item) => {
      if (typeof item === "string") return createChip(item);
      const label = item.label || item.text || "";
      const confidence =
        typeof item.confidence === "number" ? ` <strong>${Math.round(item.confidence * 100)}%</strong>` : "";
      return `<span class="chip">${escapeHtml(label)}${confidence}</span>`;
    }).join("");
  }

  function renderList(container, items, fallbackText = "None detected.") {
    if (!items.length) {
      container.innerHTML = `<li>${escapeHtml(fallbackText)}</li>`;
      return;
    }
    container.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function buildFeedbackText(grade, features, strengths, targets) {
    return [
      `Mark: ${grade.mark} / ${CONFIG.maxMark}`,
      `${grade.level}: ${grade.summary}`,
      "",
      "Strengths:",
      ...strengths.map((item) => `- ${item}`),
      "",
      "Targets:",
      ...targets.map((item) => `- ${item}`)
    ].join("\n");
  }

  function analyseAnswer(answerText) {
    const answerTokens = tokenize(answerText);
    const sentences = splitSentences(answerText);
    const syntax = analyseSyntax(sentences);
    const vocab = contentVocabularyStats(answerTokens);
    const matchedContent = findIndicativeContent(answerText, answerTokens);
    const quoteReferences = findMatchesFromList(answerText, CONFIG.highValueReferences);
    const quoteSegments = countQuoteSegments(answerText);
    const analyticalVerbsFound = findSingleWordMatches(answerTokens, CONFIG.analyticalVerbs);
    const methodsFound = findSingleWordMatches(answerTokens, CONFIG.methodTerms);
    const sentenceTermsFound = findSingleWordMatches(answerTokens, CONFIG.sentenceTerms);
    const analysisFramesFound = findMatchesFromList(answerText, CONFIG.explanationFrames);
    const comparisonTermsFound = findMatchesFromList(answerText, CONFIG.comparisonTerms);
    const salientOverlap = extractSalientOverlap(answerTokens);
    const spag = analyseSpag(answerText, sentences);
    const copying = estimateCopying(
      answerTokens,
      analyticalVerbsFound.length,
      methodsFound.length + sentenceTermsFound.length
    );

    const features = {
      wordCount: answerTokens.length,
      sentenceCount: sentences.length,
      matchedGroupCount: matchedContent.length,
      matchedContent,
      quoteReferences,
      quoteEvidenceCount: Math.max(quoteReferences.length, Math.min(quoteSegments, 3)),
      quoteSegments,
      analyticalVerbsFound,
      analyticalVerbCount: analyticalVerbsFound.length,
      methodsFound,
      methodCount: methodsFound.length,
      sentenceTermsFound,
      sentenceCountMentioned: sentenceTermsFound.length,
      analysisFramesFound,
      analysisFrameCount: analysisFramesFound.length,
      comparisonTermsFound,
      comparisonCount: comparisonTermsFound.length,
      salientOverlap,
      relevanceSignals:
        matchedContent.length +
        quoteReferences.length +
        salientOverlap.length +
        analyticalVerbsFound.length +
        methodsFound.length,
      syntax,
      vocab,
      spag,
      copying
    };

    const grade = determineMark(features);
    const strengths = buildStrengths(features, grade);
    const targets = buildTargets(features, grade);

    return { features, grade, strengths, targets };
  }

  function renderRubric() {
    const rubricGrid = $("rubricGrid");
    rubricGrid.innerHTML = CONFIG.levelDescriptors
      .map(
        (item) => `
          <article class="rubric-card">
            <span class="rubric-level">${escapeHtml(item.level)} · ${escapeHtml(item.marks)} marks</span>
            <p>${escapeHtml(item.summary)}</p>
          </article>
        `
      )
      .join("");
  }

  function renderResults(result) {
    const { features, grade, strengths, targets } = result;

    $("resultsCard").hidden = false;
    $("markHeading").textContent = `${grade.mark} / ${CONFIG.maxMark}`;
    $("levelPill").textContent = grade.level;
    $("bandSummary").textContent = grade.summary;
    $("scoreBarFill").style.width = `${(grade.mark / CONFIG.maxMark) * 100}%`;

    renderList($("strengthList"), strengths);
    renderList($("targetList"), targets);

    const matchedContentItems = features.matchedContent.map((item) => ({
      label: item.label,
      confidence: item.confidence
    }));
    renderChipList(
      $("matchedContent"),
      matchedContentItems,
      "No strong indicative content detected yet."
    );

    const analysisLanguageItems = uniqueArray([
      ...features.analyticalVerbsFound,
      ...features.analysisFramesFound
    ]);
    renderChipList(
      $("analysisLanguage"),
      analysisLanguageItems,
      "Add more analytical vocabulary."
    );

    const methodItems = uniqueArray([
      ...features.methodsFound,
      ...features.sentenceTermsFound
    ]);
    renderChipList(
      $("methodLanguage"),
      methodItems,
      "Add method or sentence terminology."
    );

    $("spagSummary").textContent =
      `Estimated SPaG issue count: ${features.spag.errorCount}. ` +
      `Band: ${features.spag.band}.`;

    renderList(
      $("spagList"),
      features.spag.issues.slice(0, 5),
      "No obvious SPaG issues detected by the rule-based checker."
    );

    $("copyFeedbackBtn").dataset.feedback = buildFeedbackText(grade, features, strengths, targets);
    $("resultsCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateWordCounter() {
    $("wordCount").textContent = countWords($("answerBox").value);
  }

  function initialisePage() {
    if (!CONFIG) {
      document.body.innerHTML =
        "<p style='padding:24px;font-family:Arial,sans-serif;'>config.js could not be loaded.</p>";
      return;
    }

    $("examInfo").textContent = CONFIG.examLabel;
    $("marksBadge").textContent = `${CONFIG.maxMark} marks`;
    $("questionText").textContent = CONFIG.questionPrompt;
    $("extractText").textContent = CONFIG.sourceExtract;
    renderRubric();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      $("answerBox").value = saved;
    }
    updateWordCounter();

    $("answerBox").addEventListener("input", () => {
      localStorage.setItem(STORAGE_KEY, $("answerBox").value);
      updateWordCounter();
    });

    $("markBtn").addEventListener("click", () => {
      const answer = $("answerBox").value.trim();
      if (!answer) {
        alert("Please type an answer first.");
        return;
      }
      const result = analyseAnswer(answer);
      renderResults(result);
    });

    $("clearBtn").addEventListener("click", () => {
      const confirmed = window.confirm("Clear the saved answer from this browser?");
      if (!confirmed) return;
      $("answerBox").value = "";
      localStorage.removeItem(STORAGE_KEY);
      updateWordCounter();
      $("resultsCard").hidden = true;
    });

    $("copyFeedbackBtn").addEventListener("click", async () => {
      const feedback = $("copyFeedbackBtn").dataset.feedback;
      if (!feedback) {
        alert("Mark an answer first, then copy the feedback.");
        return;
      }
      try {
        await navigator.clipboard.writeText(feedback);
        $("copyFeedbackBtn").textContent = "Feedback copied";
        window.setTimeout(() => {
          $("copyFeedbackBtn").textContent = "Copy feedback";
        }, 1400);
      } catch (error) {
        alert("Could not copy automatically. Please try again.");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initialisePage);
})();
