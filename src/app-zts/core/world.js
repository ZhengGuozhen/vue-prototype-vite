import * as THREE from 'three/build/three.module.js'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
    CSS2DRenderer,
    CSS2DObject
} from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { jsPlumb } from 'jsplumb'
// import { v4 as uuidv4 } from 'uuid'

import * as Cesium from 'cesium'

class World {

    constructor() {
        this.three = {
            renderer: null,
            renderer2: null,
            camera: null,
            scene: null
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

        this.demoObjects = []
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

        let that = this
        let loop = function () {
            requestAnimationFrame(loop);
            that.render();
        }
        loop()

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

        handler.setInputAction((event) => {
            that.resizeObjects()
        }, Cesium.ScreenSpaceEventType.WHEEL);
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
        this.three.renderer = new THREE.WebGLRenderer({ alpha: true })
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

    dqObject(o, pos) {
        let mode = this.cesium.viewer.scene.mode

        if (mode === Cesium.SceneMode.SCENE3D) {

            let pos_ = Cesium.Cartesian3.fromDegrees(...pos);

            o.position.set(pos_.x, pos_.y, pos_.z)
            o.up.set(0, 0, -6378137)
            o.lookAt(new THREE.Vector3(0, 0, 0));
            o.rotateX(-Math.PI / 2)

        } else if (mode === Cesium.SceneMode.COLUMBUS_VIEW) {

            let p = this.cesium.viewer.scene.mapProjection.project(
                new Cesium.Cartographic(
                    (pos[0] * Math.PI) / 180,
                    (pos[1] * Math.PI) / 180,
                    pos[2]
                )
            )

            o.position.set(p.z, p.x, p.y)
            o.rotation.set(0, Math.PI, Math.PI / 2)

        }
    }
    dqObjects(obejcts) {
        obejcts.forEach(o => {
            this.dqObject(o, o.__data.position)
        })
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

        this.dqObjects(this.demoObjects)

    }

    resizeObjects() {
        console.time('resizeObjects')

        const factor = 0.1

        let cameraHeight = 1
        let mode = this.cesium.viewer.scene.mode
        if (mode === Cesium.SceneMode.SCENE3D) {
            // cemera 高度，两种方法
            // let ellipsoid = this.cesium.viewer.scene.globe.ellipsoid;
            // let cameraHeight = ellipsoid.cartesianToCartographic(this.cesium.viewer.camera.position).height;
            let cartographic = Cesium.Cartographic.fromCartesian(this.cesium.viewer.camera.position)
            cameraHeight = cartographic.height

        } else if (mode === Cesium.SceneMode.COLUMBUS_VIEW) {
            cameraHeight = this.cesium.viewer.camera.position.z
        }

        this.three.scene.traverseVisible(o => {

            if (o.__config && o.__config.fixedSize) {
                // 计算 object 相对于 camera 的 position
                // 由于直接修改了 cemare 的矩阵，camera.position 不正确，此法不可用
                // let v = new THREE.Vector3();
                // let distanceToCamera = v.subVectors(o.position, this.three.camera.position).length()

                // 计算 object 相对于 camera 的 position，可用
                // let m = new THREE.Matrix4()
                // m.multiplyMatrices( this.three.camera.matrixWorldInverse, o.matrixWorld );
                // let position = new THREE.Vector3();
                // position.setFromMatrixPosition(m)
                // let distanceToCamera = position.length()

                let scale = cameraHeight * factor;
                o.scale.set(scale, scale, scale);
            }

        })

        console.timeEnd('resizeObjects')
    }
    // ======================================

    // ======================================
    addTestObjects() {

        // Cesium entity
        const entity = {
            name: 'Polygon',
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray([
                    this.defaultPosition[0] - 1, this.defaultPosition[1] - 1,
                    this.defaultPosition[0] + 1, this.defaultPosition[1] - 1,
                    this.defaultPosition[0] + 1, this.defaultPosition[1] + 1,
                    this.defaultPosition[0] - 1, this.defaultPosition[1] + 1,
                ]),
                material: Cesium.Color.RED.withAlpha(0.2)
            }
        };
        this.cesium.viewer.entities.add(entity);

        // 地心坐标轴
        this.three.scene.add(new THREE.AxesHelper(1e7));

        // 添加一个 object
        let o = this.addThreeObject({
            position: [114, 30, 0]
        })
        this.renderThree()
        this.addThreeObjectTipConn(o)

        // 添加多个 object
        console.time('新建object')
        for (let i = 0; i < 10; i++) {
            let o = this.addThreeObject({
                position: [114 + i / 5, 30, 0]
            })
            this.demoObjects.push(o)
        }
        this.renderThree()
        for (let o of this.demoObjects) {
            this.addThreeObjectTipConn(o)
        }
        console.timeEnd('新建object')

        this.resizeObjects()
        this.timerRender()

    }

    addThreeObject(data) {

        let group = new THREE.Group();
        this.three.scene.add(group);

        // 数据
        let defaultData = {
            position: [114, 30, 0]
        }
        group.__data = defaultData
        Object.assign(group.__data, data)

        // 配置
        group.__config = {
            fixedSize: true
        }

        // 圆锥
        let geometry = new THREE.ConeBufferGeometry(1, 2, 32)
        let material = new THREE.MeshNormalMaterial()
        let Object0 = new THREE.Mesh(geometry, material);
        Object0.scale.set(1, 1, 1);
        group.add(Object0)

        // 平面
        geometry = new THREE.PlaneBufferGeometry(1, 1)
        geometry.rotateX(- Math.PI / 2)
        material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            opacity: 0.1,
        });
        let icon = new THREE.Mesh(geometry, material);
        icon.scale.set(1, 1, 1);
        group.add(icon)

        // 坐标轴
        group.add(new THREE.AxesHelper(2))
        // 网格
        group.add(new THREE.GridHelper(2, 10))

        // tip
        this.addThreeObjectTip(group)

        this.dqObject(group, group.__data.position)

        return group

    }
    addThreeObjectTip(o) {

        // 
        const tipWrapper = document.createElement('div')
        tipWrapper.textContent = ''
        tipWrapper.style = `
pointer-events: none;
height: 0;
width: 0;
`
        // 
        const tipMain = document.createElement('div')
        tipMain.textContent = 'tipMain'
        tipMain.style = `
pointer-events: auto;
position: absolute;
left: 50px;
bottom: 50px;
height: 30px;
width: 60px;
border: solid red 1px;
cursor: pointer;
`
        tipWrapper.appendChild(tipMain)

        // 
        const tipObject = new CSS2DObject(tipWrapper)
        tipObject.position.set(0, 0, 0)
        o.add(tipObject)

        // 
        tipMain.addEventListener('contextmenu', (e) => {
            console.error(e)
            e.preventDefault()
        })

        // 
        if (!o.__tip) {
            o.__tip = {}
        }
        o.__tip.tipWrapper = tipWrapper
        o.__tip.tipMain = tipMain
        o.__tip.tipObject = tipObject

    }
    addThreeObjectTipConn(o) {

        // 需要 render 一下，或者 document.body.appendChild(tipWrapper) 后面才能 plumbIns.connect
        // this.renderThree()

        let source = o.__tip.tipMain
        let target = o.__tip.tipWrapper

        const plumbIns = jsPlumb.getInstance()
        plumbIns.draggable(source)
        let conn = plumbIns.connect({
            source: source,
            target: target,
            paintStyle: { stroke: 'red', strokeWidth: 1, dashstyle: '3' },
            endpoint: "Blank",
            anchor: ["Center"],
            connector: ["Straight"],
        });

        source.__conn = conn

    }

    removeTipAll() {
        this.demoObjects.forEach(o => {
            o.remove(o.__tip.tipObject)
        })
    }
    restoreTipAll() {
        this.demoObjects.forEach(o => {
            o.add(o.__tip.tipObject)
        })
    }
    // ======================================

}

export default World
