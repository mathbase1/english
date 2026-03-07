(function (root, factory) {
  const config = factory();
  root.QUIZ_CONFIG = config;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = config;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  return {
  "examLabel": "AQA GCSE English Language · Paper 1 Question 2 (AO2)",
  "maxMark": 8,
  "questionPrompt": "How does the writer use language here to describe Rosabel's bus journey home?",
  "sourceExtract": "Rosabel looked out of the windows; the street was blurred and misty, but light striking on the panes turned their dullness to opal and silver, and the jewellers' shops seen through this were fairy palaces. Her feet were horribly wet, and she knew the bottom of her skirt and petticoat would be coated with black, greasy mud. There was a sickening smell of warm humanity - it seemed to be oozing out of everybody in the bus - and everybody had the same expression, sitting so still, staring in front of them. Rosabel stirred suddenly and unfastened the two top buttons of her coat... she felt almost stifled. Through her half-closed eyes, the whole row of people on the opposite seat seemed to resolve into one meaningless, staring face.",
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
        "gloomy"
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
        "unfocused"
      ],
      "supportedInterpretations": [
        "too tired to focus",
        "outside seems unclear",
        "journey feels gloomy"
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
        "outside world"
      ],
      "supportedEffects": [
        "magical",
        "dreamlike",
        "beautiful",
        "precious",
        "luxurious",
        "transformed",
        "glamorous"
      ],
      "supportedInterpretations": [
        "brief escape",
        "temporary beauty",
        "imagination",
        "fantasy",
        "escaping the bus",
        "momentary relief"
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
        "draining"
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
        "grim"
      ],
      "supportedInterpretations": [
        "physical discomfort",
        "journey is exhausting",
        "journey is unpleasant"
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
        "claustrophobic"
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
        "overwhelming"
      ],
      "supportedInterpretations": [
        "overwhelmed by the bus",
        "bus feels inescapable",
        "bus feels unpleasant"
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
        "blank"
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
        "lost in the crowd"
      ],
      "supportedInterpretations": [
        "people merge together",
        "Rosabel feels disconnected",
        "crowd seems anonymous",
        "lost in the crowd"
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
        "unfocused"
      ],
      "supportedInterpretations": [
        "too tired to focus",
        "outside seems unclear"
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
        "transformed"
      ],
      "supportedInterpretations": [
        "brief escape",
        "imagination",
        "temporary beauty"
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
        "idealised"
      ],
      "supportedInterpretations": [
        "brief escape",
        "imagination",
        "escaping the bus",
        "temporary beauty"
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
        "uncomfortable"
      ],
      "supportedInterpretations": [
        "physical discomfort"
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
        "grim"
      ],
      "supportedInterpretations": [
        "journey is unpleasant",
        "physical discomfort"
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
        "stifling"
      ],
      "supportedInterpretations": [
        "bus feels unpleasant",
        "bus feels overcrowded"
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
        "overflowing"
      ],
      "supportedInterpretations": [
        "bus feels inescapable",
        "smell dominates the bus"
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
        "trapped"
      ],
      "supportedInterpretations": [
        "Rosabel feels overwhelmed",
        "bus feels oppressive"
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
        "lifeless"
      ],
      "supportedInterpretations": [
        "crowd seems anonymous"
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
        "bored"
      ],
      "supportedInterpretations": [
        "crowd seems anonymous",
        "people seem lifeless"
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
        "lost in the crowd"
      ],
      "supportedInterpretations": [
        "people merge together",
        "Rosabel feels disconnected",
        "crowd seems anonymous",
        "lost in the crowd"
      ],
      "supportedMethods": [
        "imagery",
        "metaphor"
      ]
    }
  ],
  "calibrationCases": [
    {
      "id": "test1",
      "label": "Strong borderline Level 4",
      "expectedMark": 7,
      "answer": "Rosabel’s journey home is shown as uncomfortable and tiring. The writer says the street was \"blurred and misty\", which makes it seem gloomy and unclear. The light turning the windows into \"opal and silver\" makes the outside world look magical for a moment, almost like she is escaping the bus in her imagination. Her feet are \"horribly wet\" and her clothes are covered in \"black, greasy mud\", which shows how unpleasant and dirty the journey is for her.\n\nThe writer also describes the smell on the bus as a \"sickening smell of warm humanity\", which suggests the bus is overcrowded and sweaty. Everyone is \"staring in front of them\", which makes them seem lifeless and bored. Rosabel feels \"almost stifled\", showing she is overwhelmed by the heat and the closeness of the people. At the end, the passengers turn into \"one meaningless, staring face\", which shows how drained and disconnected she feels."
    },
    {
      "id": "test2",
      "label": "Clear strong response",
      "expectedMark": 7,
      "answer": "The writer presents Rosabel’s journey as uncomfortable and draining. The street outside is described as \"blurred and misty\", which makes everything seem unclear and confusing, almost like Rosabel is too tired to focus properly. The windows turning \"opal and silver\" make the outside world seem magical, but this only highlights how unpleasant the inside of the bus is in comparison.\n\nRosabel’s physical discomfort is shown through details like her feet being \"horribly wet\" and her clothes covered in \"black, greasy mud\". This makes the reader imagine how cold and miserable she must feel. The \"sickening smell of warm humanity\" suggests the bus is overcrowded and sweaty, and the word \"warm\" makes the smell feel heavy and suffocating.\n\nThe passengers are described as \"staring in front of them\", which makes them seem lifeless and robotic. Rosabel feels \"almost stifled\", showing she is overwhelmed by the heat and the closeness of the people around her. At the end, the passengers become \"one meaningless, staring face\", which suggests Rosabel feels disconnected from everyone and almost lost in the crowd."
    },
    {
      "id": "test3",
      "label": "Feature spotting / keyword stuffing",
      "expectedMark": 3,
      "answer": "The writer uses a lot of language techniques to show Rosabel’s journey. The description of the street being \"blurred and misty\" is imagery, and this creates an effect on the reader. The writer also uses contrast because the windows become \"opal and silver\", which is another example of imagery that makes the reader imagine something. This contrast is effective.\n\nThe writer uses adjectives like \"horribly wet\" and \"black, greasy mud\", which are descriptive language. This shows the writer is trying to make the reader feel something. The \"sickening smell of warm humanity\" is also language that creates an effect. The writer uses sensory language here.\n\nThe passengers are described with language techniques too. The phrase \"staring in front of them\" is an example of the writer using description. The writer also uses the metaphor \"one meaningless, staring face\", which is effective because it makes the reader think about the effect of the language. This shows the writer is using language to create meaning."
    },
    {
      "id": "test4",
      "label": "Quote listing / Level 1",
      "expectedMark": 2,
      "answer": "The writer describes the street as \"blurred and misty\" and the windows as \"opal and silver\". Rosabel’s feet are \"horribly wet\" and she has \"black, greasy mud\" on her clothes. The bus has a \"sickening smell of warm humanity\" and the passengers are \"staring in front of them\". Rosabel feels \"almost stifled\" and at the end they become \"one meaningless, staring face\".\n\nAll of these details show what the journey is like. The writer includes these descriptions to help the reader picture the scene. The language gives us an idea of the bus and the people on it. The writer uses these phrases to make the journey seem real and to show what Rosabel is experiencing."
    },
    {
      "id": "test5",
      "label": "Long generic waffle",
      "expectedMark": 3,
      "answer": "The writer uses language throughout the extract to show Rosabel’s experience on the bus. The description of the street being \"blurred and misty\" is important because it creates a certain atmosphere for the reader. This atmosphere is part of the writer’s technique. The windows becoming \"opal and silver\" also contribute to the atmosphere, and this helps the reader imagine the scene more clearly.\n\nThe writer continues this descriptive approach with phrases like \"horribly wet\" and \"black, greasy mud\". These words are chosen by the writer to make the reader think about the journey. The \"sickening smell of warm humanity\" is another example of the writer using language to create an effect. This effect is important because it shows the writer’s intention to make the reader understand the situation.\n\nThe passengers are described as \"staring in front of them\", which is a technique used by the writer to show how they are feeling. The phrase \"almost stifled\" is also used by the writer to show Rosabel’s feelings. Finally, the writer uses the phrase \"one meaningless, staring face\" to create another effect on the reader. This shows how the writer uses language to make the journey seem vivid."
    },
    {
      "id": "test6",
      "label": "Concise strong answer",
      "expectedMark": 7,
      "answer": "Rosabel’s journey feels grim but briefly dreamlike. The windows turn the shops into \"opal and silver\" \"fairy palaces\", so the outside world seems magical for a moment, as if she can escape the dirty bus in her imagination. However, inside the bus her feet are \"horribly wet\" and the \"sickening smell of warm humanity\" makes the atmosphere claustrophobic and unpleasant. By the end, the passengers blur into \"one meaningless, staring face\", suggesting Rosabel feels drained and disconnected from the crowd."
    },
    {
      "id": "test7",
      "label": "Copied extract should be Level 0",
      "expectedMark": 0,
      "answer": "Rosabel looked out of the windows; the street was blurred and misty, but light striking on the panes turned their dullness to opal and silver, and the jewellers' shops seen through this were fairy palaces. Her feet were horribly wet, and she knew the bottom of her skirt and petticoat would be coated with black, greasy mud. There was a sickening smell of warm humanity - it seemed to be oozing out of everybody in the bus - and everybody had the same expression, sitting so still, staring in front of them. Rosabel stirred suddenly and unfastened the two top buttons of her coat... she felt almost stifled. Through her half-closed eyes, the whole row of people on the opposite seat seemed to resolve into one meaningless, staring face."
    }
  ],
  "levelDescriptors": {
    "Level 0": "No creditworthy response / copied extract / blank / not an answer.",
    "Level 1": "Simple or limited comments; mostly retelling or generic statement.",
    "Level 2": "Some relevant explanation, but uneven, limited, or generic.",
    "Level 3": "Clear, relevant analysis with grounded effects and appropriate evidence.",
    "Level 4": "Perceptive, consistently accurate analysis with selective evidence and genuine insight."
  }
};
});
