# JS13KGames Submission: 


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
- [ ] instructions
- [ ] Total match turns indicator ( + option to change ?)
- [x] Wind indicator + changes
- [ ] Winner indicator
- [ ] Better bots
- [x] Angle preview + last speed indicator
- [ ] Players reaching bottom (hp 0)
- [x] Fix viewport size (make everything absolute 1080x600)
- [x] Make match gameplay
- [x] Handle arrow inputs and holding space to charge.
- [ ] Test out networking on Wavedash
- [x] Create particle system (reuse ballistic physics)
- [ ] Finish sprites
- [ ] Polish UI + more animations + particles + gore ?
- [ ] Optimize perf
- [ ] Bugs (replayability) 


Size after step 1:


## Step 2 (Size optimization) 

In order of priority

- GCC Advanced compilation (needs to have all window properties explicitly labeled) (~2kb)
- Merge all code files (removes import structure) + hoist state objects to prevent needless injection (~2kb)
- Minify HTML + CSS (~2kb estimated)
  - [Online minifier](https://j9t.github.io/html-minifier-next/)

- Determine if we keep Wavedash online multipayer or choose local multiplayer... or neither

## Ideas:

Test out RegPack, which used to be fantastic for js1k, but uses `eval` and hasn't been updated in a little while. 