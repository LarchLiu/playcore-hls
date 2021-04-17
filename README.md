## playcore-hls

[![npm version](https://img.shields.io/npm/v/@cloudgeek/playcore-hls.svg?style=flat-square)](https://www.npmjs.com/package/@cloudgeek/playcore-hls)
[![npm downloads](https://img.shields.io/npm/dm/@cloudgeek/playcore-hls.svg?style=flat-square)](https://www.npmjs.com/package/@cloudgeek/playcore-hls)

A [vue3-video-player](https://github.com/LarchLiu/vue3-video-player) plugin for HLS Decoding.


### Get Started

``` bash
$ npm install @cloudgeek/vue3-video-player --save
$ npm install @cloudgeek/playcore-hls --save
```

``` vue
<template>
  <div id="app">
    <div class="player-container">
      <vue3-video-player :core="HLSCore" src="your_file.m3u8"></vue3-video-player>
    </div>
  </div>
</template>
<script>
import Vue3VideoPlayer from '@cloudgeek/vue3-video-player'
import HLSCore from '@cloudgeek/playcore-hls

Vue.use(Vue3VideoPlayer)

export default {
  name: 'App',
  data () {
    return {
      HLSCore
    }
  }
}

</script>

```

[example](./example/src/App.vue)
