interface Quote {
  text: string
  author: string
}

const QUOTES: Quote[] = [
  // Marcus Aurelius
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius" },
  { text: "Do not indulge in dreams of what you do not have, but count the blessings you actually possess.", author: "Marcus Aurelius" },
  { text: "The object of life is not to be on the side of the majority, but to escape finding oneself in the ranks of the insane.", author: "Marcus Aurelius" },
  { text: "Begin the morning by saying to yourself: I shall meet with meddling, ungrateful, violent, treacherous people — but they are all ignorant of what is good and evil.", author: "Marcus Aurelius" },
  // Seneca
  { text: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
  { text: "All things are alien; time alone belongs to us.", author: "Seneca" },
  { text: "It is not that I'm so smart. It is just that I stay with problems longer.", author: "Seneca" },
  { text: "While we delay, life speeds by.", author: "Seneca" },
  { text: "No man was ever wise by chance.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "Withdraw into yourself as much as you can. Associate with those who will make a better man of you.", author: "Seneca" },
  // Epictetus
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
  { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.", author: "Epictetus" },
  { text: "Seek not the good in external things; seek it in yourself.", author: "Epictetus" },
  // Naval Ravikant
  { text: "Seek wealth, not money or status.", author: "Naval Ravikant" },
  { text: "Read what you love until you love to read.", author: "Naval Ravikant" },
  { text: "Specific knowledge is found by pursuing your genuine curiosity and passion.", author: "Naval Ravikant" },
  { text: "Play long-term games with long-term people.", author: "Naval Ravikant" },
  { text: "A fit body, a calm mind, a house full of love. These things cannot be bought — they must be earned.", author: "Naval Ravikant" },
  { text: "All the returns in life, whether in wealth, relationships, or knowledge, come from compound interest.", author: "Naval Ravikant" },
  { text: "Clear thinking becomes clear writing; one can't exist without the other.", author: "Naval Ravikant" },
  { text: "Happiness is a choice and a skill and you can dedicate yourself to learning that skill.", author: "Naval Ravikant" },
  { text: "Learn to sell. Learn to build. If you can do both, you will be unstoppable.", author: "Naval Ravikant" },
  { text: "Don't partner with cynics and pessimists. Their beliefs are self-fulfilling.", author: "Naval Ravikant" },
  { text: "Productize yourself. Figure out what you're uniquely good at, and apply as much leverage as possible.", author: "Naval Ravikant" },
  { text: "Become the best in the world at what you do. Keep redefining what you do until this is true.", author: "Naval Ravikant" },
  { text: "Code and media are permissionless leverage — the lever that works while you sleep.", author: "Naval Ravikant" },
  { text: "The goal of life is to be happy. The goal of work is to find mastery.", author: "Naval Ravikant" },
]

export function randomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}
