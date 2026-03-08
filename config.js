(function (root, factory) {
  const bundle = factory();
  root.QUIZ_CONFIG = bundle.config;
  root.GCSE_RULES = bundle.rules;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = bundle.config;
    module.exports.__RULES__ = bundle.rules;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  return {
    config: {
  "examLabel": "AQA GCSE English Language · Paper 1 Question 2 (AO2)",
  "maxMark": 8,
  "questionPrompt": "How does the writer use language here to describe Rosabel's bus journey home?",
  "sourceExtract": "Rosabel looked out of the windows; the street was blurred and misty, but light striking on the panes turned their dullness to opal and silver, and the jewellers' shops seen through this were fairy palaces. Her feet were horribly wet, and she knew the bottom of her skirt and petticoat would be coated with black, greasy mud. There was a sickening smell of warm humanity - it seemed to be oozing out of everybody in the bus - and everybody had the same expression, sitting so still, staring in front of them. Rosabel stirred suddenly and unfastened the two top buttons of her coat... she felt almost stifled. Through her half-closed eyes, the whole row of people on the opposite seat seemed to resolve into one meaningless, staring face.",
  "developerQuestionBank": [
    {
      "id": "q1",
      "prompt": "How does the writer use language here to describe Rosabel's bus journey home?"
    },
    {
      "id": "q2",
      "prompt": "How does the writer use language to make the bus journey seem unpleasant and claustrophobic?"
    },
    {
      "id": "q3",
      "prompt": "How does the writer use language to contrast the world outside the bus with the people inside it?"
    },
    {
      "id": "q4",
      "prompt": "How does the writer use language to present Rosabel's feelings during the journey?"
    },
    {
      "id": "q5",
      "prompt": "How does the writer use language to make the passengers seem lifeless or dehumanised?"
    },
    {
      "id": "q6",
      "prompt": "How does the writer use language to suggest that the outside world is briefly more attractive than the bus?"
    },
    {
      "id": "q7",
      "prompt": "How does the writer use language to show that the bus is oppressive for Rosabel?"
    },
    {
      "id": "q8",
      "prompt": "How does the writer use language to present fantasy and reality in this extract?"
    },
    {
      "id": "q9",
      "prompt": "How does the writer use language to make the crowd seem overwhelming?"
    },
    {
      "id": "q10",
      "prompt": "How does the writer use language to show Rosabel's sense of discomfort and distance?"
    }
  ],
  "contentGroups": [
    {
      "id": "outside_view",
      "label": "The outside scene looks blurred, unclear, or gloomy.",
      "terms": [
        "blurred and misty",
        "blurred",
        "misty",
        "unclear",
        "confusing",
        "dreary",
        "gloomy",
        "hard to see"
      ],
      "supportedEffects": [
        "blurred",
        "misty",
        "unclear",
        "confusing",
        "gloomy",
        "dreary",
        "uncertain",
        "tired",
        "unfocused",
        "grey",
        "dull",
        "hard to see"
      ],
      "supportedInterpretations": [
        "too tired to focus",
        "vision is dulled",
        "outside seems unclear through Rosabel's tired perspective"
      ],
      "supportedMethods": [
        "imagery",
        "adjective"
      ]
    },
    {
      "id": "magical_outside",
      "label": "The outside world is briefly transformed into something precious or magical.",
      "terms": [
        "opal and silver",
        "fairy palaces",
        "precious",
        "magical",
        "dreamlike",
        "beautiful",
        "transformed",
        "outside world",
        "jewellers' shops",
        "jewellers shops",
        "luxurious",
        "unreal"
      ],
      "supportedEffects": [
        "magical",
        "dreamlike",
        "beautiful",
        "precious",
        "luxurious",
        "transformed",
        "glamorous",
        "shimmering",
        "fantastical",
        "idealised",
        "idealized",
        "unreal",
        "luxury",
        "otherworldly",
        "briefly beautiful"
      ],
      "supportedInterpretations": [
        "brief escape",
        "temporary beauty",
        "imagination",
        "fantasy",
        "escaping the bus",
        "momentary relief",
        "distance from wealth",
        "world outside seems more attractive",
        "outside feels luxurious",
        "escapism",
        "brief imaginative escape",
        "momentary fantasy"
      ],
      "supportedMethods": [
        "imagery",
        "metaphor",
        "contrast"
      ]
    },
    {
      "id": "physical_discomfort",
      "label": "Rosabel feels physically uncomfortable, dirty, cold, and miserable.",
      "terms": [
        "horribly wet",
        "black greasy mud",
        "black, greasy mud",
        "mud",
        "wet",
        "dirty",
        "miserable",
        "draining",
        "tiring",
        "greasy"
      ],
      "supportedEffects": [
        "wet",
        "cold",
        "dirty",
        "miserable",
        "uncomfortable",
        "unpleasant",
        "draining",
        "tiring",
        "grim",
        "grimy",
        "soaked",
        "degrading",
        "exhausting",
        "filthy",
        "physical discomfort"
      ],
      "supportedInterpretations": [
        "she feels worn down",
        "degrading",
        "degraded",
        "grim physical reality",
        "worn down",
        "exhausted"
      ],
      "supportedMethods": [
        "adjective",
        "sensory"
      ]
    },
    {
      "id": "smell_heat",
      "label": "The bus feels unpleasant because of smell, heat, and closeness.",
      "terms": [
        "sickening smell",
        "warm humanity",
        "oozing",
        "almost stifled",
        "stifled",
        "crowded",
        "overcrowded",
        "suffocating",
        "claustrophobic",
        "warm",
        "humanity",
        "oozing out of everybody"
      ],
      "supportedEffects": [
        "sickening",
        "disgusting",
        "crowded",
        "overcrowded",
        "sweaty",
        "suffocating",
        "claustrophobic",
        "stifling",
        "oppressive",
        "heavy",
        "overwhelming",
        "airless",
        "close",
        "cramped",
        "smothering",
        "inescapable"
      ],
      "supportedInterpretations": [
        "physical and emotional suffocation",
        "the atmosphere is oppressive",
        "the smell dominates the bus",
        "emotional suffocation",
        "trapped",
        "smothering",
        "bus presses in on her",
        "oppressive closeness",
        "inescapable atmosphere"
      ],
      "supportedMethods": [
        "sensory",
        "verb",
        "imagery"
      ]
    },
    {
      "id": "blank_passengers",
      "label": "The passengers seem blank, lifeless, or dehumanised.",
      "terms": [
        "same expression",
        "sitting so still",
        "staring in front of them",
        "one meaningless staring face",
        "one meaningless, staring face",
        "meaningless",
        "staring face",
        "lifeless",
        "robotic",
        "blank",
        "same expression",
        "merged together",
        "one face"
      ],
      "supportedEffects": [
        "blank",
        "lifeless",
        "robotic",
        "expressionless",
        "dehumanised",
        "dehumanized",
        "drained",
        "disconnected",
        "meaningless",
        "anonymous",
        "lost in the crowd",
        "merged together",
        "mechanical",
        "uniform",
        "merged",
        "all the same",
        "without individuality"
      ],
      "supportedInterpretations": [
        "people merge together",
        "Rosabel feels disconnected",
        "crowd seems anonymous",
        "lost in the crowd",
        "dehumanisation",
        "loss of individuality",
        "alienation",
        "loss of identity",
        "dehumanised crowd",
        "emotionally numbing"
      ],
      "supportedMethods": [
        "imagery",
        "metaphor",
        "contrast"
      ]
    }
  ],
  "contrastBridges": [
    [
      "magical_outside",
      "physical_discomfort"
    ],
    [
      "magical_outside",
      "smell_heat"
    ],
    [
      "magical_outside",
      "blank_passengers"
    ],
    [
      "outside_view",
      "smell_heat"
    ],
    [
      "outside_view",
      "magical_outside"
    ],
    [
      "magical_outside",
      "outside_view"
    ]
  ],
  "quoteBank": [
    {
      "id": "blurred_misty",
      "text": "blurred and misty",
      "group": "outside_view",
      "supportedEffects": [
        "blurred",
        "misty",
        "gloomy",
        "unclear",
        "confusing",
        "dreary",
        "tired",
        "unfocused",
        "dull"
      ],
      "supportedInterpretations": [
        "too tired to focus",
        "outside seems unclear",
        "vision is dulled"
      ],
      "supportedMethods": [
        "imagery",
        "adjective"
      ]
    },
    {
      "id": "opal_silver",
      "text": "opal and silver",
      "group": "magical_outside",
      "supportedEffects": [
        "magical",
        "beautiful",
        "precious",
        "dreamlike",
        "luxurious",
        "transformed",
        "shimmering"
      ],
      "supportedInterpretations": [
        "brief escape",
        "imagination",
        "temporary beauty",
        "distance from wealth",
        "outside feels luxurious"
      ],
      "supportedMethods": [
        "imagery",
        "metaphor"
      ]
    },
    {
      "id": "fairy_palaces",
      "text": "fairy palaces",
      "group": "magical_outside",
      "supportedEffects": [
        "magical",
        "fantasy",
        "beautiful",
        "dreamlike",
        "idealised",
        "idealized",
        "unreal"
      ],
      "supportedInterpretations": [
        "brief escape",
        "imagination",
        "escaping the bus",
        "fantasy",
        "distance from wealth",
        "escapism",
        "brief imaginative escape",
        "momentary fantasy"
      ],
      "supportedMethods": [
        "imagery",
        "metaphor"
      ]
    },
    {
      "id": "horribly_wet",
      "text": "horribly wet",
      "group": "physical_discomfort",
      "supportedEffects": [
        "wet",
        "cold",
        "miserable",
        "uncomfortable",
        "soaked"
      ],
      "supportedInterpretations": [
        "she feels worn down"
      ],
      "supportedMethods": [
        "adjective"
      ]
    },
    {
      "id": "black_greasy_mud",
      "text": "black, greasy mud",
      "group": "physical_discomfort",
      "supportedEffects": [
        "dirty",
        "grimy",
        "unpleasant",
        "messy",
        "grim",
        "draining",
        "degrading"
      ],
      "supportedInterpretations": [
        "she feels worn down",
        "degrading",
        "grim physical reality"
      ],
      "supportedMethods": [
        "adjective",
        "sensory"
      ]
    },
    {
      "id": "sickening_smell",
      "text": "sickening smell of warm humanity",
      "group": "smell_heat",
      "supportedEffects": [
        "sickening",
        "disgusting",
        "crowded",
        "sweaty",
        "suffocating",
        "claustrophobic",
        "stifling",
        "oppressive",
        "heavy"
      ],
      "supportedInterpretations": [
        "the atmosphere is oppressive",
        "the smell dominates the bus",
        "oppressive closeness"
      ],
      "supportedMethods": [
        "sensory",
        "imagery"
      ]
    },
    {
      "id": "oozing",
      "text": "oozing out of everybody",
      "group": "smell_heat",
      "supportedEffects": [
        "disgusting",
        "unpleasant",
        "inescapable",
        "overflowing",
        "oppressive"
      ],
      "supportedInterpretations": [
        "bus presses in on her",
        "the smell dominates the bus",
        "inescapable atmosphere"
      ],
      "supportedMethods": [
        "verb",
        "imagery"
      ]
    },
    {
      "id": "almost_stifled",
      "text": "almost stifled",
      "group": "smell_heat",
      "supportedEffects": [
        "suffocating",
        "overwhelmed",
        "claustrophobic",
        "trapped",
        "stifling"
      ],
      "supportedInterpretations": [
        "physical and emotional suffocation",
        "emotional suffocation",
        "smothering"
      ],
      "supportedMethods": [
        "verb"
      ]
    },
    {
      "id": "same_expression",
      "text": "same expression",
      "group": "blank_passengers",
      "supportedEffects": [
        "blank",
        "expressionless",
        "identical",
        "lifeless",
        "uniform"
      ],
      "supportedInterpretations": [
        "loss of individuality"
      ],
      "supportedMethods": [
        "imagery"
      ]
    },
    {
      "id": "staring_in_front",
      "text": "staring in front of them",
      "group": "blank_passengers",
      "supportedEffects": [
        "blank",
        "robotic",
        "lifeless",
        "bored",
        "mechanical"
      ],
      "supportedInterpretations": [
        "alienation"
      ],
      "supportedMethods": [
        "imagery"
      ]
    },
    {
      "id": "meaningless_face",
      "text": "one meaningless, staring face",
      "group": "blank_passengers",
      "supportedEffects": [
        "meaningless",
        "dehumanised",
        "dehumanized",
        "drained",
        "disconnected",
        "lost in the crowd",
        "merged together",
        "anonymous"
      ],
      "supportedInterpretations": [
        "people merge together",
        "Rosabel feels disconnected",
        "lost in the crowd",
        "dehumanisation",
        "loss of individuality",
        "alienation",
        "loss of identity",
        "emotionally numbing"
      ],
      "supportedMethods": [
        "imagery",
        "metaphor"
      ]
    }
  ],
  "conceptThreads": [
    {
      "id": "fantasy_escape",
      "label": "Fantasy / escape / luxury",
      "groups": [
        "magical_outside"
      ],
      "terms": [
        "brief escape",
        "temporary beauty",
        "imagination",
        "fantasy",
        "escaping the bus",
        "momentary relief",
        "distance from wealth",
        "outside feels luxurious",
        "escapism",
        "luxury",
        "luxurious",
        "wealth",
        "richer",
        "otherworldly"
      ]
    },
    {
      "id": "grim_reality",
      "label": "Grim physical reality",
      "groups": [
        "physical_discomfort"
      ],
      "terms": [
        "dirty",
        "wet",
        "cold",
        "miserable",
        "grim",
        "degrading",
        "physical discomfort",
        "worn down",
        "exhausted",
        "grimy",
        "filthy"
      ]
    },
    {
      "id": "claustrophobic_bus",
      "label": "Oppressive bus atmosphere",
      "groups": [
        "smell_heat"
      ],
      "terms": [
        "claustrophobic",
        "stifling",
        "oppressive",
        "overwhelming",
        "smothering",
        "suffocating",
        "airless",
        "cramped",
        "trapped",
        "inescapable",
        "pressing in"
      ]
    },
    {
      "id": "dehumanised_crowd",
      "label": "Dehumanisation / alienation",
      "groups": [
        "blank_passengers"
      ],
      "terms": [
        "dehumanisation",
        "dehumanised",
        "dehumanized",
        "alienation",
        "alienated",
        "loss of individuality",
        "loss of identity",
        "anonymous",
        "merged together",
        "lost in the crowd",
        "emotionally numbing",
        "robotic"
      ]
    },
    {
      "id": "contrast_fantasy_reality",
      "label": "Fantasy vs grim reality contrast",
      "groups": [
        "magical_outside",
        "physical_discomfort",
        "smell_heat"
      ],
      "terms": [
        "contrast",
        "however",
        "in contrast",
        "but",
        "undercut",
        "clash",
        "fantasy and grim reality",
        "outside and inside",
        "more attractive than",
        "briefly more beautiful",
        "return to reality",
        "underlines the difference"
      ]
    }
  ],
  "anchorComments": {
    "generic": [
      "the writer uses language to show the journey",
      "this creates an effect on the reader",
      "helps the reader imagine the scene",
      "the writer uses descriptive language",
      "this makes the journey seem real",
      "the writer uses language techniques"
    ],
    "clear": [
      "this makes the bus seem claustrophobic and unpleasant",
      "this makes them seem lifeless and drained",
      "this suggests the outside looks more attractive than the bus",
      "the mud shows how dirty and miserable the journey is",
      "the smell makes the bus feel crowded and oppressive",
      "the passengers seem blank and all the same",
      "the outside briefly looks magical which highlights how grim the bus is",
      "the final face image makes the crowd seem dehumanised"
    ],
    "developed": [
      "the outside briefly becomes magical, which suggests a moment of escape from the bus",
      "the contrast between the beautiful shops and the dirty bus highlights Rosabel's discomfort",
      "the final image dehumanises the passengers and makes Rosabel seem alienated from the crowd",
      "the smell and heat create a physically and emotionally suffocating atmosphere",
      "the description moves from fantasy into grim physical reality",
      "the outside offers a brief glimpse of beauty that Rosabel cannot really access",
      "the bus seems oppressive because the sensory detail closes in around Rosabel"
    ],
    "perceptive": [
      "the journey is shaped by a contrast between fantasy and grim reality",
      "ordinary streets are refracted into something luxurious and unreal before the bus closes in again",
      "the crowd resolves into a single dehumanised mass, making the journey emotionally numbing",
      "the pattern of transformation and collapse reveals a brief imaginative escape that cannot last",
      "the language sustains a conceptual thread of escapism versus oppressive reality",
      "the movement from beauty to bodily discomfort makes the journey feel both physically and emotionally oppressive"
    ],
    "unsupported": [
      "the mud symbolises the corruption of society",
      "the windows show a spiritual transformation",
      "she is hallucinating because she is so tired",
      "monsters or zombies are closing in on her",
      "something bad is going to happen"
    ],
    "weak": [
      "this shows it smells bad",
      "this makes it sound horrible",
      "the shops sound good and pretty",
      "this shows it is not very nice",
      "the people sound boring and blank",
      "this just shows the journey is bad",
      "the bus seems horrible",
      "this makes it sound bad for rosabel",
      "the journey is not very nice",
      "the writer shows it smells bad and horrible"
    ],
    "simple": [
      "this creates a gloomy atmosphere",
      "this makes the street hard to see clearly",
      "the mud makes the journey seem dirty and uncomfortable",
      "the smell feels overpowering and crowded",
      "this makes the bus seem claustrophobic",
      "the passengers seem lifeless and drained",
      "this makes the journey seem degrading",
      "the outside seems briefly beautiful before the bus feels grim again"
    ]
  },
  "calibrationCases": [
    {
      "id": "test01",
      "label": "Strong borderline Level 4",
      "expectedMark": 7,
      "answer": "Rosabel’s journey home is shown as uncomfortable and tiring. The writer says the street was \"blurred and misty\", which makes it seem gloomy and unclear. The light turning the windows into \"opal and silver\" makes the outside world look magical for a moment, almost like she is escaping the bus in her imagination. Her feet are \"horribly wet\" and her clothes are covered in \"black, greasy mud\", which shows how unpleasant and dirty the journey is for her.\n\nThe writer also describes the smell on the bus as a \"sickening smell of warm humanity\", which suggests the bus is overcrowded and sweaty. Everyone is \"staring in front of them\", which makes them seem lifeless and bored. Rosabel feels \"almost stifled\", showing she is overwhelmed by the heat and the closeness of the people. At the end, the passengers turn into \"one meaningless, staring face\", which shows how drained and disconnected she feels."
    },
    {
      "id": "test02",
      "label": "Clear strong response",
      "expectedMark": 7,
      "answer": "The writer presents Rosabel’s journey as uncomfortable and draining. The street outside is described as \"blurred and misty\", which makes everything seem unclear and confusing, almost like Rosabel is too tired to focus properly. The windows turning \"opal and silver\" make the outside world seem magical, but this only highlights how unpleasant the inside of the bus is in comparison.\n\nRosabel’s physical discomfort is shown through details like her feet being \"horribly wet\" and her clothes covered in \"black, greasy mud\". This makes the reader imagine how cold and miserable she must feel. The \"sickening smell of warm humanity\" suggests the bus is overcrowded and sweaty, and the word \"warm\" makes the smell feel heavy and suffocating.\n\nThe passengers are described as \"staring in front of them\", which makes them seem lifeless and robotic. Rosabel feels \"almost stifled\", showing she is overwhelmed by the heat and the closeness of the people around her. At the end, the passengers become \"one meaningless, staring face\", which suggests Rosabel feels disconnected from everyone and almost lost in the crowd."
    },
    {
      "id": "test03",
      "label": "Feature spotting / keyword stuffing",
      "expectedMark": 3,
      "answer": "The writer uses a lot of language techniques to show Rosabel’s journey. The description of the street being \"blurred and misty\" is imagery, and this creates an effect on the reader. The writer also uses contrast because the windows become \"opal and silver\", which is another example of imagery that makes the reader imagine something. This contrast is effective.\n\nThe writer uses adjectives like \"horribly wet\" and \"black, greasy mud\", which are descriptive language. This shows the writer is trying to make the reader feel something. The \"sickening smell of warm humanity\" is also language that creates an effect. The writer uses sensory language here.\n\nThe passengers are described with language techniques too. The phrase \"staring in front of them\" is an example of the writer using description. The writer also uses the metaphor \"one meaningless, staring face\", which is effective because it makes the reader think about the effect of the language. This shows the writer is using language to create meaning."
    },
    {
      "id": "test04",
      "label": "Quote listing / Level 1",
      "expectedMark": 2,
      "answer": "The writer describes the street as \"blurred and misty\" and the windows as \"opal and silver\". Rosabel’s feet are \"horribly wet\" and she has \"black, greasy mud\" on her clothes. The bus has a \"sickening smell of warm humanity\" and the passengers are \"staring in front of them\". Rosabel feels \"almost stifled\" and at the end they become \"one meaningless, staring face\".\n\nAll of these details show what the journey is like. The writer includes these descriptions to help the reader picture the scene. The language gives us an idea of the bus and the people on it. The writer uses these phrases to make the journey seem real and to show what Rosabel is experiencing."
    },
    {
      "id": "test05",
      "label": "Long generic waffle",
      "expectedMark": 3,
      "answer": "The writer uses language throughout the extract to show Rosabel’s experience on the bus. The description of the street being \"blurred and misty\" is important because it creates a certain atmosphere for the reader. This atmosphere is part of the writer’s technique. The windows becoming \"opal and silver\" also contribute to the atmosphere, and this helps the reader imagine the scene more clearly.\n\nThe writer continues this descriptive approach with phrases like \"horribly wet\" and \"black, greasy mud\". These words are chosen by the writer to make the reader think about the journey. The \"sickening smell of warm humanity\" is another example of the writer using language to create an effect. This effect is important because it shows the writer’s intention to make the reader understand the situation.\n\nThe passengers are described as \"staring in front of them\", which is a technique used by the writer to show how they are feeling. The phrase \"almost stifled\" is also used by the writer to show Rosabel’s feelings. Finally, the writer uses the phrase \"one meaningless, staring face\" to create another effect on the reader. This shows how the writer uses language to make the journey seem vivid."
    },
    {
      "id": "test06",
      "label": "Concise strong answer",
      "expectedMark": 7,
      "answer": "Rosabel’s journey feels grim but briefly dreamlike. The windows turn the shops into \"opal and silver\" and \"fairy palaces\", so the outside world seems magical for a moment, as if she can escape the dirty bus in her imagination. However, inside the bus her feet are \"horribly wet\" and the \"sickening smell of warm humanity\" makes the atmosphere claustrophobic and unpleasant. By the end, the passengers blur into \"one meaningless, staring face\", suggesting Rosabel feels drained and disconnected from the crowd."
    },
    {
      "id": "test07",
      "label": "Copied extract should be Level 0",
      "expectedMark": 0,
      "answer": "Rosabel looked out of the windows; the street was blurred and misty, but light striking on the panes turned their dullness to opal and silver, and the jewellers' shops seen through this were fairy palaces. Her feet were horribly wet, and she knew the bottom of her skirt and petticoat would be coated with black, greasy mud. There was a sickening smell of warm humanity - it seemed to be oozing out of everybody in the bus - and everybody had the same expression, sitting so still, staring in front of them. Rosabel stirred suddenly and unfastened the two top buttons of her coat... she felt almost stifled. Through her half-closed eyes, the whole row of people on the opposite seat seemed to resolve into one meaningless, staring face."
    },
    {
      "id": "test08",
      "label": "Strong Level 3 not quite Level 4",
      "expectedMark": 6,
      "answer": "Rosabel’s journey is presented as miserable and uncomfortable. \"Blurred and misty\" makes the street seem unclear and dull, while \"opal and silver\" briefly makes the outside look beautiful. This contrast shows that the world outside appears more attractive than the bus she is stuck in. Inside, \"horribly wet\" and \"black, greasy mud\" emphasise how dirty and unpleasant she feels. The \"sickening smell of warm humanity\" and the fact that she is \"almost stifled\" suggest the bus is crowded and suffocating. Finally, the people become \"one meaningless, staring face\", which makes them seem blank and lifeless."
    },
    {
      "id": "test09",
      "label": "Weak literal response should stay low",
      "expectedMark": 4,
      "answer": "The writer uses language to show the journey. \"Blurred and misty\" shows it is hard to see and \"opal and silver\" makes the scene sound good. \"Horribly wet\" and \"black, greasy mud\" show the journey is unpleasant. The bus has a \"sickening smell of warm humanity\" which creates an effect on the reader. At the end \"one meaningless, staring face\" shows the people are all the same."
    },
    {
      "id": "test10",
      "label": "Speculative unsupported answer",
      "expectedMark": 2,
      "answer": "The windows being \"opal and silver\" might maybe symbolise a spiritual transformation and the mud could be emotional dirt. It is hard to know, but perhaps the \"warm humanity\" could definitely represent society judging Rosabel. The face at the end could be a metaphor or maybe not."
    },
    {
      "id": "test11",
      "label": "Ordinary competent secure Level 3",
      "expectedMark": 6,
      "answer": "The writer makes the journey seem unpleasant. \"Blurred and misty\" creates a gloomy atmosphere outside, while \"opal and silver\" makes the shops sound more beautiful. This suggests the outside world seems better than the bus. Rosabel’s feet are \"horribly wet\" and her clothes are covered in \"black, greasy mud\", which makes her seem uncomfortable and miserable. The \"sickening smell of warm humanity\" also makes the bus feel crowded and nasty. At the end, \"one meaningless, staring face\" makes the passengers seem blank and all the same."
    },
    {
      "id": "test12",
      "label": "Quote then explain in adjacent sentences, high Level 3",
      "expectedMark": 6,
      "answer": "The passengers are described as \"staring in front of them\". This makes them seem lifeless and drained. Rosabel feels \"almost stifled\". This shows how oppressive and claustrophobic the bus is. The outside briefly looks like \"fairy palaces\". This suggests she imagines something more beautiful than the reality of the bus."
    },
    {
      "id": "test13",
      "label": "Brief but valid analysis, high Level 3",
      "expectedMark": 6,
      "answer": "\"Blurred and misty\" creates a gloomy atmosphere and makes the outside seem unclear. \"Sickening smell of warm humanity\" makes the bus feel disgusting and overcrowded. \"One meaningless, staring face\" suggests the passengers lose their individuality and seem lifeless."
    },
    {
      "id": "test14",
      "label": "Genuinely perceptive top-band response",
      "expectedMark": 8,
      "answer": "The writer turns Rosabel’s journey into a clash between fantasy and grim reality. Through the misted windows the jewellers’ shops become \"opal and silver\" and \"fairy palaces\", so ordinary streets are refracted into something luxurious and unreal. This momentary transformation feels like a brief escape into imagination, which makes the return to her body even harsher: she is \"horribly wet\" and coated in \"black, greasy mud\". Inside the bus, the \"sickening smell of warm humanity\" and the verb \"oozing\" make the passengers feel oppressively close, as if the atmosphere itself is suffocating her. By the end, the crowd resolving into \"one meaningless, staring face\" strips people of individuality altogether, so Rosabel’s view becomes not just tired but dehumanised and emotionally numbed."
    },
    {
      "id": "test15",
      "label": "Loose terminology but sound interpretation, low Level 4",
      "expectedMark": 7,
      "answer": "The writer uses imagery when the shops become \"fairy palaces\", because it makes the outside seem magical and far better than the bus Rosabel is stuck on. The phrase \"black, greasy mud\" shows how grim and dirty the journey is. The bus also feels oppressive because of the \"sickening smell of warm humanity\" and because Rosabel feels \"almost stifled\". At the end, the passengers seem to blur into \"one meaningless, staring face\", which suggests she feels alienated from the people around her."
    },
    {
      "id": "test16",
      "label": "Mixed response with enough clear and developed analysis",
      "expectedMark": 6,
      "answer": "The writer uses language to show the journey. \"Blurred and misty\" shows the street is hard to see, but it also creates a gloomy feeling. \"Opal and silver\" makes the windows seem beautiful for a moment, which contrasts with how unpleasant the bus is. Her feet are \"horribly wet\" and there is a \"sickening smell of warm humanity\", so the journey feels miserable and cramped. The people become \"one meaningless, staring face\", which makes them seem blank."
    },
    {
      "id": "test17",
      "label": "Blank response",
      "expectedMark": 0,
      "answer": ""
    },
    {
      "id": "test18",
      "label": "Incomplete fragment",
      "expectedMark": 0,
      "answer": "blurred and misty because"
    },
    {
      "id": "test19",
      "label": "Near copied with one generic line",
      "expectedMark": 0,
      "answer": "Rosabel looked out of the windows and the street was blurred and misty. The panes turned their dullness to opal and silver and the shops were fairy palaces. Her feet were horribly wet and her skirt had black, greasy mud. There was a sickening smell of warm humanity and everybody had the same expression. This shows what the journey is like."
    },
    {
      "id": "test20",
      "label": "Good response but not sustained enough for 7",
      "expectedMark": 6,
      "answer": "The writer shows that the bus is miserable and claustrophobic. The \"sickening smell of warm humanity\" and the fact Rosabel feels \"almost stifled\" make the bus seem suffocating. The passengers are \"staring in front of them\", which makes them seem lifeless. Although the shops look like \"fairy palaces\", this only briefly suggests a more beautiful world outside."
    },
    {
      "id": "test21",
      "label": "Wrong simile label but otherwise clear mid/high Level 3",
      "expectedMark": 6,
      "answer": "\"Opal and silver\" is called a simile here, but the more important point is that it makes the outside world seem briefly magical and attractive. This contrasts with the \"black, greasy mud\" and shows the journey feels dirty and miserable. The \"sickening smell of warm humanity\" also makes the bus seem oppressive and crowded."
    },
    {
      "id": "test22",
      "label": "Invented hallucination reading",
      "expectedMark": 2,
      "answer": "The writer shows Rosabel is hallucinating because she is so tired. The windows becoming \"opal and silver\" prove she is seeing things and the face at the end suggests monsters or zombies closing in on her. This means something bad is going to happen."
    },
    {
      "id": "test23",
      "label": "Mixed answer with one over-interpretive leap but still clear overall",
      "expectedMark": 5,
      "answer": "\"Blurred and misty\" makes the street seem gloomy and unclear. \"Fairy palaces\" suggests the outside looks magical for a moment. However, the mud might show she is poor and struggling in life. The \"sickening smell of warm humanity\" makes the bus feel crowded and unpleasant."
    },
    {
      "id": "test24",
      "label": "Quote then explanation across three linked points, high Level 3",
      "expectedMark": 6,
      "answer": "The passengers are \"staring in front of them\". This makes them seem lifeless and drained. Rosabel feels \"almost stifled\". This shows the bus is oppressive and claustrophobic. The outside looks like \"fairy palaces\". This suggests she imagines something more beautiful than the reality around her."
    },
    {
      "id": "test25",
      "label": "Long quote but clear enough mid Level 3",
      "expectedMark": 5,
      "answer": "The writer says there was a \"sickening smell of warm humanity - it seemed to be oozing out of everybody in the bus\", which makes the atmosphere feel disgusting and overcrowded. Rosabel also feels \"almost stifled\", so the bus seems suffocating. The people are \"staring in front of them\", which makes them sound blank and lifeless."
    },
    {
      "id": "test26",
      "label": "Loose terminology but strong grounded reading, top-end concise response",
      "expectedMark": 8,
      "answer": "The writer turns the outside into a moment of fantasy when the jewellers' shops become \"opal and silver\" and \"fairy palaces\". Even if a student loosely calls this imagery or a metaphor, the important effect is that Rosabel briefly escapes into something more luxurious and unreal. That makes the return to \"black, greasy mud\" and the \"sickening smell of warm humanity\" feel even more degrading. By the end, the passengers blur into \"one meaningless, staring face\", which suggests dehumanisation and Rosabel's alienation from the crowd."
    },
    {
      "id": "test27",
      "label": "Short competent high Level 3",
      "expectedMark": 6,
      "answer": "\"Blurred and misty\" makes the street seem gloomy, while \"opal and silver\" briefly makes it look beautiful. The \"sickening smell of warm humanity\" and \"almost stifled\" make the bus seem claustrophobic. \"One meaningless, staring face\" makes the passengers seem lifeless and all the same."
    },
    {
      "id": "test28",
      "label": "Messy low Level 2",
      "expectedMark": 3,
      "answer": "The writer uses language to show the journey. The street is \"blurred and misty\" which shows it is hard to see and a bit gloomy. The bus smells bad and the people stare in front of them. This makes it horrible for Rosabel. At the end they are like one face."
    },
    {
      "id": "test29",
      "label": "Mostly good with one wrong method label",
      "expectedMark": 6,
      "answer": "\"Blurred and misty\" creates a gloomy atmosphere, while \"fairy palaces\" makes the outside look magical and distant from Rosabel's reality. Calling \"opal and silver\" a simile is slightly loose, but the main point is that the outside seems precious compared with the filthy bus. The \"sickening smell of warm humanity\" and \"almost stifled\" suggest an oppressive, claustrophobic atmosphere. Finally, \"one meaningless, staring face\" makes the passengers seem dehumanised."
    },
    {
      "id": "test30",
      "label": "Confident feature spotting should stay low",
      "expectedMark": 3,
      "answer": "The writer expertly uses imagery, adjectives, contrast and metaphor to create an effect. \"Blurred and misty\" is imagery, \"opal and silver\" is a simile, and \"one meaningless, staring face\" is a metaphor that makes the reader imagine something. This is very effective because the writer uses language to create meaning throughout."
    },
    {
      "id": "test31",
      "label": "Strong answer with mild hedge still top Level 4",
      "expectedMark": 7,
      "answer": "The writer presents the bus as physically and emotionally suffocating. The \"sickening smell of warm humanity\" and Rosabel feeling \"almost stifled\" perhaps suggest that the atmosphere is inescapable as well as unpleasant, so the journey feels oppressive. In contrast, the jewellers' shops become \"opal and silver\" and \"fairy palaces\", creating a brief fantasy of beauty and wealth outside the bus. By the end, the passengers resolve into \"one meaningless, staring face\", which conveys dehumanisation and Rosabel's alienation from the crowd."
    },
    {
      "id": "test32",
      "label": "True 8 with pattern and contrast sustained",
      "expectedMark": 8,
      "answer": "The description of the journey is built around a pattern of distortion. Through the wet windows the outside world is transformed into \"opal and silver\" and \"fairy palaces\", so Rosabel momentarily sees wealth and beauty in an idealised, almost unreal way. That fantasy is immediately undercut by the texture of her own body and clothes: she is \"horribly wet\" and covered in \"black, greasy mud\", which drags the reader back into grim physical discomfort. Inside the bus, the \"sickening smell of warm humanity\" and the verb \"oozing\" make the crowd feel oppressively close, as though the atmosphere itself is pressing in on her. The final image of \"one meaningless, staring face\" completes the movement from individual people to a single dehumanised mass, so Rosabel's journey becomes not only unpleasant but emotionally numbing and alienating."
    },
    {
      "id": "test33",
      "label": "Generic opening but strong body",
      "expectedMark": 6,
      "answer": "The writer uses language to show Rosabel's journey home. However, the answer becomes much more developed when the shops are seen as \"opal and silver\" and \"fairy palaces\", because this reflects how the outside world briefly seems luxurious and unreal compared with the grim bus. The dirty detail of \"black, greasy mud\" then mirrors the uncomfortable reality she cannot escape. The \"sickening smell of warm humanity\" and Rosabel feeling \"almost stifled\" convey a claustrophobic atmosphere, while the final \"one meaningless, staring face\" suggests the passengers have lost individuality."
    },
    {
      "id": "test34",
      "label": "Sustained conceptual thread concise",
      "expectedMark": 7,
      "answer": "A thread of escape runs through the description. The windows transform the shops into \"opal and silver\" and \"fairy palaces\", so Rosabel briefly imagines a richer, more beautiful world beyond the bus. That idea is then undercut by the physical reality of being \"horribly wet\" and by the \"sickening smell of warm humanity\", which makes the bus feel oppressive and degrading. When the passengers become \"one meaningless, staring face\", the journey seems to end in dehumanisation rather than relief."
    },
    {
      "id": "test35",
      "label": "Two clear points only",
      "expectedMark": 4,
      "answer": "The writer makes the bus seem unpleasant through the \"sickening smell of warm humanity\", which sounds disgusting and overcrowded. Also, \"one meaningless, staring face\" makes the passengers seem blank and lifeless. So overall the journey seems bad for Rosabel."
    },
    {
      "id": "test36",
      "label": "One perceptive moment but uneven overall",
      "expectedMark": 5,
      "answer": "The writer uses language to describe the journey. \"Blurred and misty\" shows the street is not clear. More interestingly, when the shops become \"fairy palaces\" it hints that Rosabel escapes into fantasy for a moment. After that, though, the bus is dirty and smells bad, and the people stare in front of them, which makes the journey seem horrible."
    },
    {
      "id": "test37",
      "label": "Valid analysis plus one social-symbolic leap",
      "expectedMark": 4,
      "answer": "\"Blurred and misty\" creates a gloomy atmosphere and \"fairy palaces\" makes the outside seem magical for a second. The mud maybe symbolises the corruption of society, which is a bit extreme, but the \"sickening smell of warm humanity\" still makes the bus feel crowded and unpleasant. At the end the passengers seem blank because they become \"one meaningless, staring face\"."
    },
    {
      "id": "test38",
      "label": "Method spotting with one accurate effect",
      "expectedMark": 4,
      "answer": "The writer uses imagery in \"blurred and misty\" and a metaphor in \"fairy palaces\". Although this is mainly just technique, it does make the outside seem magical and distant from the bus. The writer also uses descriptive language in \"black, greasy mud\" and sensory language in the smell detail."
    },
    {
      "id": "test39",
      "label": "Implicit analysis verbs and grounded thread",
      "expectedMark": 7,
      "answer": "The contrast between inside and outside mirrors Rosabel's state of mind. The jewellers' shops seen as \"opal and silver\" and \"fairy palaces\" reflect a brief pull towards beauty and escapism, while the \"black, greasy mud\" on her clothes drags the description back into something grim and physical. The \"sickening smell of warm humanity\" conveys how oppressive the bus feels, and the final \"one meaningless, staring face\" reveals a loss of individuality in the crowd."
    },
    {
      "id": "test40",
      "label": "Fluent but mainly clear not conceptual",
      "expectedMark": 6,
      "answer": "Rosabel's bus journey is described as unpleasant from beginning to end. The outside is \"blurred and misty\", but it also becomes \"opal and silver\", which makes it sound more attractive than the bus. Rosabel is then shown as uncomfortable through \"horribly wet\" and \"black, greasy mud\". The bus itself feels disgusting because of the \"sickening smell of warm humanity\" and because she is \"almost stifled\". Finally, \"one meaningless, staring face\" makes the passengers sound blank and all the same."
    },
    {
      "id": "test41",
      "label": "One long paragraph but valid mid Level 3",
      "expectedMark": 5,
      "answer": "The writer describes the journey as very unpleasant because Rosabel is \"horribly wet\" and covered in \"black, greasy mud\", which makes her seem miserable and uncomfortable, and the bus is made worse by the \"sickening smell of warm humanity\", which suggests it is hot, crowded and hard to escape from, while the people \"staring in front of them\" seem lifeless and blank, so the whole atmosphere feels draining for her."
    },
    {
      "id": "test42",
      "label": "Strong dehumanisation thread",
      "expectedMark": 7,
      "answer": "The writer gradually removes individuality from the passengers. At first they all have the \"same expression\" and are \"staring in front of them\", which makes them seem robotic and emotionally empty. By the end they resolve into \"one meaningless, staring face\", so the crowd becomes a single dehumanised mass. That disturbing image sits against Rosabel feeling \"almost stifled\", which suggests the oppressive bus is crushing any sense of individuality."
    },
    {
      "id": "test43",
      "label": "Overlong quotations but sensible commentary",
      "expectedMark": 5,
      "answer": "The writer says there was a \"sickening smell of warm humanity - it seemed to be oozing out of everybody in the bus - and everybody had the same expression\", which makes the bus sound crowded, unpleasant and overwhelming. Even though that quotation is long, it still suggests the people seem lifeless and the atmosphere feels oppressive. The outside briefly looks like \"fairy palaces\", which shows Rosabel imagines something nicer than the journey she is actually having."
    },
    {
      "id": "test44",
      "label": "Neutral linking sentences around good analysis",
      "expectedMark": 6,
      "answer": "At first, the writer focuses on what Rosabel can see. \"Blurred and misty\" makes the street seem gloomy and unclear. Then the outside changes as the shops become \"opal and silver\" and \"fairy palaces\", which suggests a brief fantasy of beauty. Later, attention shifts back to the bus itself. The \"sickening smell of warm humanity\" and Rosabel feeling \"almost stifled\" make the bus seem claustrophobic and oppressive. Finally, the passengers become \"one meaningless, staring face\", which conveys dehumanisation."
    },
    {
      "id": "test45",
      "label": "Poor grammar but grounded ideas, solid Level 3",
      "expectedMark": 6,
      "answer": "the bus is shown as horrible because of the \"sickening smell of warm humanity\" and rosabel feels \"almost stifled\" so it feels claustrophobic. also \"blurred and misty\" makes outside look dull but \"fairy palaces\" makes it look magical for a second. at the end \"one meaningless, staring face\" makes everyone seem lifeless and all merged together."
    },
    {
      "id": "test46",
      "label": "Unsupported poverty and nightmare reading",
      "expectedMark": 2,
      "answer": "The mud shows she is poor and struggling in life, and the bus becomes like a nightmare. The face at the end is dangerous and shows something bad is going to happen. This could mean the whole bus is like monsters closing in on her."
    },
    {
      "id": "test47",
      "label": "Narrow but developed focus on the outside world",
      "expectedMark": 5,
      "answer": "The outside world is described as \"opal and silver\" and \"fairy palaces\", which makes it seem magical and unreal. This suggests Rosabel imagines something more beautiful beyond the bus. However, because the answer only really focuses on this part, it does not fully explore the rest of the journey."
    },
    {
      "id": "test48",
      "label": "Narrow but strong claustrophobia focus",
      "expectedMark": 5,
      "answer": "The description of the bus itself is very effective. The \"sickening smell of warm humanity\" and Rosabel feeling \"almost stifled\" create a claustrophobic atmosphere, as if the bus is closing in on her. The passengers \"staring in front of them\" also seem lifeless, which adds to the oppressive mood. Even though the response is narrow, the analysis that is there is clear and relevant."
    },
    {
      "id": "test49",
      "label": "Fake perceptive academic tone",
      "expectedMark": 3,
      "answer": "The lexical field of sensory detail creates an evocative atmosphere. \"Blurred and misty\" is clearly imagery and \"opal and silver\" is a simile that foregrounds a motif of transition. This is effective because it positions the reader to appreciate the writer's intentions and the overall effect of the language."
    },
    {
      "id": "test50",
      "label": "Sustained genuine low Level 4 with continuity",
      "expectedMark": 7,
      "answer": "The language keeps moving between illusion and bodily discomfort, which is what makes the journey feel so vivid. Through the wet panes the shops are reframed as \"opal and silver\" and \"fairy palaces\", so Rosabel momentarily sees the outside as luxurious, unreal and far removed from the bus she is trapped in. That imagined beauty is immediately checked by the texture of her own experience: she is \"horribly wet\" and marked by \"black, greasy mud\", details that make the journey feel grimly physical and degrading. Inside the bus, the \"sickening smell of warm humanity\" and the verb \"oozing\" suggest a closeness that is almost invasive, especially once Rosabel feels \"almost stifled\". The ending, where the passengers resolve into \"one meaningless, staring face\", completes the pattern by turning separate people into a single dehumanised image, so the journey becomes not just unpleasant but emotionally numbing and alienating."
    }
  ],
  "levelDescriptors": {
    "Level 0": "No creditworthy response / copied extract / blank / not an answer.",
    "Level 1": "Simple or limited comments; mostly listing, paraphrase, or generic statement.",
    "Level 2": "Some relevant explanation, but often basic, literal, or weakly developed.",
    "Level 3": "Clear, relevant analysis with apt evidence, though not sustained enough for top band.",
    "Level 4": "Sustained, grounded, perceptive analysis with selective evidence and developed interpretation."
  }
},
    rules: {
  "analysisVerbsStrong": [
    "suggests",
    "implies",
    "reveals",
    "highlights",
    "emphasises",
    "emphasizes",
    "presents",
    "portrays",
    "conveys",
    "reflects",
    "reinforces",
    "indicates",
    "demonstrates",
    "shows how",
    "shown through",
    "highlighting",
    "revealing",
    "suggesting",
    "this highlights how",
    "this suggests that",
    "this implies that",
    "this reveals",
    "this presents",
    "hints at",
    "points to",
    "echoes",
    "captures",
    "frames",
    "casts",
    "positions",
    "evokes",
    "mirrors",
    "underlines",
    "underscores",
    "undercuts",
    "reveals how",
    "conveys how",
    "reflecting",
    "mirroring",
    "conveying",
    "frames the journey as",
    "turns the journey into"
  ],
  "analysisVerbsWeak": [
    "shows",
    "creates",
    "makes",
    "tells us",
    "gives",
    "uses",
    "shows that",
    "makes it seem",
    "this means",
    "this shows",
    "we can see",
    "this tells us",
    "this makes",
    "this suggests",
    "this conveys",
    "this presents",
    "this reflects",
    "this reveals",
    "this mirrors",
    "this hints at",
    "this makes the bus seem",
    "this makes them seem",
    "this makes the journey seem",
    "this just shows"
  ],
  "interpretivePhrases": [
    "as if",
    "almost like",
    "for a moment",
    "briefly",
    "which suggests",
    "suggesting that",
    "showing how",
    "making rosabel feel",
    "too tired to focus",
    "lost in the crowd",
    "brief escape",
    "temporary beauty",
    "in comparison",
    "however",
    "whereas",
    "in contrast",
    "as though",
    "this hints that",
    "this implies that",
    "momentary relief",
    "distance from wealth",
    "more attractive than",
    "more beautiful than",
    "outside world seems",
    "inside the bus feels",
    "returns to reality",
    "briefly escapes",
    "pull towards beauty",
    "cannot last",
    "turns into"
  ],
  "comparisonTerms": [
    "however",
    "whereas",
    "in contrast",
    "but",
    "yet",
    "on the other hand",
    "in comparison",
    "while",
    "compared with",
    "contrasts with",
    "undercuts"
  ],
  "writerChoicePhrases": [
    "the word",
    "the phrase",
    "the verb",
    "the adjective",
    "the image",
    "the description",
    "the choice of",
    "by describing",
    "by using",
    "turns the",
    "makes the outside world seem",
    "the verb \"oozing\"",
    "the word \"warm\"",
    "the image of",
    "the final image",
    "the detail of"
  ],
  "specificEffectTerms": [
    "magical",
    "dreamlike",
    "beautiful",
    "precious",
    "luxurious",
    "transformed",
    "gloomy",
    "unclear",
    "confusing",
    "dreary",
    "cold",
    "dirty",
    "miserable",
    "uncomfortable",
    "unpleasant",
    "grim",
    "sickening",
    "disgusting",
    "crowded",
    "overcrowded",
    "sweaty",
    "suffocating",
    "claustrophobic",
    "stifling",
    "oppressive",
    "heavy",
    "overwhelming",
    "lifeless",
    "robotic",
    "blank",
    "expressionless",
    "dehumanised",
    "dehumanized",
    "drained",
    "disconnected",
    "anonymous",
    "meaningless",
    "escape",
    "imagination",
    "fantasy",
    "brief escape",
    "temporary beauty",
    "lost in the crowd",
    "merged together",
    "bored",
    "trapped",
    "alienated",
    "alienation",
    "luxury",
    "numb",
    "numbed",
    "idealised",
    "idealized",
    "escapism",
    "loss of identity",
    "degrading",
    "degraded",
    "smothering",
    "otherworldly",
    "filthy",
    "grimy",
    "airless",
    "invasive"
  ],
  "highResolutionEffectTerms": [
    "dreamlike",
    "precious",
    "luxurious",
    "temporary beauty",
    "brief escape",
    "claustrophobic",
    "stifling",
    "oppressive",
    "overwhelming",
    "dehumanised",
    "dehumanized",
    "disconnected",
    "anonymous",
    "lifeless",
    "robotic",
    "meaningless",
    "trapped",
    "lost in the crowd",
    "fantasy",
    "imagination",
    "drained",
    "merged together",
    "alienation",
    "dehumanisation",
    "dehumanization",
    "distance from wealth",
    "momentary relief",
    "physical and emotional suffocation",
    "loss of individuality",
    "escapism",
    "smothering",
    "otherworldly",
    "grim physical reality",
    "oppressive closeness",
    "emotionally numbing"
  ],
  "literalEffectTerms": [
    "gloomy",
    "unclear",
    "confusing",
    "cold",
    "dirty",
    "miserable",
    "uncomfortable",
    "unpleasant",
    "grim",
    "crowded",
    "overcrowded",
    "sweaty",
    "sickening",
    "heavy",
    "blank",
    "bored",
    "tiring",
    "draining",
    "wet",
    "hard to see",
    "all the same",
    "bad",
    "nasty"
  ],
  "genericEffectPhrasesSevere": [
    "creates an effect",
    "create an effect",
    "this is effective",
    "helps the reader imagine",
    "helps the reader picture",
    "helps the reader to picture",
    "makes the reader imagine something",
    "makes the reader think",
    "used by the writer",
    "language techniques",
    "descriptive language",
    "sensory language",
    "this creates meaning",
    "this effect is important",
    "contributes to the atmosphere",
    "creates a certain atmosphere",
    "writer uses language",
    "writer uses these phrases",
    "make the journey seem real",
    "make the journey seem vivid",
    "this shows the writer is trying to make the reader feel something",
    "language that creates an effect",
    "another effect on the reader",
    "part of the writer's technique",
    "a certain atmosphere",
    "used to show how they are feeling",
    "shows it is",
    "shows the journey is",
    "gives us an idea of",
    "shows what the journey is like",
    "makes it sound good",
    "this is part of the writer's technique",
    "used throughout the extract"
  ],
  "genericFramesMild": [
    "the writer uses language",
    "the writer uses language to show",
    "the writer presents",
    "the writer describes",
    "this shows",
    "this means",
    "this makes",
    "the writer uses",
    "the writer includes",
    "the writer shows",
    "the writer makes",
    "the writer says",
    "the writer talks about",
    "the writer then",
    "overall the writer",
    "the writer uses language to",
    "the writer uses language throughout",
    "the writer uses language here"
  ],
  "genericOpenings": [
    "the writer uses language to show",
    "the writer uses language throughout",
    "the writer uses a lot of language techniques",
    "the writer uses a lot of language",
    "the writer uses a lot of techniques",
    "the writer presents rosabel's journey",
    "the writer describes rosabel's journey",
    "the writer uses language here",
    "the writer makes the journey seem",
    "the writer shows rosabel's journey"
  ],
  "featureSpottingPhrases": [
    "is imagery",
    "is a metaphor",
    "uses imagery",
    "uses contrast",
    "uses adjectives",
    "uses sensory language",
    "example of imagery",
    "example of the writer using",
    "descriptive language",
    "language techniques",
    "writer uses description",
    "writer uses language",
    "this is imagery",
    "this is a metaphor",
    "this is descriptive language",
    "this is sensory language",
    "the writer uses a technique",
    "this is an example of",
    "this is a simile",
    "this is personification",
    "this is effective because",
    "this creates meaning",
    "this makes the reader imagine"
  ],
  "softHedges": [
    "might",
    "could",
    "perhaps",
    "maybe",
    "may",
    "possibly"
  ],
  "hardUncertainty": [
    "i'm not sure",
    "i am not sure",
    "hard to know",
    "it is hard to know",
    "not sure",
    "maybe not",
    "could be",
    "or maybe not"
  ],
  "certaintyTerms": [
    "definitely",
    "clearly",
    "obviously",
    "certainly",
    "undoubtedly"
  ],
  "contradictionPatterns": [
    [
      "definitely",
      "maybe"
    ],
    [
      "clearly",
      "hard to know"
    ],
    [
      "certainly",
      "perhaps"
    ],
    [
      "is a metaphor",
      "maybe not"
    ],
    [
      "is definitely",
      "could be"
    ],
    [
      "obviously",
      "not sure"
    ]
  ],
  "unsupportedInterpretationPhrases": [
    "spiritual transformation",
    "emotional dirt",
    "society judging her",
    "oppressive force",
    "symbolic transition",
    "existential emptiness",
    "corruption of society",
    "social corruption",
    "judgement of society",
    "judgment of society",
    "spiritual journey",
    "society is attacking her",
    "the mud symbolises",
    "the mud symbolizes",
    "the windows are definitely a metaphor for transformation",
    "hallucinating",
    "hallucination",
    "nightmare",
    "trapped in a nightmare",
    "monsters",
    "zombies",
    "something bad is going to happen",
    "poor and struggling in life",
    "dangerous",
    "end of the world",
    "social criticism",
    "social critique",
    "moral corruption"
  ],
  "unsupportedAbstractTerms": [
    "spiritual",
    "existential",
    "society",
    "corruption",
    "judgement",
    "judgment",
    "symbolic transition",
    "social criticism",
    "social critique",
    "emotional dirt",
    "oppressive force",
    "hallucinating",
    "nightmare",
    "zombies",
    "monsters",
    "poverty",
    "poor",
    "dangerous"
  ],
  "nonAnswerPhrases": [
    "how does the writer use language",
    "question 2",
    "aqa paper 1",
    "rosabel's bus journey home",
    "paper 1 question 2"
  ],
  "referentialCues": [
    "this",
    "these",
    "it",
    "they",
    "which",
    "that",
    "such",
    "the word",
    "the phrase",
    "the image",
    "the verb",
    "the adjective",
    "the quotation",
    "the quote"
  ],
  "neutralLinkingPhrases": [
    "at first",
    "later",
    "then",
    "overall",
    "finally",
    "at the end",
    "meanwhile",
    "after this",
    "also",
    "in addition",
    "another point",
    "later on"
  ],
  "methodAliases": {
    "imagery": [
      "imagery",
      "visual imagery",
      "image"
    ],
    "metaphor": [
      "metaphor",
      "metaphorical"
    ],
    "simile": [
      "simile"
    ],
    "personification": [
      "personification"
    ],
    "symbolism": [
      "symbol",
      "symbolism",
      "symbolises",
      "symbolizes",
      "represents"
    ],
    "adjective": [
      "adjective",
      "adjectives"
    ],
    "verb": [
      "verb",
      "verbs",
      "dynamic verb"
    ],
    "noun": [
      "noun",
      "nouns"
    ],
    "adverb": [
      "adverb",
      "adverbs"
    ],
    "contrast": [
      "contrast",
      "juxtaposition"
    ],
    "sensory": [
      "sensory language",
      "sensory imagery"
    ],
    "punctuation": [
      "semicolon",
      "dash",
      "ellipsis",
      "punctuation",
      "long sentence",
      "sentence form"
    ],
    "description": [
      "description",
      "descriptive"
    ]
  },
  "looseMethodTerms": [
    "imagery",
    "sensory",
    "description",
    "descriptive",
    "contrast",
    "metaphor"
  ],
  "seriousMethodTerms": [
    "simile",
    "personification",
    "symbolism"
  ],
  "copyThresholds": {
    "wholeDice": 0.9,
    "nearDice": 0.82,
    "sentenceDice": 0.9,
    "extractShare": 0.78,
    "paraphraseShare": 0.68,
    "fourGramRatio": 0.4,
    "threeGramRatio": 0.52,
    "longRun": 12
  },
  "unitMergeRules": {
    "maxCarrySentences": 3,
    "shortEvidenceWords": 22,
    "maxQuoteWordsForSelective": 8
  },
  "scoringThresholds": {
    "level4": {
      "minDevelopedLike": 2.05,
      "minClearEquivalent": 2.75,
      "minUsableEvidence": 2,
      "minSelectiveEvidence": 1,
      "minAnalyticalCoverage": 2,
      "minInterpretiveCoverage": 2,
      "minSustainedThreads": 1,
      "maxWeakRatio": 0.46,
      "maxSeriousIssues": 1
    },
    "mark8": {
      "minPerceptiveUnits": 2,
      "minDevelopedLike": 3,
      "minJudiciousEvidence": 1,
      "minAnalyticalCoverage": 4,
      "minInterpretiveCoverage": 4,
      "minSustainedThreads": 2,
      "maxWeakRatio": 0.2
    },
    "level3high": {
      "minClearEquivalent": 2.35,
      "minUsableEvidence": 2,
      "minSupportedCoverage": 2,
      "minAnalyticalCoverage": 2,
      "minInterpretiveCoverage": 1,
      "maxWeakRatio": 0.68
    },
    "level3": {
      "minClearEquivalent": 1.55,
      "minAttachedEvidence": 1,
      "minSupportedCoverage": 1,
      "maxWeakRatio": 0.78
    }
  },
  "bestFitFloors": {
    "level3": {
      "minValidComments": 4,
      "minSupportedCoverage": 3
    },
    "level4": {
      "minDevelopedComments": 2,
      "minAnalyticalCoverage": 3,
      "minUsableEvidence": 2,
      "minSustainedThreads": 1
    }
  },
  "fuzzyThresholds": {
    "quoteSearchMaxScore": 0.33,
    "effectSearchMaxScore": 0.31,
    "anchorSearchMaxScore": 0.34
  },
  "minCompleteWords": 8,
  "hybridHelper": {
    "enabled": true,
    "k": 7,
    "upwardThreshold": 0.66,
    "downwardThreshold": 0.52,
    "maxBoundaryShift": 1
  },
  "shallowEffectPhrases": [
    "smells bad",
    "makes it sound bad",
    "makes it sound horrible",
    "sounds horrible",
    "sounds bad",
    "looks good",
    "looks pretty",
    "good and pretty",
    "not very nice",
    "is bad",
    "is horrible",
    "seems horrible",
    "shows it smells bad",
    "shows it is bad",
    "the shops sound good and pretty"
  ],
  "weakEvaluativePhrases": [
    "good",
    "pretty",
    "nice",
    "bad",
    "horrible",
    "boring",
    "gross",
    "weird"
  ],
  "simpleValidAnalysisPhrases": [
    "gloomy atmosphere",
    "hard to see clearly",
    "dirty and uncomfortable",
    "overpowering",
    "lifeless and drained",
    "claustrophobic atmosphere",
    "journey seem degrading",
    "grim physical reality",
    "bus feel oppressive",
    "outside seem magical for a moment"
  ]
}
  };
});
