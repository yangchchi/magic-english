export interface PresetStory {
  id: string;
  title: string;
  category: 'fable' | 'daily' | 'science' | 'fun';
  content: string;
}

export const PRESETS: PresetStory[] = [
  // --- FABLES (10) ---
  {
    id: 'f1',
    title: 'The Lion and the Mouse',
    category: 'fable',
    content: "A lion was sleeping in the forest. A little mouse ran over his nose. The lion woke up and was angry. He caught the mouse. \"Please let me go!\" said the mouse. \"Someday I will help you.\" The lion laughed but let him go. Later, hunters caught the lion in a net. The mouse heard the lion roar. He chewed the ropes and set the lion free. Little friends can be great friends."
  },
  {
    id: 'f2',
    title: 'The Tortoise and the Hare',
    category: 'fable',
    content: "The hare bragged about his speed. \"I am the fastest!\" he said. The tortoise said, \"I will race you.\" The hare laughed and ran fast. Then he stopped to sleep. The tortoise walked slowly but he did not stop. When the hare woke up, the tortoise was at the finish line. Slow and steady wins the race."
  },
  {
    id: 'f3',
    title: 'The Thirsty Crow',
    category: 'fable',
    content: "A crow was very thirsty. He found a pitcher with a little water at the bottom. He could not reach it. He thought hard. He picked up small stones and dropped them into the pitcher one by one. The water rose up. The crow drank the water and flew away happily. Smart thinking solves problems."
  },
  {
    id: 'f4',
    title: 'The Boy Who Cried Wolf',
    category: 'fable',
    content: "A shepherd boy looked after sheep. He was bored. He shouted, \"Wolf! Wolf!\" The villagers ran to help, but there was no wolf. The boy laughed. He did this again. The villagers were angry. Later, a real wolf came. The boy shouted, \"Wolf!\" but nobody came. The wolf chased the sheep away. Telling the truth is important."
  },
  {
    id: 'f5',
    title: 'The Ant and the Grasshopper',
    category: 'fable',
    content: "It was summer. The grasshopper sang and danced. The ant worked hard to store food. \"Why work so hard?\" asked the grasshopper. \"Winter is coming,\" said the ant. Winter came. The grasshopper had no food and was cold. The ant was warm and full. The grasshopper learned that it is good to prepare for the future."
  },
  {
    id: 'f6',
    title: 'The Fox and the Grapes',
    category: 'fable',
    content: "A hungry fox saw some grapes high on a vine. \"Those look sweet,\" he said. He jumped but missed them. He jumped again and again. He could not reach them. He walked away and said, \"They are probably sour anyway.\" It is easy to dislike what you cannot get."
  },
  {
    id: 'f7',
    title: 'The Dog and His Reflection',
    category: 'fable',
    content: "A dog had a bone. He crossed a bridge over a stream. He looked down and saw his reflection. He thought it was another dog with a bigger bone. He barked to get the other bone. His bone fell into the water. The greedy dog lost his dinner."
  },
  {
    id: 'f8',
    title: 'The Wind and the Sun',
    category: 'fable',
    content: "The Wind and the Sun argued. \"I am stronger,\" said the Wind. They saw a man in a coat. \"Let us see who can take off his coat,\" said the Sun. The Wind blew hard. The man held his coat tighter. Then the Sun shone warmly. The man got hot and took off his coat. Gentleness is often stronger than force."
  },
  {
    id: 'f9',
    title: 'The Goose with Golden Eggs',
    category: 'fable',
    content: "A farmer had a special goose. Every day, it laid a golden egg. The farmer became rich. But he was greedy. He wanted all the eggs at once. He cut the goose open. But there were no eggs inside. Now he had no goose and no gold. Greed can make you lose everything."
  },
  {
    id: 'f10',
    title: 'The Two Crabs',
    category: 'fable',
    content: "One day, a mother crab said to her son, \"Why do you walk sideways? You should walk straight.\" The young crab replied, \"Show me how, mother, and I will follow you.\" The mother tried but she could only walk sideways too. Do not tell others to do what you cannot do yourself."
  },

  // --- DAILY LIFE (10) ---
  {
    id: 'd1',
    title: 'My Morning Routine',
    category: 'daily',
    content: "I wake up at seven o'clock. First, I brush my teeth. The minty toothpaste tastes fresh. Then I wash my face with cool water. I put on my school uniform. My mom makes toast and eggs for breakfast. I drink a glass of milk. I pack my bag and walk to the bus stop. I am ready for a great day at school."
  },
  {
    id: 'd2',
    title: 'Going to the Supermarket',
    category: 'daily',
    content: "On Saturday, I go to the supermarket with my dad. We need milk, bread, and apples. I push the cart. It is heavy! We look for the cereal aisle. I choose a box with a tiger on it. Dad checks the list. We pay at the counter. The cashier gives us a receipt. We carry the bags to the car."
  },
  {
    id: 'd3',
    title: 'Playing in the Park',
    category: 'daily',
    content: "The sun is shining. I run to the park with my friends. We play tag on the grass. I climb the slide and slide down fast. We swing on the swings. Higher and higher! We see a dog chasing a ball. We drink water from the fountain. Playing outside makes me happy and tired."
  },
  {
    id: 'd4',
    title: 'My Pet Dog',
    category: 'daily',
    content: "I have a dog named Max. He is brown and fluffy. Max loves to play fetch. I throw the ball, and he runs to get it. He wags his tail when he sees me. I give him food and water every day. Sometimes he barks at the mailman. Max is my best friend."
  },
  {
    id: 'd5',
    title: 'Cooking Dinner',
    category: 'daily',
    content: "Tonight we are making pizza. I help my mom in the kitchen. We roll the dough flat. I spread red tomato sauce on it. Then I sprinkle lots of cheese. We add pepperoni and mushrooms. Mom puts it in the oven. It smells delicious. We wait for twenty minutes. Finally, we eat the hot pizza."
  },
  {
    id: 'd6',
    title: 'A Rainy Day',
    category: 'daily',
    content: "It is raining today. I cannot play outside. I sit by the window and watch the rain fall. The sky is gray. I hear thunder. Boom! I read a book about pirates. My mom makes hot chocolate with marshmallows. It is warm and sweet. I like cozy rainy days inside my house."
  },
  {
    id: 'd7',
    title: 'My Birthday Party',
    category: 'daily',
    content: "Today is my birthday. I am eight years old. My friends come to my house. We wear party hats. We play games and listen to music. My cake is chocolate with blue icing. Everyone sings \"Happy Birthday.\" I make a wish and blow out the candles. I open my presents. It is a fun day."
  },
  {
    id: 'd8',
    title: 'Visiting the Doctor',
    category: 'daily',
    content: "I have a cough. My dad takes me to the doctor. The waiting room has toys. The doctor is nice. She listens to my heart with a stethoscope. She looks in my ears. She tells me to drink water and rest. She gives me a sticker for being brave. I will feel better soon."
  },
  {
    id: 'd9',
    title: 'Cleaning My Room',
    category: 'daily',
    content: "My room is messy. There are toys on the floor. Mom says, \"Please clean up.\" I pick up my cars and put them in the box. I put my books on the shelf. I make my bed. Now my room looks neat. I find a missing sock under the bed. Cleaning is work, but I like a tidy room."
  },
  {
    id: 'd10',
    title: 'At the Library',
    category: 'daily',
    content: "I love the library. It is quiet and smells like old paper. There are thousands of books. I look for a book about dinosaurs. The librarian helps me find it. I sit in a soft chair and read. I borrow three books to take home. I must be careful with them and bring them back next week."
  },

  // --- SCIENCE (10) ---
  {
    id: 's1',
    title: 'The Solar System',
    category: 'science',
    content: "We live on Earth. Earth is a planet. There are eight planets in our solar system. They all travel around the Sun. The Sun is a giant star. It gives us light and heat. Mercury is the closest to the Sun. Neptune is the farthest away. Space is very big and amazing."
  },
  {
    id: 's2',
    title: 'How Plants Grow',
    category: 'science',
    content: "Plants need three things to grow: sunlight, water, and soil. We plant a seed in the dirt. Roots grow down to drink water. A stem grows up toward the light. Leaves grow on the stem. Leaves use sunlight to make food for the plant. Soon, a flower or fruit might appear. Nature is wonderful."
  },
  {
    id: 's3',
    title: 'The Water Cycle',
    category: 'science',
    content: "Water is always moving. The sun warms the ocean. Water turns into vapor and goes up. This is evaporation. The vapor makes clouds. When clouds get heavy, rain falls down. This is precipitation. The rain flows into rivers and back to the ocean. Then it starts all over again."
  },
  {
    id: 's4',
    title: 'Butterflies',
    category: 'science',
    content: "A butterfly starts as a tiny egg. A caterpillar hatches from the egg. It eats lots of leaves and grows fat. Then it makes a hard shell called a chrysalis. Inside, its body changes. After a few weeks, a butterfly comes out. It has colorful wings. It flies to flowers to drink nectar."
  },
  {
    id: 's5',
    title: 'Magnets',
    category: 'science',
    content: "Magnets are special metals. They have a North pole and a South pole. Opposite poles attract, they pull together. Same poles repel, they push apart. Magnets pull things made of iron. They do not pull wood or plastic. We use magnets on our refrigerator to hold pictures."
  },
  {
    id: 's6',
    title: 'Dinosaurs',
    category: 'science',
    content: "Dinosaurs lived a long time ago. Some were huge, and some were small. The T-Rex was a meat eater with big teeth. The Brachiosaurus was a plant eater with a long neck. Dinosaurs are extinct now. We know about them because we find their bones, called fossils, in the ground."
  },
  {
    id: 's7',
    title: 'Volcanoes',
    category: 'science',
    content: "A volcano is like a mountain with a hole at the top. Deep underground, there is hot melted rock called magma. When pressure builds up, the volcano erupts. Magma comes out and is called lava. Lava is very hot and red. When it cools down, it turns into hard black rock."
  },
  {
    id: 's8',
    title: 'The Moon',
    category: 'science',
    content: "The Moon orbits the Earth. It does not make its own light. It reflects light from the Sun. The Moon looks different every night. Sometimes it is round and full. Sometimes it is a thin crescent. There is no air on the Moon. Astronauts visited the Moon and left footprints there."
  },
  {
    id: 's9',
    title: 'Why Do We Sleep?',
    category: 'science',
    content: "Sleep is important for our bodies. When we sleep, our body fixes itself. Our brain sorts out what we learned today. It helps us remember things. Kids need lots of sleep to grow. If you do not sleep, you feel grumpy and tired. Sleeping gives us energy for tomorrow."
  },
  {
    id: 's10',
    title: 'Penguins',
    category: 'science',
    content: "Penguins are birds, but they cannot fly. They live in cold places like Antarctica. They are excellent swimmers. Their wings act like flippers. They eat fish. Penguins have thick feathers to keep warm. They waddle when they walk on ice. Emperor penguins huddle together to stay warm in the winter."
  },

  // --- FUN FACTS (10) ---
  {
    id: 'ff1',
    title: 'Honey Never Spoils',
    category: 'fun',
    content: "Did you know honey never goes bad? Archaeologists found honey in ancient Egyptian tombs. It was thousands of years old. It was still good to eat! Honey has special sugar that keeps bacteria away. Bees work very hard to make it. It is a sweet treat that lasts forever."
  },
  {
    id: 'ff2',
    title: 'Octopus Hearts',
    category: 'fun',
    content: "An octopus is a very strange sea creature. It has eight arms. But did you know it has three hearts? Two hearts pump blood to the gills. One heart pumps blood to the rest of the body. Also, octopus blood is blue, not red! They are very smart animals."
  },
  {
    id: 'ff3',
    title: 'Giraffes Sleeping',
    category: 'fun',
    content: "Giraffes are the tallest animals. But they do not sleep much. They only sleep for about thirty minutes a day! They usually sleep standing up so they can run away fast if a lion comes. Their tongues are purple and very long. They use them to pull leaves off tall trees."
  },
  {
    id: 'ff4',
    title: 'Bananas are Berries',
    category: 'fun',
    content: "Here is a fruit fact. A strawberry is not a berry. But a banana is a berry! In science, a berry is a fruit that comes from one flower with one ovary. Bananas fit this rule. Strawberries have seeds on the outside, so they are different. Nature is full of surprises."
  },
  {
    id: 'ff5',
    title: 'Cheetah Speed',
    category: 'fun',
    content: "The cheetah is the fastest land animal. It can run as fast as a car on the highway! It can go from zero to sixty miles per hour in just three seconds. However, it can only run fast for a short time. It gets tired quickly and needs to rest after hunting."
  },
  {
    id: 'ff6',
    title: 'Elephant Memory',
    category: 'fun',
    content: "People say \"An elephant never forgets.\" Elephants have very big brains. They can remember places to find water from many years ago. They also recognize their friends and family after being apart for a long time. Elephants are very emotional and smart animals."
  },
  {
    id: 'ff7',
    title: 'Blue Whale',
    category: 'fun',
    content: "The blue whale is the biggest animal that ever lived. It is bigger than any dinosaur. Its tongue weighs as much as an elephant! Its heart is the size of a small car. Even though it is huge, it eats tiny shrimp called krill. It lives in the deep ocean."
  },
  {
    id: 'ff8',
    title: 'Kangaroos',
    category: 'fun',
    content: "Kangaroos live in Australia. They cannot walk backwards. Their big tails and strong legs help them jump forward. A baby kangaroo is called a joey. It lives in its mother's pouch until it is big enough. Kangaroos can jump very high and box with their hands."
  },
  {
    id: 'ff9',
    title: 'Dolphins Sleep with One Eye Open',
    category: 'fun',
    content: "Dolphins live in the water, but they breathe air. They cannot sleep fully or they would drown. So they shut down half of their brain to sleep. The other half stays awake to breathe and look for danger. They sleep with one eye open! They switch sides later."
  },
  {
    id: 'ff10',
    title: 'Cats Meow for Humans',
    category: 'fun',
    content: "Adult cats do not usually meow at each other. Kittens meow at their mothers. But adult cats meow mostly to talk to humans. They want food, or attention, or to say hello. They learned that humans respond to their voices. Your cat is talking just to you!"
  }
];
