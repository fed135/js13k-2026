# JS13KGames Submission: 


This is the source project for my 2026 JS13k submission: My Little Armageddon.

In this repo you'll find my original sources in the [before-optimizations](https://github.com/fed135/js13k-2026/tree/before-optimizations) branch. I built is out using classes and neat splitting of the business logic.

Once I had a fully functional and ready build I created a new branch where I then merged all the code files into one (which is what you now see in the main branch).

~2k lines in a single file is painful to work on (happened more than once in my career tho'), which I didn't really thought would be too bad because I dodn't anticipate the need to debug much (I was wrong).

The big challenge was getting the multiplayer working right. It was sort of a stretch goal I set myself and well, didn't plan my classes accordingly from the start.

Anyways, hope you enjoy!


## To launch from source:

```
npm run start
```

## To build the compressed version:


```
npm run build
```

Outputs a `minified` .zip archive


```
npm run publish
```

Uploads the build to [Wavedash](https://wavedash.com/dev-portal/fed135)


## Step 1 (Build the game):


Size after step 1: 16kb


## Step 2 (Size optimization) 

- GCC Advanced compilation (needs to have all window properties explicitly labeled) (~2kb)
- Merge all code files (removes import structure) + hoist state objects to prevent needless injection (~2kb)
- Minify HTML + CSS (~2kb estimated)
  - [Online minifier](https://j9t.github.io/html-minifier-next/)

Size after step 2: 12.6kb

## Ideas:

- Test out RegPack, which used to be fantastic for js1k, but uses `eval` and hasn't been updated in a little while. 
  - Not as fantastic for larger codebases where GCC can tree-shake and perform some crazy optimizations


## Notes

- Google closure compiler is *crazy good*, I'm thinking of of using it for my other games in development, but for a small project like this where I didn't bother with typings or didn't really invest in tooling it created a terrible debugging experience. GCC would sometimes rename object properties causing runtime errors in specific scenarios. 
- On the topic of debugging, the CLI for Wavedash is pretty fun and well built. Pushing new builds and sending the test link to friends was awesome. I really should've taken the time to set up a local env to test out the multiplayer tho', instead of pushing dozens of builds every 5 minutes... that's on me.
- If I had a bit more time I know I could do a few more things:
  - Add more player animation states
  - Add support for js13kgames WS server
  - Refine the UI a bit
  - Make the bots smarter
  - Add match options, eg: toggle wind, # of turns, # of players
  - etc.