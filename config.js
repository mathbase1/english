(function (root, factory) {
  const config = factory();
  root.QUIZ_CONFIG = config;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = config;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  return {
    examLabel: "AQA GCSE English Language · Paper 1 Question 2",
    maxMark: 8,

    // ==================================
    // EASY TO SWAP / RECALIBRATE STARTS HERE
    // ==================================
    questionPrompt: "How does the writer use language here to describe Rosabel's bus journey home?",
    sourceExtract:
      "Rosabel looked out of the windows; the street was blurred and misty, but light striking on the panes turned their dullness to opal and silver, and the jewellers' shops seen through this were fairy palaces. Her feet were horribly wet, and she knew the bottom of her skirt and petticoat would be coated with black, greasy mud. There was a sickening smell of warm humanity - it seemed to be oozing out of everybody in the bus - and everybody had the same expression, sitting so still, staring in front of them. Rosabel stirred suddenly and unfastened the two top buttons of her coat... she felt almost stifled. Through her half-closed eyes, the whole row of people on the opposite seat seemed to resolve into one meaningless, staring face.",

    contentGroups: [
      {
        id: "outside_magic",
        label: "The outside world is transformed into something precious or magical.",
        terms: [
          "opal and silver",
          "fairy palaces",
          "turned their dullness",
          "light striking",
          "jewellers' shops",
          "blurred and misty",
          "outside world",
          "magical outside",
          "magical",
          "dreamlike",
          "precious",
          "glamorous"
        ],
        supportedMeanings: [
          "magical",
          "dreamlike",
          "precious",
          "beautiful",
          "temporary beauty",
          "brief escape",
          "escape",
          "imagination",
          "imaginative",
          "fantasy",
          "luxurious",
          "glamorous",
          "transformed",
          "momentary relief"
        ]
      },
      {
        id: "dirty_discomfort",
        label: "Rosabel is physically uncomfortable, dirty, and tired after the journey.",
        terms: [
          "horribly wet",
          "black greasy mud",
          "black, greasy mud",
          "greasy mud",
          "wet feet",
          "coated with mud",
          "mud",
          "dirty",
          "uncomfortable",
          "miserable",
          "tiring",
          "draining"
        ],
        supportedMeanings: [
          "wet",
          "dirty",
          "miserable",
          "cold",
          "uncomfortable",
          "unpleasant",
          "draining",
          "tiring",
          "exhausting",
          "physical discomfort",
          "physically uncomfortable"
        ]
      },
      {
        id: "smell_closeness",
        label: "The bus feels unpleasant because of smell, heat, and closeness.",
        terms: [
          "sickening smell",
          "warm humanity",
          "oozing",
          "almost stifled",
          "stifled",
          "smell",
          "heat",
          "closeness",
          "crowded",
          "overcrowded",
          "claustrophobic"
        ],
        supportedMeanings: [
          "overcrowded",
          "crowded",
          "sweaty",
          "suffocating",
          "claustrophobic",
          "stifling",
          "oppressive",
          "heavy",
          "overwhelmed",
          "unpleasant",
          "disgusting",
          "sickening"
        ]
      },
      {
        id: "blank_passengers",
        label: "The other passengers seem blank, lifeless, or dehumanised.",
        terms: [
          "same expression",
          "sitting so still",
          "staring in front of them",
          "one meaningless staring face",
          "one meaningless, staring face",
          "meaningless",
          "staring face",
          "dehumanised",
          "dehumanized",
          "identical",
          "lifeless",
          "expressionless",
          "blank",
          "robotic"
        ],
        supportedMeanings: [
          "lifeless",
          "robotic",
          "blank",
          "expressionless",
          "dehumanised",
          "dehumanized",
          "disconnected",
          "drained",
          "lost in the crowd",
          "meaningless",
          "identical",
          "bored"
        ]
      },
      {
        id: "contrast_inside_outside",
        label: "The writer shifts from beauty outside to grim reality inside the bus.",
        terms: [
          "contrast",
          "juxtaposition",
          "outside and inside",
          "beauty and ugliness",
          "glamour versus reality",
          "shift",
          "changes from",
          "in comparison",
          "but this only highlights",
          "outside world seem magical but"
        ],
        supportedMeanings: [
          "contrast",
          "difference",
          "beauty outside",
          "grim reality",
          "inside is unpleasant",
          "highlights how unpleasant the inside is",
          "outside seems magical but inside is horrible",
          "escape versus reality"
        ]
      },
      {
        id: "sentence_movement",
        label: "Punctuation or sentence movement helps show Rosabel's discomfort or drifting perspective.",
        terms: [
          "semicolon",
          "dash",
          "ellipsis",
          "long sentence",
          "sentence form",
          "clauses",
          "punctuation",
          "listing",
          "flow of the sentence",
          "sentence movement",
          "half-closed eyes"
        ],
        supportedMeanings: [
          "drifting perspective",
          "breathless",
          "overwhelming flow",
          "rushed",
          "lingering discomfort",
          "claustrophobic movement",
          "broken thought",
          "fragmented feeling"
        ]
      }
    ],

    highValueReferences: [
      "blurred and misty",
      "opal and silver",
      "fairy palaces",
      "horribly wet",
      "black, greasy mud",
      "black greasy mud",
      "sickening smell of warm humanity",
      "warm humanity",
      "oozing out of everybody",
      "everybody had the same expression",
      "same expression",
      "sitting so still",
      "felt almost stifled",
      "almost stifled",
      "one meaningless, staring face",
      "one meaningless staring face"
    ],

    salientExtractTerms: [
      "blurred",
      "misty",
      "opal",
      "silver",
      "fairy",
      "palaces",
      "wet",
      "black",
      "greasy",
      "mud",
      "sickening",
      "warm",
      "humanity",
      "oozing",
      "expression",
      "still",
      "staring",
      "stifled",
      "meaningless",
      "face"
    ],
    // ==================================
    // EASY TO SWAP / RECALIBRATE ENDS HERE
    // ==================================

    strongAnalyticalVerbs: [
      "suggests",
      "implies",
      "conveys",
      "reveals",
      "highlights",
      "emphasises",
      "emphasizes",
      "presents",
      "portrays",
      "underlines",
      "captures",
      "evokes",
      "reinforces",
      "reflects"
    ],

    weakAnalyticalVerbs: [
      "shows",
      "creates",
      "makes",
      "uses",
      "demonstrates",
      "describes",
      "is",
      "shows through",
      "shown through",
      "indicates"
    ],

    strongLinkPhrases: [
      "which suggests",
      "which implies",
      "which highlights",
      "which reveals",
      "highlighting how",
      "revealing how",
      "showing how",
      "almost like",
      "as if",
      "for a moment",
      "in comparison",
      "this highlights how",
      "this reveals",
      "this suggests",
      "this implies"
    ],

    hardUncertaintyPhrases: [
      "maybe",
      "might",
      "might be",
      "might suggest",
      "could be",
      "could suggest",
      "possibly",
      "perhaps",
      "i'm not sure",
      "im not sure",
      "it is hard to know",
      "hard to know",
      "not sure"
    ],

    certaintyPhrases: [
      "definitely",
      "certainly",
      "clearly",
      "obviously",
      "undoubtedly"
    ],

    comparisonTerms: [
      "however",
      "whereas",
      "although",
      "but",
      "while",
      "in contrast",
      "on the other hand",
      "compared with",
      "in comparison",
      "shifts",
      "changes",
      "turns"
    ],

    specificEffectTerms: [
      "magical",
      "dreamlike",
      "precious",
      "glamorous",
      "beautiful",
      "escape",
      "imagination",
      "temporary beauty",
      "unclear",
      "confusing",
      "tired",
      "draining",
      "miserable",
      "cold",
      "dirty",
      "uncomfortable",
      "unpleasant",
      "overcrowded",
      "sweaty",
      "suffocating",
      "claustrophobic",
      "stifling",
      "oppressive",
      "overwhelmed",
      "heavy",
      "lifeless",
      "robotic",
      "blank",
      "expressionless",
      "dehumanised",
      "dehumanized",
      "disconnected",
      "drained",
      "lost in the crowd",
      "meaningless",
      "grim",
      "bleak",
      "trapped",
      "drifting",
      "breathless"
    ],

    genericEffectPhrases: [
      "creates an effect",
      "has an effect on the reader",
      "creates a certain atmosphere",
      "contributes to the atmosphere",
      "creates atmosphere",
      "helps the reader imagine",
      "helps the reader picture the scene",
      "gives us an idea",
      "makes the scene vivid",
      "makes the journey seem vivid",
      "makes the journey seem real",
      "helps the reader understand",
      "used by the writer",
      "writer's technique",
      "the writer uses language",
      "the writer uses language throughout the extract",
      "language techniques",
      "descriptive language",
      "another example of imagery",
      "this contrast is effective",
      "this is effective",
      "this effect is important",
      "to create meaning",
      "trying to make the reader feel something",
      "to make the reader understand the situation",
      "to show what the journey is like",
      "to help the reader picture the scene",
      "atmosphere for the reader",
      "the language gives us an idea",
      "this makes the reader imagine something",
      "the writer is using language to create an effect",
      "this shows how the writer uses language"
    ],

    pseudoMethodPhrases: [
      "language techniques",
      "descriptive language",
      "writer's technique",
      "the writer uses language",
      "example of the writer using description",
      "the writer uses a lot of language techniques",
      "this is descriptive language",
      "this is language"
    ],

    featureSpottingTriggers: [
      "is imagery",
      "is an example of imagery",
      "the writer uses imagery",
      "the writer uses adjectives",
      "the writer uses an adjective",
      "the writer uses descriptive language",
      "the writer uses sensory language",
      "the writer uses the metaphor",
      "the writer uses contrast",
      "the writer uses a lot of language techniques",
      "the writer also uses",
      "this is another example of"
    ],

    unsupportedInterpretationPhrases: [
      "spiritual transformation",
      "emotional dirt",
      "society judging her",
      "judged by society",
      "symbolic transition",
      "existential emptiness",
      "corruption of society",
      "social corruption",
      "moral corruption",
      "the mud symbolises her emotions",
      "the mud symbolizes her emotions",
      "the windows are definitely a metaphor for transformation",
      "oppressive force of society",
      "inner purity",
      "loss of innocence"
    ],

    unsupportedAbstractTerms: [
      "spiritual",
      "existential",
      "morality",
      "corruption",
      "society",
      "judgement",
      "judgment",
      "purity",
      "innocence"
    ],

    circularReasoningPhrases: [
      "effective because it creates an effect",
      "important because it shows the writer's intention",
      "this shows the writer is trying to make the reader feel something",
      "the writer uses language to create meaning",
      "another effect on the reader",
      "this effect is important because",
      "shows the writer's intention to create an effect"
    ],

    methodRules: {
      imagery: {
        aliases: ["imagery"],
        supportedGroups: ["outside_magic", "dirty_discomfort", "smell_closeness", "blank_passengers"],
        supportedPhrases: [
          "blurred and misty",
          "opal and silver",
          "fairy palaces",
          "black, greasy mud",
          "sickening smell of warm humanity",
          "one meaningless, staring face"
        ],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: false
      },
      metaphor: {
        aliases: ["metaphor"],
        supportedGroups: ["outside_magic", "blank_passengers"],
        supportedPhrases: ["fairy palaces", "one meaningless, staring face"],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: false
      },
      "sensory language": {
        aliases: ["sensory language"],
        supportedGroups: ["dirty_discomfort", "smell_closeness"],
        supportedPhrases: ["horribly wet", "black, greasy mud", "sickening smell of warm humanity", "almost stifled"],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: false
      },
      contrast: {
        aliases: ["contrast", "juxtaposition"],
        supportedGroups: ["outside_magic", "dirty_discomfort", "smell_closeness", "blank_passengers", "contrast_inside_outside"],
        supportedPhrases: ["opal and silver", "fairy palaces", "black, greasy mud", "sickening smell of warm humanity"],
        requiresSpecificEffect: true,
        requiresComparison: true,
        lowValue: false,
        unsupportedByDefault: false
      },
      adjective: {
        aliases: ["adjective"],
        supportedGroups: ["outside_magic", "dirty_discomfort", "smell_closeness", "blank_passengers"],
        supportedPhrases: ["blurred and misty", "horribly wet", "black, greasy mud", "sickening smell", "meaningless, staring face"],
        requiresSpecificEffect: true,
        lowValue: true,
        unsupportedByDefault: false
      },
      verb: {
        aliases: ["verb"],
        supportedGroups: ["outside_magic", "smell_closeness", "blank_passengers"],
        supportedPhrases: ["turned", "oozing", "resolve"],
        requiresSpecificEffect: true,
        lowValue: true,
        unsupportedByDefault: false
      },
      noun: {
        aliases: ["noun"],
        supportedGroups: ["outside_magic", "blank_passengers"],
        supportedPhrases: ["palaces", "humanity", "face"],
        requiresSpecificEffect: true,
        lowValue: true,
        unsupportedByDefault: false
      },
      adverb: {
        aliases: ["adverb"],
        supportedGroups: ["blank_passengers", "smell_closeness"],
        supportedPhrases: ["suddenly"],
        requiresSpecificEffect: true,
        lowValue: true,
        unsupportedByDefault: false
      },
      listing: {
        aliases: ["listing", "list"],
        supportedGroups: ["dirty_discomfort", "smell_closeness", "sentence_movement"],
        supportedPhrases: ["horribly wet", "black, greasy mud", "sickening smell"],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: false
      },
      sentence: {
        aliases: ["sentence", "sentence form", "long sentence", "short sentence", "clauses", "clause"],
        supportedGroups: ["sentence_movement"],
        supportedPhrases: ["windows;", "humanity -", "coat..."],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: false
      },
      punctuation: {
        aliases: ["punctuation", "semicolon", "dash", "ellipsis", "pause", "caesura"],
        supportedGroups: ["sentence_movement"],
        supportedPhrases: [";", "-", "..."],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: false
      },
      symbolism: {
        aliases: ["symbolism", "symbol", "symbolises", "symbolizes", "represents"],
        supportedGroups: [],
        supportedPhrases: [],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: true
      },
      simile: {
        aliases: ["simile"],
        supportedGroups: [],
        supportedPhrases: [],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: true
      },
      personification: {
        aliases: ["personification"],
        supportedGroups: [],
        supportedPhrases: [],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: true
      },
      "pathetic fallacy": {
        aliases: ["pathetic fallacy"],
        supportedGroups: [],
        supportedPhrases: [],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: true
      },
      hyperbole: {
        aliases: ["hyperbole"],
        supportedGroups: [],
        supportedPhrases: [],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: true
      },
      alliteration: {
        aliases: ["alliteration", "sibilance", "assonance"],
        supportedGroups: [],
        supportedPhrases: [],
        requiresSpecificEffect: true,
        lowValue: false,
        unsupportedByDefault: true
      }
    },

    grammarSupport: {
      adjective: [
        "blurred",
        "misty",
        "dullness",
        "wet",
        "black",
        "greasy",
        "sickening",
        "warm",
        "same",
        "still",
        "meaningless"
      ],
      verb: ["turned", "oozing", "resolve", "stared", "stifled", "striking"],
      noun: ["palaces", "humanity", "expression", "face", "mud", "street"],
      adverb: ["suddenly"]
    },

    commonMisspellings: {
      becuase: "because",
      langauge: "language",
      sentance: "sentence",
      techinque: "technique",
      techniquese: "techniques",
      sugests: "suggests",
      implys: "implies",
      adjetive: "adjective",
      repetiton: "repetition",
      similie: "simile",
      metaphore: "metaphor",
      juxtoposition: "juxtaposition",
      allitration: "alliteration",
      claustraphobic: "claustrophobic",
      desribe: "describe"
    },

    strictness: {
      severeRetellRatio: 0.4,
      moderateRetellRatio: 0.25,
      genericHeavyRatio: 0.3,
      unsupportedCapMark: 4,
      severeUnsupportedCapMark: 3,
      contradictionCapMark: 6,
      severeContradictionCapMark: 4,
      l4MinGroundedSentences: 2,
      l4MinAnalyticalGroups: 2,
      l3MinGroundedOrClear: 2,
      l4MinEvidenceScore: 3,
      l3MinEvidenceScore: 2
    },

    domainDescriptors: {
      coverage: ["None", "Very narrow", "Some range", "Clear analytical range", "Selective range"],
      evidence: ["None", "Mentioned", "Relevant", "Apt", "Judicious"],
      analysis: ["None", "Simple", "Some explanation", "Clear analysis", "Detailed analysis", "Perceptive analysis"],
      methods: ["None", "One correct link", "Clear method links", "Integrated method analysis"],
      control: ["Unclear", "Weak control", "Relevant control", "Sustained control", "Secure control"]
    },

    levelDescriptors: [
      {
        level: "Level 4",
        marks: "7–8",
        summary: "Perceptive, accurate analysis. References are selective, effects are specific, and interpretation stays grounded in the extract. Any explicit method comments are correct and linked to effect."
      },
      {
        level: "Level 3",
        marks: "5–6",
        summary: "Clear, relevant explanation. References support points, effects are explained with some accuracy, and there are no major errors or speculative leaps."
      },
      {
        level: "Level 2",
        marks: "3–4",
        summary: "Some understanding and comment. The answer is relevant, but analysis is uneven, generic, or partly feature-spotted."
      },
      {
        level: "Level 1",
        marks: "1–2",
        summary: "Simple, limited comment. The answer tends to retell, list quotations, or make vague statements with little real analysis."
      },
      {
        level: "Level 0",
        marks: "0",
        summary: "No relevant or creditworthy response."
      }
    ],

    calibrationSet: [
      {
        name: "Test 1 · strong borderline L4",
        expectedMark: 7,
        answer:
          "Rosabel’s journey home is shown as uncomfortable and tiring. The writer says the street was “blurred and misty”, which makes it seem gloomy and unclear. The light turning the windows into “opal and silver” makes the outside world look magical for a moment, almost like she is escaping the bus in her imagination. Her feet are “horribly wet” and her clothes are covered in “black, greasy mud”, which shows how unpleasant and dirty the journey is for her.\n\nThe writer also describes the smell on the bus as a “sickening smell of warm humanity”, which suggests the bus is overcrowded and sweaty. Everyone is “staring in front of them”, which makes them seem lifeless and bored. Rosabel feels “almost stifled”, showing she is overwhelmed by the heat and the closeness of the people. At the end, the passengers turn into “one meaningless, staring face”, which shows how drained and disconnected she feels."
      },
      {
        name: "Test 2 · strong borderline L4",
        expectedMark: 7,
        answer:
          "The writer presents Rosabel’s journey as uncomfortable and draining. The street outside is described as “blurred and misty”, which makes everything seem unclear and confusing, almost like Rosabel is too tired to focus properly. The windows turning “opal and silver” make the outside world seem magical, but this only highlights how unpleasant the inside of the bus is in comparison.\n\nRosabel’s physical discomfort is shown through details like her feet being “horribly wet” and her clothes covered in “black, greasy mud”. This makes the reader imagine how cold and miserable she must feel. The “sickening smell of warm humanity” suggests the bus is overcrowded and sweaty, and the word “warm” makes the smell feel heavy and suffocating.\n\nThe passengers are described as “staring in front of them”, which makes them seem lifeless and robotic. Rosabel feels “almost stifled”, showing she is overwhelmed by the heat and the closeness of the people around her. At the end, the passengers become “one meaningless, staring face”, which suggests Rosabel feels disconnected from everyone and almost lost in the crowd."
      },
      {
        name: "Test 3 · feature-spotting / keyword stuffing",
        expectedMark: 3,
        answer:
          "The writer uses a lot of language techniques to show Rosabel’s journey. The description of the street being “blurred and misty” is imagery, and this creates an effect on the reader. The writer also uses contrast because the windows become “opal and silver”, which is another example of imagery that makes the reader imagine something. This contrast is effective.\n\nThe writer uses adjectives like “horribly wet” and “black, greasy mud”, which are descriptive language. This shows the writer is trying to make the reader feel something. The “sickening smell of warm humanity” is also language that creates an effect. The writer uses sensory language here.\n\nThe passengers are described with language techniques too. The phrase “staring in front of them” is an example of the writer using description. The writer also uses the metaphor “one meaningless, staring face”, which is effective because it makes the reader think about the effect of the language. This shows the writer is using language to create meaning."
      },
      {
        name: "Test 4 · quote listing / retelling",
        expectedMark: 2,
        answer:
          "The writer describes the street as “blurred and misty” and the windows as “opal and silver”. Rosabel’s feet are “horribly wet” and she has “black, greasy mud” on her clothes. The bus has a “sickening smell of warm humanity” and the passengers are “staring in front of them”. Rosabel feels “almost stifled” and at the end they become “one meaningless, staring face”.\n\nAll of these details show what the journey is like. The writer includes these descriptions to help the reader picture the scene. The language gives us an idea of the bus and the people on it. The writer uses these phrases to make the journey seem real and to show what Rosabel is experiencing."
      },
      {
        name: "Test 5 · long generic waffle",
        expectedMark: 3,
        answer:
          "The writer uses language throughout the extract to show Rosabel’s experience on the bus. The description of the street being “blurred and misty” is important because it creates a certain atmosphere for the reader. This atmosphere is part of the writer’s technique. The windows becoming “opal and silver” also contribute to the atmosphere, and this helps the reader imagine the scene more clearly.\n\nThe writer continues this descriptive approach with phrases like “horribly wet” and “black, greasy mud”. These words are chosen by the writer to make the reader think about the journey. The “sickening smell of warm humanity” is another example of the writer using language to create an effect. This effect is important because it shows the writer’s intention to make the reader understand the situation.\n\nThe passengers are described as “staring in front of them”, which is a technique used by the writer to show how they are feeling. The phrase “almost stifled” is also used by the writer to show Rosabel’s feelings. Finally, the writer uses the phrase “one meaningless, staring face” to create another effect on the reader. This shows how the writer uses language to make the journey seem vivid."
      },
      {
        name: "Test 6 · concise but strong",
        expectedMark: 7,
        answer:
          "The writer makes Rosabel’s bus journey feel both briefly beautiful and deeply unpleasant. The windows turning “opal and silver” and the jewellers’ shops becoming “fairy palaces” create a magical image of the outside world, almost as if she is escaping into fantasy for a moment. In contrast, details like “horribly wet”, “black, greasy mud” and the “sickening smell of warm humanity” drag the reader back to the dirty, claustrophobic reality inside the bus. By the end, the passengers seem to merge into “one meaningless, staring face”, which makes them seem dehumanised and shows how overwhelmed and disconnected Rosabel feels."
      }
    ]
  };
});
