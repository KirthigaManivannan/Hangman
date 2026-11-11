BREAK ROOM HANGMAN (online, office edition)
===========================================
Every player uses their own phone or laptop. Open the link, pick your name, play.

RUN IT ON YOUR COMPUTER
-----------------------
1. Install Node.js (18 or newer) from https://nodejs.org
2. In this folder run:   node server.js
3. Open http://localhost:3000  (open it in 2-3 tabs to try different players)

DEPLOY ON RENDER (free)
-----------------------
Push this folder to GitHub, then on render.com choose New > Web Service:
   Build Command: npm install      Start Command: npm start      Instance: Free
Send everyone the link when it says "Live". (Free plan sleeps after ~15 min idle;
the first visit can take a minute to wake up. The game lives in memory.)
Each time you change files (for example, add the MP3), commit and push again.

HOW TO PLAY
-----------
1. Tap your name (or type your own), press Join. First person in is the host.
2. Host presses Start Game (2+ players). A random player is the Word Giver and
   types a secret word. Only the vowels are shown.
3. FREE-FOR-ALL: everyone except the Word Giver can guess any letter, any time.
   The screen shows who just guessed (avatar + name).
4. Scoring: +1 for every letter your correct guess reveals. If the hangman is
   completed (6 wrong), the Word Giver gets 3.
5. Wrong guess: that player's avatar appears at the side with
   "Throw Tomato" and "Throw Egg" buttons. Everyone else can pelt them.
   Every throw is a cartoon food fight: the victim's avatar grows big in the
   middle of the screen, a large tomato or egg flies in and bursts with pulp,
   seeds, yolk, shell pieces, droplets and see-through splashes across the
   screen. It never blocks the game and removes itself when finished.
6. End of every round: the player(s) with the most wrong guesses are announced
   as the BIGGEST BLUNDER and everybody pelts them. Then the normal results
   and leaderboard continue. (Ties: all tied players are pelted.)
7. Leaderboard: avatar, correct guesses, wrong guesses, points, a crown for the
   leader and funny titles: Word Master, Biggest Blunder, Tomato Magnet,
   Egg Target.
8. END GAME: any player can press the red END GAME button during play. A popup
   asks "Are you sure you want to end the game?" (Continue Playing / Yes, End
   Game). The game never ends by itself. After "Yes", everyone sees the final
   results: winner with a big avatar and celebration, full leaderboard, total
   correct and wrong guesses, treat message and winner music.
   PLAY AGAIN starts a fresh game (all scores and stats reset).

WINNER MUSIC - WHERE TO ADD YOUR MP3
------------------------------------
Put your song here, with exactly this name:

      assets/sounds/winner-song.mp3

It plays when the final leaderboard / winner announcement appears.
Use the "Sound on / Sound off" button (top right) to mute or unmute.
If the file is missing, the game stays silent and works normally.
Remember to commit and push the MP3 to GitHub so Render has it.

SAVIOUR BUTTON
--------------
Opens the SAP Integration Suite page:
https://www.sap.com/products/technology-platform/integration-suite.html

AVATARS
-------
Each default player has their own cartoon avatar (hairstyle, outfit, funny
face): Sai (spectacles), Rasmus (medium wavy hair + one earring), Abinesh
(AirPods), Bala (beard), Shravan (specs on his head + tiny moustache),
Vasupradaa (spectacles + braids), Kaviya (ponytail + flower), Kirthiga
(spectacles). Janageshwar and Sanskaar keep their original avatars. People who type a different name get a random cartoon that stays the same
for that name. Avatars are drawn in code: public/avatars.js (no photos used).

FILES
-----
server.js          game server (no dependencies)
package.json       start command
public/index.html  page layout
public/style.css   colours and animations
public/script.js   game screen logic
public/avatars.js  cartoon avatars
public/effects.js  tomato / egg food-fight animations
assets/sounds/     put winner-song.mp3 here
