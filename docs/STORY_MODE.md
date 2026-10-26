# Story mode – spec (build after mixed exercises)

From the owner, 26 Oct 2026:

- The story starts **at a market**. The player has an **inventory** (e.g. money, items bought).
- Characters speak **only Hindi**; the player is expected to answer **only in Hindi** (by voice, or by choosing an option).
- An **English subtitle** of what the character says is available.
- Each **option** shows: the Hindi text, its **English meaning** below, and its **pronunciation in English letters** (romanised).
- The story is **generated live** (Sarvam-105B), and the player's choices change what happens.
- The scene/environment and the character are **drawn with basic shapes**, Duolingo-style.
- Overall look: aesthetic, animated, with **light/dark mode**.

Open ideas (advice, not decisions): the model returns JSON each turn (character line, subtitle, options, scene tag, inventory change); the scene is picked from a few preset SVG scenes so the demo can't break.

Update (owner, same day): make story mode **pixel-art, Pokémon-style**: a top-down tile map of the market the player **walks around** (arrow keys / on-screen d-pad), with **full character sprites**; walk up to a person to start a Hindi conversation (dialogue box at the bottom, Pokémon-style). Sprite source still to decide: free CC0 packs (e.g. Kenney.nl, itch.io) need a download approval; or sprites drawn in code as pixel grids.

Update 2 (owner): story mode keeps **all the earlier rules** (market start, inventory, Hindi-only talk, English subtitles, options with Hindi + English meaning + romanised pronunciation). The pixel world becomes the **hub**: the **Alphabet area** (a school/library building) and the **mixed exercises ("Dojo")** are **locations in the world**; walking into them opens those screens. Assets: Kenney Tiny Town (tiles) + Tiny Dungeon (characters), 16x16, CC0.

Update 3 (owner): the world should be **fully explorable**, with a few **perks and secrets** hidden around it that **buff the player and are deliberately overpowered** ("pretty broken"). Example ideas (advice, not decided): a hidden Golden Chai (double XP for a while), a Wise Owl behind the trees (permanent auto-hint on a wrong answer), a Lucky Laddu (infinite hearts in the next Dojo lesson), a secret Rupee pouch (lots of market money for the inventory). Perks go in the inventory and are saved.
