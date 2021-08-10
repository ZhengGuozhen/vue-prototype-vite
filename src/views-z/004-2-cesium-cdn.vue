<template>
  <div class="c-0">
    <div class="title">Cesium demo</div>

    <div id="cesiumContainer"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'

// development 情况下：需要在 index.html 中引入 cdn 依赖
// produciton  情况下：理论上需要在 index.html 中引入 cdn 依赖，实测不引入也正常

export default defineComponent({
  name: 'CesiumDemo',

  setup() {
    onMounted(() => {
      const viewer = new Cesium.Viewer('cesiumContainer', {
        // 默认渲染
        // useDefaultRenderLoop: false,
        selectionIndicator: false,
        // homeButton: false,
        // sceneModePicker: false,
        // 默认视图 MORPHING:0,COLUMBUS_VIEW:1,SCENE2D:2,SCENE3D:3
        // sceneMode: Cesium.SceneMode.SCENE3D,
        navigationHelpButton: false,
        infoBox: false,
        navigationInstructionsInitiallyVisible: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        allowTextureFilterAnisotropic: false,
        contextOptions: {
            webgl: {
                alpha: false,
                antialias: true,
                preserveDrawingBuffer: true,
                failIfMajorPerformanceCaveat: false,
                depth: true,
                stencil: false,
                anialias: false
            },
        },
        targetFrameRate: 60,
        resolutionScale: 0.1,
        orderIndependentTranslucency: true,
        imageryProvider: undefined,
        // baseLayerPicker: false,
        geocoder: false,
        automaticallyTrackDataSourceClocks: false,
        dataSources: null,
        clock: null,
        terrainShadows: Cesium.ShadowMode.DISABLED
    });
    })
    return {}
  }
})
</script>

<style lang="scss" scoped>
#cesiumContainer {
  position: absolute;
  height: 100%;
  width: 100%;
}
</style>
