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

    static instance = null
    static getInstance() {
        if (!World.instance) {
            console.warn('new World Instance')
            World.instance = new World()
        }
        return World.instance
    }
    static deleteInstance() {
        if (World.instance) {
            console.warn('delete World Instance')
            window.removeEventListener('resize', World.instance.eventListener_resise)
            World.instance = null
        }
    }

    constructor() {

        this.three = {
            renderer: null,
            renderer2: null,
            camera: null,
            scene: null,

            raycaster: null,
            globalClippingPlanes: [],

            stats: new Stats()
        }

        this.cesium = {
            viewer: null
        }
        this.ScreenSpaceEventType = Cesium.ScreenSpaceEventType

        this.cesiumContainer = null
        this.threeContainer = null

        // three 按需渲染
        this.renderEnable = false
        this.renderTimeoutID = null

        this.defaultPosition = [114.43, 30.41, 10000000]

        // event
        this.event_view_changed = new CustomEvent('event_view_changed', {
            detail: {
                mode: null
            }
        });

    }

    init(el) {

        this.cesiumContainer = document.createElement('div')
        this.cesiumContainer.className = 'absolute w-h-full'
        el.appendChild(this.cesiumContainer)

        this.threeContainer = document.createElement('div')
        this.threeContainer.className = 'absolute w-h-full pointer-events-none'
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

        this.isCameraZooming = false

    }

    // ======================================
    initCesium() {

        let extent = Cesium.Rectangle.fromDegrees(
            this.defaultPosition[0] - 20, this.defaultPosition[1] - 20,
            this.defaultPosition[0] + 20, this.defaultPosition[1] + 20);
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
        // this.addScreenSpaceEventHandler((e) => {
        //     that.coordinates(e)
        // }, this.ScreenSpaceEventType.LEFT_CLICK)
        // this.addScreenSpaceEventHandler((e) => {
        // }, this.ScreenSpaceEventType.WHEEL)

        // scene 事件
        const scene = this.cesium.viewer.scene
        scene.preRender.addEventListener(() => {
            that.onPreRender()
        })
        scene.postRender.addEventListener(() => {
            that.onPostRender()
        })

        // 
        this.initCesiumTipDrag()

    }

    addScreenSpaceEventHandler(cb, eventType) {

        let handler = new Cesium.ScreenSpaceEventHandler(this.cesium.viewer.canvas);

        handler.setInputAction((event) => {

            cb(event)

        }, eventType);

    }

    coordinates(event) {
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
            duration: 1
        })
    }

    checkCameraZooming() {

        let viewer = this.cesium.viewer

        if (viewer.scene.mode === Cesium.SceneMode.SCENE3D) {

            let d = Math.floor(
                Cesium.Cartesian3.distance(
                    this.cesium.viewer.camera.position,
                    new Cesium.Cartesian3(0, 0, 0)))

            if (d !== this.__cache__cameraDistanceToCenter) {
                this.isCameraZooming = true
            } else {
                this.isCameraZooming = false
            }

            this.__cache__cameraDistanceToCenter = d

        } else {

            let d = Math.floor(viewer.camera.positionCartographic.height)

            if (d !== this.__cache__cameraHeight) {
                this.isCameraZooming = true
            } else {
                this.isCameraZooming = false
            }

            this.__cache__cameraHeight = d

        }

        // if (this.isCameraZooming) { console.warn('CameraZooming') }

    }

    onPreRender() {

        if (this.isCameraZooming) {
            this.resizeObjects2()
        }

    }
    onPostRender() {

    }

    resizeObjects2() {

        let all = this.cesium.viewer.entities.values

        all.forEach((o) => {
            if (o.__rootParent && o.__rootParent.entity) {
                o.__rootParent.resizeToFixedSize2()
            }
        })

        console.warn('resizeObjects2')

    }

    initCesiumTipDrag() {

        let __cache__pickedEntity = null

        // mousedown
        this.addScreenSpaceEventHandler((e) => {

            let pickedPrimitive = this.cesium.viewer.scene.pick(e.position);
            let pickedEntity = (Cesium.defined(pickedPrimitive)) ? pickedPrimitive.id : undefined;
            if (Cesium.defined(pickedEntity) && Cesium.defined(pickedEntity.label)) {

                __cache__pickedEntity = pickedEntity

                this.cesium.viewer.scene.screenSpaceCameraController.enableTranslate = false
                this.cesium.viewer.scene.screenSpaceCameraController.enableRotate = false;

            }

        }, this.ScreenSpaceEventType.LEFT_DOWN)

        // mousemove
        this.addScreenSpaceEventHandler((e) => {

            if (__cache__pickedEntity) {

                let p0 = e.endPosition
                let p1 = this.cesium.viewer.scene.cartesianToCanvasCoordinates(__cache__pickedEntity.position._value)

                let pLabel = new Cesium.Cartesian2(p0.x - p1.x, p0.y - p1.y)
                let pBillboard = new Cesium.Cartesian2((p0.x - p1.x) / 2, (p0.y - p1.y) / 2)
                let connLength = Cesium.Cartesian2.distance(pLabel, Cesium.Cartesian2.ZERO)
                let connAngle = Cesium.Cartesian2.angleBetween(pLabel, new Cesium.Cartesian2(0, -1))
                if (pLabel.x > 0) { connAngle = - connAngle }

                // 更新 tip 位置
                __cache__pickedEntity.label.pixelOffset = pLabel

                // 更新连接线
                __cache__pickedEntity.billboard.pixelOffset = pBillboard
                __cache__pickedEntity.billboard.height = connLength
                __cache__pickedEntity.billboard.rotation = connAngle

            }

        }, this.ScreenSpaceEventType.MOUSE_MOVE)

        // mouseup
        this.addScreenSpaceEventHandler((e) => {

            __cache__pickedEntity = null

            this.cesium.viewer.scene.screenSpaceCameraController.enableTranslate = true
            this.cesium.viewer.scene.screenSpaceCameraController.enableRotate = true;

        }, this.ScreenSpaceEventType.LEFT_UP)
        
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
        this.three.camera.matrixAutoUpdate = false;
        this.three.camera.aspect = aspect
        this.three.camera.fov = Cesium.Math.toDegrees(this.cesium.viewer.camera.frustum.fovy) // ThreeJS FOV is vertical
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
        this.three.globalClippingPlanes = []
        this.three.renderer.clippingPlanes = this.three.globalClippingPlanes;
        // this.three.renderer.localClippingEnabled = true;

        // 
        this.three.raycaster = new THREE.Raycaster()

        // 单例对象析构时需要 removeEventListener
        let that = this;
        this.eventListener_resise = () => {
            that.onWindowResize()
        }
        window.addEventListener('resize', that.eventListener_resise)

    }

    onWindowResize() {
        let width = this.threeContainer.clientWidth
        let height = this.threeContainer.clientHeight
        let aspect = width / height

        console.log('onWindowResize', width, width)

        this.three.camera.aspect = aspect
        this.three.camera.updateProjectionMatrix()

        this.three.renderer.setSize(width, height)
        this.three.renderer2.setSize(width, height)
    }

    renderCesium() {
        this.cesium.viewer.render();
    }

    renderThree() {

        // this.three.camera.fov = Cesium.Math.toDegrees(this.cesium.viewer.camera.frustum.fovy) // ThreeJS FOV is vertical
        // this.three.camera.updateProjectionMatrix();
        // this.three.camera.matrixAutoUpdate = false;

        // 裁切面，只适用于地表的物体
        if (this.cesium.viewer.scene.mode === Cesium.SceneMode.SCENE3D) {

            if (this.three.globalClippingPlanes.length === 0) {

                this.three.globalClippingPlanes[0] = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)

            }

            let v = this.cesium.viewer.camera.position
            const r = Cesium.Ellipsoid.WGS84.minimumRadius
            let l = r * r / this.__cache__cameraDistanceToCenter

            this.three.globalClippingPlanes[0].set((new THREE.Vector3(v.x, v.y, v.z)).normalize(), -l)

        } else {

            if (this.three.globalClippingPlanes.length > 0) {

                this.three.globalClippingPlanes.length = 0

            }

        }

        this.three.renderer.render(this.three.scene, this.three.camera);
        this.three.renderer2.render(this.three.scene, this.three.camera);

    }

    dqCamera() {

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

        // 另一种方式对齐 camera，仅在地球仪视角有效
        // let c = this.cesium.viewer.camera
        // let c_ = this.three.camera
        // c_.position.set(c.positionWC.x, c.positionWC.y, c.positionWC.z)
        // c_.lookAt(new THREE.Vector3(c.directionWC.x, c.directionWC.y, c.directionWC.z))
        // c_.up.set(c.upWC.x, c.upWC.y, c.upWC.z)
        // this.three.camera.updateProjectionMatrix();

    }

    render() {

        this.renderCesium();

        if (this.renderEnable) {

            this.dqCamera()

            this.checkCameraZooming()
            if (this.isCameraZooming) {
                this.resizeObjects()
            }

            this.renderThree();

        }

        // 由 obejct 在 onBeforeRender 中处理 resize 时:
        // 稳平移，dqCamera 在 renderThree 之前
        // 稳缩放，dqCamera 在 renderThree 之后
        // 稳平移、稳缩放不可兼得
        // 下列写法可以同时 稳平移、稳缩放，但是牺牲效率
        // this.dqCamera()
        // this.renderThree()
        // this.dqCamera()
        // this.renderThree()

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

        // todo 切换时会有偶发的显示错误，暂时使用 flyTo 修复
        this.flyTo(...this.defaultPosition)

        // 
        this.event_view_changed.detail.mode = viewer.scene.mode
        window.dispatchEvent(this.event_view_changed)

    }

    pick(x, y, objects = this.three.scene.children) {

        const pointer = new THREE.Vector2();
        pointer.x = (x / this.threeContainer.clientWidth) * 2 - 1;
        pointer.y = - (y / this.threeContainer.clientHeight) * 2 + 1;

        this.three.raycaster.setFromCamera(pointer, this.three.camera);

        const intersects = this.three.raycaster.intersectObjects(objects, true);

        // let target = null
        // if (intersects.length > 0) {
        //     target = intersects[0].object
        // }

        return intersects

    }

    // 在这里处理效果完美，由 obejct 在 onBeforeRender 中处理 resize 会导致快速缩放时有残影
    resizeObjects() {

        // let cameraHeight = this.cesium.viewer.camera.positionCartographic.height

        this.three.scene.traverseVisible(o => {

            if (
                o.__tag === 'rootMesh' &&
                o.__rootParent
            ) {
                o.__rootParent.resizeToFixedSize()
            }

        })

        console.warn('resizeObjects')

    }
    // ======================================

}

export default World
