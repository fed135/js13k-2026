# JS13KGames Submission: 

**Before Optimizations branch**

This is the original source I worked with for the early development. I wanted a feature-full complete game with decently organized source before I began optimization.

At this stage, the whole game is present and my zipped build is 16kb.

Not bad !


Full source in the `src` folder.

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

- [x] Create damage and death flow
- [x] change weapons + ammo
- [-] instructions (will put in the game's description
- [x] Total match turns indicator ( + option to change ?)
- [x] Wind indicator + changes
- [x] Winner indicator
- [-] Better bots (hard as it is right now!)
- [x] Angle preview + last speed indicator
- [-] Players reaching bottom (probably not going to happen)
- [x] Fix viewport size (make everything absolute 1080x600)
- [x] Make match gameplay
- [x] Handle arrow inputs and holding space to charge.
- [-] Test out networking on Wavedash (bugged due to multiple files and losing globally scoped members)
- [x] Create particle system (reuse ballistic physics)
- [x] Finish sprites
- [x] Polish UI + more animations + particles + gore ?
- [x] Optimize perf
- [x] Bugs (replayability) 


## Step 2 (Size optimization) 

In order of priority

- GCC Advanced compilation (needs to have all window properties explicitly labeled) (~2kb)
- Merge all code files (removes import structure) + hoist state objects to prevent needless injection (~2kb)
- Minify HTML + CSS (~2kb estimated)
  - [Online minifier](https://j9t.github.io/html-minifier-next/)

- Determine if we keep Wavedash online multipayer or choose local multiplayer... or neither

## Ideas:

Test out RegPack, which used to be fantastic for js1k, but uses `eval` and hasn't been updated in a little while. 
