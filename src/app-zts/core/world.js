import * as THREE from 'three/build/three.module.js'
import {
    CSS2DRenderer,
    // CSS2DObject
} from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import Stats from 'three/examples/jsm/libs/stats.module.js';
// import { jsPlumb } from 'jsplumb'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { v4 as uuidv4 } from 'uuid'

import * as Cesium from 'cesium'

class World {

    constructor() {

        this.three = {
            renderer: null,
            renderer2: null,
            camera: null,
            scene: null,
            stats: new Stats()
        }

        this.cesium = {
            viewer: null
        }

        this.cesiumContainer = null
        this.threeContainer = null

        // three 按需渲染
        this.renderEnable = false
        this.renderTimeoutID = null

        this.defaultPosition = [114.43, 30.41, 100000]

        // event
        this.event_view_changed = new CustomEvent('event_view_changed', {
            detail: {
                mode: null
            }
        });

    }

    static instance = null
    static getInstance() {
        if (!World.instance) {
            console.warn('new World Instance')
            World.instance = new World()
        }
        return World.instance
    }

    init(el) {

        this.cesiumContainer = document.createElement('div')
        this.cesiumContainer.className = 'absolute w-h-screen'
        el.appendChild(this.cesiumContainer)

        this.threeContainer = document.createElement('div')
        this.threeContainer.className = 'absolute w-h-screen pointer-events-none'
        el.appendChild(this.threeContainer)

        this.initCesium()
        this.initThree()

        this.three.stats.dom.style.pointerEvents = 'auto'
        this.threeContainer.appendChild(this.three.stats.dom)

        let that = this
        let loop = function () {
            requestAnimationFrame(loop);
            that.render();
            that.three.stats.update();
        }
        loop()

        this.three.scene.add(new THREE.AxesHelper(1e7));

    }

    // ======================================
    initCesium() {

        let extent = Cesium.Rectangle.fromDegrees(
            this.defaultPosition[0] - 1, this.defaultPosition[1] - 1,
            this.defaultPosition[0] + 1, this.defaultPosition[1] + 1);
        Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent;
        Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

        this.cesium.viewer = new Cesium.Viewer(this.cesiumContainer, {
            //
            useDefaultRenderLoop: false,

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
                }
            },
            targetFrameRate: 60,
            resolutionScale: 0.1,
            orderIndependentTranslucency: true,
            imageryProvider: undefined,
            //   baseLayerPicker: false,
            geocoder: false,
            automaticallyTrackDataSourceClocks: false,
            dataSources: null,
            clock: null,
            terrainShadows: Cesium.ShadowMode.DISABLED
        })

        // camera 事件
        let that = this
        this.cesium.viewer.camera.percentageChanged = 0.01
        this.cesium.viewer.camera.changed.addEventListener(() => {
            // Gets the event that will be raised when the camera has changed by percentageChanged
            // console.log('camera changed')
            that.timerRender()
        })
        this.cesium.viewer.camera.moveStart.addEventListener(() => {
            // console.log('camera moveStart')
            that.timerRender()
        })
        this.cesium.viewer.camera.moveEnd.addEventListener(() => {
            // console.log('camera moveEnd')
            that.timerRender()
        })

        // 鼠标事件
        let handler = new Cesium.ScreenSpaceEventHandler(this.cesium.viewer.canvas);
        handler.setInputAction((event) => {
            let viewer = this.cesium.viewer

            // 点击点世界坐标 
            let cartesian = viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
            console.log('点击点世界坐标', cartesian);

            // 点击点经纬度
            let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            let lon = Cesium.Math.toDegrees(cartographic.longitude);
            let lat = Cesium.Math.toDegrees(cartographic.latitude);
            console.log('点击点经纬度', lon, lat);

            // 经纬度坐标转世界坐标
            let posWorld = Cesium.Cartesian3.fromDegrees(lon, lat);
            console.log('经纬度转世界坐标', posWorld)

            // 世界坐标转屏幕坐标，两种方法
            let r = viewer.scene.cartesianToCanvasCoordinates(posWorld)
            let r2 = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, posWorld)
            console.log('世界坐标转屏幕坐标', r, r2)

            // 屏幕转世界坐标
            let cartesian3 = viewer.scene.globe.pick(
                viewer.camera.getPickRay(r), viewer.scene);
            console.log('屏幕转世界坐标', cartesian3)

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    }

    flyTo(longitude, latitude, height) {
        let center = Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
        this.cesium.viewer.camera.flyTo({
            destination: center,
            // orientation: {
            //     heading: Cesium.Math.toRadians(0),
            //     pitch: Cesium.Math.toRadians(-60),
            //     roll: Cesium.Math.toRadians(0)
            // },
            duration: 3
        })
    }
    // ======================================

    // ======================================
    initThree() {

        let fov = 45

        let width = this.threeContainer.clientWidth
        let height = this.threeContainer.clientHeight
        let aspect = width / height

        let near = 1
        let far = 10 * 1000 * 1000 * 100

        // scene
        this.three.scene = new THREE.Scene()

        // camera
        this.three.camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
        this.three.camera.aspect = aspect
        this.three.camera.updateProjectionMatrix()

        // renderer1
        this.three.renderer = new THREE.WebGLRenderer({
            alpha: true,
            logarithmicDepthBuffer: true
        })
        this.three.renderer.setSize(width, height)
        this.threeContainer.appendChild(this.three.renderer.domElement)

        // renderer2
        this.three.renderer2 = new CSS2DRenderer()
        this.three.renderer2.setSize(width, height)
        this.three.renderer2.domElement.style.position = 'absolute'
        this.three.renderer2.domElement.style.top = '0'
        this.three.renderer2.domElement.style.left = '0'
        this.threeContainer.appendChild(this.three.renderer2.domElement)

        // 
        const globalClippingPlanes = [
            new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
        ]
        this.three.renderer.clippingPlanes = globalClippingPlanes;
        // this.three.renderer.localClippingEnabled = true;

        // 
        let that = this;
        window.addEventListener('resize', () => {
            that.onWindowResize()
        });

    }

    onWindowResize() {
        let width = this.threeContainer.clientWidth
        let height = this.threeContainer.clientHeight
        let aspect = width / height

        console.log('onWindowResize', width, width)

        this.three.camera.aspect = aspect
        this.three.renderer.setSize(width, height)
        this.three.renderer2.setSize(width, height)
    }

    renderCesium() {
        this.cesium.viewer.render();
    }

    renderThree() {
        this.three.camera.fov = Cesium.Math.toDegrees(this.cesium.viewer.camera.frustum.fovy) // ThreeJS FOV is vertical
        this.three.camera.updateProjectionMatrix();

        this.three.camera.matrixAutoUpdate = false;
        let cvm = this.cesium.viewer.camera.viewMatrix;
        let civm = this.cesium.viewer.camera.inverseViewMatrix;
        this.three.camera.matrixWorld.set(
            civm[0], civm[4], civm[8], civm[12],
            civm[1], civm[5], civm[9], civm[13],
            civm[2], civm[6], civm[10], civm[14],
            civm[3], civm[7], civm[11], civm[15]
        );
        this.three.camera.matrixWorldInverse.set(
            cvm[0], cvm[4], cvm[8], cvm[12],
            cvm[1], cvm[5], cvm[9], cvm[13],
            cvm[2], cvm[6], cvm[10], cvm[14],
            cvm[3], cvm[7], cvm[11], cvm[15]
        );
        // three.camera.lookAt(new THREE.Vector3(0, 0, 0));

        
        // 裁切面
        let v = this.cesium.viewer.camera.position
        this.three.renderer.clippingPlanes[0].set(new THREE.Vector3(v.x, v.y, v.z), 0)


        this.three.renderer.render(this.three.scene, this.three.camera);
        this.three.renderer2.render(this.three.scene, this.three.camera);
    }

    render() {
        this.renderCesium();
        if (this.renderEnable) {
            this.renderThree();
        }
    }

    timerRender(time = 1000) {
        if (this.renderTimeoutID) {
            clearTimeout(this.renderTimeoutID)
            this.renderTimeoutID = null
        }

        this.renderEnable = true
        this.renderTimeoutID = setTimeout(() => {
            this.renderEnable = false
        }, time)
    }

    changeView() {

        const viewer = this.cesium.viewer

        // 获取 scene mode
        console.log('scene.mode', viewer.scene.mode)

        // 设置 scene mode 立即生效
        if (viewer.scene.mode === Cesium.SceneMode.SCENE3D) {

            viewer.scene.mode = Cesium.SceneMode.COLUMBUS_VIEW

        } else {

            viewer.scene.mode = Cesium.SceneMode.SCENE3D

        }

        // 
        this.event_view_changed.detail.mode = viewer.scene.mode
        window.dispatchEvent(this.event_view_changed)

    }
    // ======================================



    // 弃用，由 obejct 自己管理 resize
    resizeObjects(object) {

        let o
        object ? o = object : o = this.three.scene

        const factor = 0.1

        // 弃用
        /*
        let cameraHeight = 1
        let mode = this.cesium.viewer.scene.mode
        if (mode === Cesium.SceneMode.SCENE3D) {
            // cemera 高度，3种方法
            // let ellipsoid = this.cesium.viewer.scene.globe.ellipsoid;
            // let cameraHeight = ellipsoid.cartesianToCartographic(this.cesium.viewer.camera.position).height;
            
            // let cartographic = Cesium.Cartographic.fromCartesian(this.cesium.viewer.camera.position)
            // cameraHeight = cartographic.height

            cameraHeight = this.cesium.viewer.camera.positionCartographic.height

        } else if (mode === Cesium.SceneMode.COLUMBUS_VIEW) {
            cameraHeight = this.cesium.viewer.camera.position.z
        }
        */

        let cameraHeight = this.cesium.viewer.camera.positionCartographic.height

        console.time('resizeObjects cameraHeight:' + cameraHeight)

        o.traverseVisible(o => {

            if (
                o.__data &&
                o.__data.config &&
                o.__data.config.fixedSize
            ) {
                // 计算 object 相对于 camera 的 position
                // 由于直接修改了 cemare 的矩阵，camera.position 不正确，此法不可用
                // let v = new THREE.Vector3();
                // let distanceToCamera = v.subVectors(o.position, this.three.camera.position).length()

                // 计算 object 相对于 camera 的 position，可用，较慢
                // let m = new THREE.Matrix4()
                // m.multiplyMatrices(this.three.camera.matrixWorldInverse, o.matrixWorld);
                // let position = new THREE.Vector3();
                // position.setFromMatrixPosition(m)
                // let distanceToCamera = position.length()
                // let scale = distanceToCamera * factor;
                // o.scale.set(scale, scale, scale);

                // 计算 object 相对于 camera 的 position，可用，较快
                // let cameraPos = this.cesium.viewer.camera.position
                // let cameraPos_ = new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z)
                // let v = new THREE.Vector3();
                // let distanceToCamera = v.subVectors(
                //     o.position, cameraPos_).length()
                // let scale = distanceToCamera * factor;
                // o.scale.set(scale, scale, scale);

                // 计算 object 到 camera 平面的距离，可用，准确
                let camera = this.cesium.viewer.camera
                let cameraPlane = Cesium.Plane.fromPointNormal(camera.position, camera.directionWC)
                let pos = new Cesium.Cartesian3(o.position.x, o.position.y, o.position.z)
                let distance = Cesium.Plane.getPointDistance(cameraPlane, pos)
                let scale = distance * factor;
                o.scale.set(scale, scale, scale);

                // 计算 cemera 相对地表的高度，可用，快速，但是旋转视角后结果错误
                // let scale = cameraHeight * factor;
                // o.scale.set(scale, scale, scale);
            }

        })

        console.timeEnd('resizeObjects cameraHeight:' + cameraHeight)

    }

}

export default World
