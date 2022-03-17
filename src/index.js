/**
 * A vue-core-video-player PlayCore for HLS Format
*/
/* global Hls */
import loadScript from 'load-script'
import { BaseVideoCore, EVENTS } from '@cloudgeek/vue3-video-player'
// import EVENTS from '../constants/EVENTS'
import { isMSESupported, isChrome, isAndroid, isApple, isUC, getFormatBandwidth, parseMediaList } from './util'
import { LOAD_SDK_TIMEOUT, HLS_SDK, DEFAULT_HLS_RESOLUTION, HLS_DEFAULT_CONFIG, HLS_ERROR_WHITE, HLS_EVENTS } from './constants'

class HLSCore extends BaseVideoCore {


  init () {

    if (!window.Hls) {
      this.loadSDK(() => {
        this.pause()
        this.initHLSCore()
      })
    } else {
      this.initHLSCore()
    }
    this.setSize()
    this.emit(EVENTS.LIFECYCLE_INITED)
  }

  initHLSCore() {
    const config = Object.assign({}, HLS_DEFAULT_CONFIG, this.config)
    const hls = new Hls(config)
    this.parseSource(this.config.src)
    hls.loadSource(this.config.src)
    hls.attachMedia(this.$video)
    this.pause()
    hls.on(HLS_EVENTS.MANIFEST_PARSED, (event, result) => {
      const level = this._parse(result)
      hls.loadLevel = level
      hls.currentLevel = level
      hls.nextLevel = level
      hls.startLevel = level
      this.updateState('frag', {})
      hls.startLoad()
      this._autoRegisterEvents()
      this._autoplay()
    })
    this.hlsCore = this.hls = hls
    this.bindEvents()
  }

  parse () {
    // @override the default parse
    this.source = {}
  }

  parseSource (source) {
      const medias = parseMediaList(source)
      medias.forEach((media) => {
          if (media.resolution && media.resolution === this.config.resolution) {
              this.config.src = media.src
          }
      })
      if (Array.isArray(this.config.src) && medias.length) {
          this.config.src = medias[0].src
      }
  }

  loadSDK (callback) {
    const timeout = setTimeout(() => {
      if (!window.Hls) {
        this.emit(EVENTS.CORE_TO_MP4, true)
      }
    }, LOAD_SDK_TIMEOUT)
    loadScript(HLS_SDK, (err, script) => {
      if (err) {
        clearTimeout(timeout)
        this.emit(EVENTS.CORE_TO_MP4, true)
        this.emit(EVENTS.ERROR, {
          code: 601,
          message: JSON.stringify(err)
        })
        return
      }
      if (script) {
        callback()
      }
    })
  }

  // proxy some hls events
  bindEvents() {
    this.hlsCore.on(HLS_EVENTS.LEVEL_SWITCHED, (event, result) => {
      const { resolution } = this
      const index = result.level
      const data = this._findLevel(index)
      if (resolution === 'auto') {
        this.source.height = data.height
        this.source.width = data.width
        this.source.video_bitrate = data.video_bitrate
        this.emit(EVENTS.RESOLUTION_UPDATE, data)
      }
    })
    this.hlsCore.on(HLS_EVENTS.FRAG_LOADED, (event, result) => {
      if (result.frag.type === 'audio') {
        return
      }
      if (result.stats) {
        // logger.log(result)
        const { loaded, tfirst, tload } = result.stats
        this.updateState('frag', result.stats)
        const bandwidth = this.hlsCore.bandwidthEstimate || (loaded / (tload - tfirst) * 1000)
        const bw = getFormatBandwidth(bandwidth)
        result.frag.request = result.networkDetails
        this.updateState({
          bw,
          bandwidth,
          frag: result.frag
        })
      }
    })
    this.hlsCore.on(HLS_EVENTS.ERROR, (e, result) => {
      console.log(result)
      if (HLS_ERROR_WHITE[result.type]) {
        if (result.fatal) {
            if (result.type === 'mediaError') {
                HLS_ERROR_WHITE[result.type].count += 1
                if (HLS_ERROR_WHITE[result.type].count === 1) {
                    this.hlsCore.recoverMediaError()
                } else if (HLS_ERROR_WHITE[result.type].count === 2) {
                    this.hlsCore.swapAudioCodec()
                    this.hlsCore.recoverMediaError()
                } else {
                    HLS_ERROR_WHITE[result.type].count = 0
                }
            } else if (result.type === 'networkError') {
                this.hlsCore.startLoad()
            }
        }
        return
      }
      this.hlsCore.detachMedia()
      this.emit(EVENTS.CORE_TO_MP4, true)
      this.emit(EVENTS.ERROR, {
        code: 601,
        message: JSON.stringify({
          type: result.type,
          details: result.details,
        }),
      })
    })
  }

  updateState(key, value) {
    if (typeof key === 'object') {
      Object.assign(this.state, key)
    } else if (key) {
      this.state[key] = value
    }
  }

  _findLevel(index) {
    return this.medias[index]
  }

  // parse m3u8 manifest and set medias
  _parse(mainfest) {
    if (Array.isArray(mainfest.levels)) {
      const medias = []
      const obj = {}
      mainfest.levels.forEach((item, index) => {
        const resolution = item.height + 'p'
        if (!obj[resolution]) {
          obj[resolution] = true
          medias.push({
            src: item.url,
            index,
            width: item.width,
            height: item.height,
            video_bitrate: item.bitrate,
            resolution
          })
        }
      })
      return this.initResolution(medias)
    }

    if (Array.isArray(mainfest.audioTracks)) {
      const audios = []
      mainfest.audioTracks.forEach((item, index) => {
        audios.push({
          url: item.url,
          name: item.name + index,
          lang: item.lang,
          codec: item.audioCodec,
          id: item.urlId
        })
      })
    }
  }

  initResolution(medias) {
    const length = medias.length
    this.medias = medias
    // this..initResolution(null, medias)
    setTimeout(() => {
      this.emit(EVENTS.SOURCE_UPDATED, this)
    }, 200)
    if (this.config.resolution) {
      for (let i = 0; i < length; i++) {
        if (medias[i].resolution === this.config.resolution) {
          this.resolution = medias[i].resolution
          return medias[i].index
        }
      }
    } else {
      for (let i = 0; i < length; i++) {
        if (medias[i].resolution === DEFAULT_HLS_RESOLUTION) {
          this.resolution = medias[i].resolution
          return medias[i].index
        }
      }
    }
    this.resolution = medias[0].resolution
    return medias[0].index
  }


  setResolution(resolution) {
    const medias = this.medias
    // if (resolution === 'auto') {
    //   this.resolution = resolution
    //   return hls.hls.currentLevel = -1
    // }
    if (medias && medias.length > 1) {
      for (let i = 0; i < medias.length; i++) {
        if (medias[i].resolution === resolution) {
          this.hls.currentLevel = medias[i].index
          // this.config.src = medias[i].src
          this.resolution = resolution
          this.emit(EVENTS.SOURCE_UPDATED, this)
          break;
        }
      }
    }
  }

  checkHLSSupport () {
    if (isMSESupported()) {
      // in android we only support chrome
      if (isAndroid && isChrome) {
        return true
      }
      // in iOS  docs: https://github.com/vcamvr/vr-player/blob/core/hls/docs/core.md#%E6%B5%8F%E8%A7%88%E5%99%A8%E7%99%BD%E5%90%8D%E5%8D%95
      if (isApple && isUC) {
        return false
      }
      return true
    }
    return false
  }

  destroy() {
    this.hlsCore.stopLoad()
    this.hlsCore.detachMedia()
  }
}


export default HLSCore
