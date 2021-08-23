import * as THREE from 'three/build/three.module.js'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { jsPlumb } from 'jsplumb'
import { v4 as uuid } from 'uuid'

import * as Cesium from 'cesium'
import World from './World.js'
import Resource from './Resource.js'

class BaseObjectData {

    constructor(d) {

        this.id = d.id || uuid()
        this.position = [114, 30, 0]
        this.fixedSize = true
        this.size = 0.05

        this.icon = {
            show: true,
            url: './image/ship.png',
            rotation: 0
        }

        // three
        this.cssTip = {
            show: true,
            defaultValue: this.id
        }

        // cesium
        this.entityTip = {
            show: true,
            defaultValue: this.id
        }

        Object.assign(this, d)

    }

}

class BaseObject {

    constructor(d = new BaseObjectData) {

        // 
        this.hub = null

        // 
        this.resource = Resource.getInstance()
        this.world = World.getInstance()
        this.cesium = this.world.cesium
        this.three = this.world.three
        this.currentViewerSceneMode = null

        // 
        this.__data = d

        // three
        this.mesh = null
        this.tip = {}
        this.icon = null
        this.init(d)

        // cesium
        this.entity = null
        this.entityTip = null
        this.init2(d)

    }

    // three
    // ===================================
    init(d) {

        this.addMeshMain(d)

    }

    addMeshMain(d) {

        const that = this

        // 
        this.mesh = new THREE.Mesh()
        this.mesh.frustumCulled = false
        this.mesh.onBeforeRender = () => {
            that.onMeshBeforeRender()
        }

        // 
        this.mesh.__rootParent = this
        this.mesh.__tag = 'RootMesh'

        // 平面
        if (d.icon.show) {
            let material = this.resource.getMaterialTexture(d.icon.url);
            let geometry = this.resource.getGeometry('plane')

            let iconObject = new THREE.Mesh(geometry, material);
            iconObject.scale.set(1, 1, 1);
            this.mesh.add(iconObject)

            this.icon = iconObject
            this.icon.__rootParent = this

            // 默认旋转
            this._rotateIcon(d.icon.rotation)
        }

        // tip
        if (d.cssTip.show) {

            this.addCssTip()

        }

        // 坐标轴
        // this.mesh.add(new THREE.AxesHelper(2))
        // 网格
        // this.mesh.add(new THREE.GridHelper(2, 10))

    }
    addCssTip() {

        // 
        const tipWrapper = document.createElement('div')
        tipWrapper.style = `
pointer-events: none;
height: 0;
width: 0;
user-select: none;
`
        tipWrapper.textContent = ''

        // 
        const tipBody = document.createElement('div')
        tipBody.style = `
pointer-events: none;
position: absolute;
left: -50px;
top: -60px;
`
        tipBody.innerHTML = `
<div class="flex flex-row items-start cursor-pointer text-white">
    <div class="pointer-events-auto border-2 border-red-400 bg-gray-500 whitespace-nowrap">${this.__data.cssTip.defaultValue}</div>
    <div class="pointer-events-auto border-2 border-red-400 bg-gray-500 w-24">slot1 slot1 slot1 slot1</div>
<div>
`

        tipWrapper.appendChild(tipBody)

        // 
        const tipObject = new CSS2DObject(tipWrapper)
        tipObject.position.set(0, 0, 0)
        this.mesh.add(tipObject)

        // 
        tipBody.addEventListener('contextmenu', (e) => {
            console.error(e)
            e.preventDefault()
        })

        // 
        this.tip.tipWrapper = tipWrapper
        this.tip.tipBody = tipBody
        this.tip.tipObject = tipObject

        // 
        this.tip.tipObject.onAfterRender = () => {

            if (!this.tip.tipBody.conn) {

                this.addCssTipConn()

                this.tip.tipObject.onAfterRender = () => { }

            }

        }

    }
    addCssTipConn() {

        // 需要 render 一下，或者 document.body.appendChild(tipWrapper) 后面才能 plumbIns.connect
        // document.body.appendChild(this.tip.tipWrapper)
        // this.world.renderThree()

        let source = this.tip.tipBody
        let target = this.tip.tipWrapper

        const plumbIns = jsPlumb.getInstance()
        plumbIns.draggable(source)
        let conn = plumbIns.connect({
            source: source,
            target: target,
            paintStyle: { stroke: 'red', strokeWidth: 1, dashstyle: '3' },
            endpoint: "Blank",
            // anchor: ["Center"],
            // anchor: "AutoDefault",
            // anchor: ["Perimeter", { shape: "Circle" }],
            anchor: ["Perimeter", { shape: "Square" }],
            connector: ["Straight"],
        });

        source.conn = conn

    }

    onMeshBeforeRender() {

        // 对齐，切换 scene.mode 时执行一次
        if (this.currentViewerSceneMode !== this.cesium.viewer.scene.mode) {
            this.dq()
            this.currentViewerSceneMode = this.cesium.viewer.scene.mode
        }

        // 首次渲染，resize
        if (!this.__cache__resized) {
            this.resizeToFixedSize()
            this.__cache__resized = true
        }

        // 地平线背面不显示
        if (this.cesium.viewer.scene.mode === Cesium.SceneMode.SCENE3D) {

            let cameraPos = this.cesium.viewer.camera.positionCartographic
            let cameraPos_ = Cesium.Cartesian3.fromRadians(cameraPos.longitude, cameraPos.latitude, 0)

            let a = new THREE.Vector3(cameraPos_.x, cameraPos_.y, cameraPos_.z)
            let b = this.mesh.position
            let d = a.distanceTo(b)

            const r = Cesium.Ellipsoid.WGS84.minimumRadius
            let max = Math.sin(Math.acos(r / this.world.__cache__cameraDistanceToCenter) / 2) * r * 2

            let object_at_front
            if (d > max) {
                object_at_front = false
            } else {
                object_at_front = true
            }

            // 当前 cssTip 显隐状态
            let cssTipShow = this.tip.tipObject.parent

            if (!object_at_front && cssTipShow) {
                this.removeCssTip()
                this.__cache__进入背面时临时隐藏CssTip = true
            }

            if (object_at_front && this.__cache__进入背面时临时隐藏CssTip) {
                this.restoreCssTip()
                this.__cache__进入背面时临时隐藏CssTip = false
            }

        }

    }

    resizeToFixedSize() {

        if (this.__data.fixedSize) {

            let o = this.mesh

            let factor = this.__data.size

            let mode = this.cesium.viewer.scene.mode

            if (mode === Cesium.SceneMode.SCENE3D) {

                // 根据 object 到 camera 平面的距离计算，可用，准确
                let camera = this.cesium.viewer.camera
                let cameraPlane = Cesium.Plane.fromPointNormal(camera.position, camera.directionWC)
                let pos = new Cesium.Cartesian3(o.position.x, o.position.y, o.position.z)
                let distance = Cesium.Plane.getPointDistance(cameraPlane, pos)
                let scale = distance * factor;
                o.scale.set(scale, scale, scale);

            } else if (mode === Cesium.SceneMode.COLUMBUS_VIEW) {

                // 根据 camera 高度计算，仅适用于 camera 方向垂直向下的情况
                let cameraHeight = this.cesium.viewer.camera.positionCartographic.height
                let scale = cameraHeight * factor;
                o.scale.set(scale, scale, scale);

            }

        }

    }

    dq() {

        let o = this.mesh
        let pos = this.__data.position

        let mode = this.cesium.viewer.scene.mode

        if (mode === Cesium.SceneMode.SCENE3D) {

            let pos_ = Cesium.Cartesian3.fromDegrees(...pos);

            o.position.set(pos_.x, pos_.y, pos_.z)
            o.up.set(0, 0, - Cesium.Ellipsoid.WGS84.minimumRadius)
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

    removeCssTip(r = false) {
        if (this.tip.tipObject) {
            this.mesh.remove(this.tip.tipObject)

            if (r) { this.world.timerRender() }
        }
    }
    restoreCssTip(r = false) {
        if (this.tip.tipObject) {
            this.mesh.add(this.tip.tipObject)

            if (r) { this.world.timerRender() }
        }
    }
    toggleCssTip(r = false) {
        if (!this.tip.tipObject) {
            return
        }

        if (this.tip.tipObject.parent) {
            this.removeCssTip()
        } else {
            this.restoreCssTip()
        }

        if (r) { this.world.timerRender() }
    }

    _restore(r = false) {
        if (this.hub) {
            this.hub.rootGroup.add(this.mesh)
        } else {
            this.three.scene.add(this.mesh)
        }
        this.restoreCssTip()

        this.resizeToFixedSize()

        if (r) { this.world.timerRender() }
    }
    _remove(r = false) {
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh)
            this.removeCssTip()

            if (r) { this.world.timerRender() }
        }
    }
    _rotateIcon(course, r = false) {

        if (!this.icon) { return }

        this.icon.rotation.set(0, - course * Math.PI / 180, 0)

        if (r) { this.world.timerRender() }

    }
    _update(d, r = false) {

        let { longitude, latitude, altitude, course } = d

        // 更新位置
        if (longitude && latitude) {

            this.__data.position = [longitude, latitude, altitude || 0]

            this.dq()

        }

        // 更新旋转
        if (course) {

            this._rotateIcon(course)

        }

        if (r) { this.world.timerRender() }

    }
    // ===================================

    // cesium
    // ===================================
    init2(d) {

        this.addEntityMain(d)

    }

    addEntityMain(d) {

        // 平面
        if (d.icon.show) {

            this.entity = new Cesium.Entity({
                id: uuid(),
                name: d.id,
                position: Cesium.Cartesian3.fromDegrees(...d.position),

                ellipse: {
                    semiMinorAxis: 100000,
                    semiMajorAxis: 100000,
                    fill: true,
                    // material: Cesium.Color.BLUE.withAlpha(0.5),
                    material: new Cesium.ImageMaterialProperty({
                        image: d.icon.url,
                        transparent: true,
                    }),
                    outline: true,
                    outlineColor: Cesium.Color.YELLOW,
                    outlineWidth: 2.0,
                    stRotation: 0
                },

                // 无法旋转
                // box: {
                //     dimensions: new Cesium.Cartesian3(1000000, 1000000, 1),
                //     material: new Cesium.ImageMaterialProperty({
                //         image: d.icon.url,
                //         transparent: true,
                //     }),
                //     outline: true,
                //     outlineColor: Cesium.Color.YELLOW,
                //     outlineWidth: 2.0,
                // }
            })
            this.cesium.viewer.entities.add(this.entity);

            // 
            this.entity.__rootParent = this
            this.entity.__tag = 'EntityMain'

            // 默认旋转
            this._rotateIcon2(d.icon.rotation)

        }

        if (d.entityTip.show) {

            this.addEntityTip()

        }


        /*
        // primitive 弃用
        // primitive 的材质透明效果不好，重叠会错乱
        // primitive.modelMatrix 只支持3d模式
        let instance = new Cesium.GeometryInstance({
            geometry: new Cesium.BoxGeometry({
                maximum: new Cesium.Cartesian3(1, 1, 1),
                minimum: new Cesium.Cartesian3(-1, -1, -1)
            })
        });
        let primitive = this.cesium.viewer.scene.primitives.add(new Cesium.Primitive({
            geometryInstances: instance,
            appearance: new Cesium.MaterialAppearance({
                material: Cesium.Material.fromType('Image', {
                    image: './image/ship.png'
                }),
                flat: true,
                faceForward: true,
            }),
            modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(114, 20))
        }));
        // 位置
        primitive.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(114 + Math.random()*3, 20 + Math.random()*3))
        // 缩放
        Cesium.Matrix4.multiplyByScale(primitive.modelMatrix, new Cesium.Cartesian3(100000,100000,1), primitive.modelMatrix)
        this.primitive = primitive
        */

    }

    addEntityTip() {

        let d = this.__data

        const options = {
            id: uuid(),
            name: d.id,
            position: Cesium.Cartesian3.fromDegrees(...d.position),

            label: {
                text: d.entityTip.defaultValue,
                pixelOffset: new Cesium.Cartesian2(0, 50),
                scale: 0.8,

                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                // 完全透明，需要点击到文字上触发交互
                // showBackground: true,
                // backgroundColor: Cesium.Color.BLACK.withAlpha(0.1),
                // backgroundPadding: new Cesium.Cartesian2(8, 4),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
            billboard: {
                pixelOffset: new Cesium.Cartesian2(0, 25),
                rotation: 0,

                image: './image/line.png',
                color: Cesium.Color.RED,
                width: 1,
                height: 50,
            },
        };

        this.entityTip = new Cesium.Entity(options)
        this.cesium.viewer.entities.add(this.entityTip);

        // 
        this.entityTip.__rootParent = this
        this.entityTip.__tag = 'EntityTip'

    }

    resizeToFixedSize2() {

        if (this.__data.fixedSize) {

            // 
            let o = this.entity.ellipse

            let factor = this.__data.size

            let mode = this.cesium.viewer.scene.mode

            if (mode === Cesium.SceneMode.SCENE3D) {

                // 根据 object 到 camera 平面的距离计算，可用，准确
                let camera = this.cesium.viewer.camera
                let cameraPlane = Cesium.Plane.fromPointNormal(camera.position, camera.directionWC)
                let pos = this.entity.position._value
                let distance = Cesium.Plane.getPointDistance(cameraPlane, pos)
                let scale = distance * factor;

                o.semiMinorAxis.setValue(scale)
                o.semiMajorAxis.setValue(scale)

            } else if (mode === Cesium.SceneMode.COLUMBUS_VIEW) {

                // 根据 camera 高度计算，仅适用于 camera 方向垂直向下的情况
                let cameraHeight = this.cesium.viewer.camera.positionCartographic.height
                let scale = cameraHeight * factor;

                o.semiMinorAxis.setValue(scale)
                o.semiMajorAxis.setValue(scale)

            }

        }

    }

    _restore2() {
        this.entity.show = true
        this.entityTip.show = true
    }
    _remove2() {
        this.entity.show = false
        this.entityTip.show = false
    }
    _rotateIcon2(course) {

        if (!this.entity) { return }

        this.entity.ellipse.stRotation.setValue(course * Math.PI / 180)

    }
    _update2(d) {

        let { longitude, latitude, altitude, course } = d

        // 更新位置
        if (longitude && latitude) {

            this.__data.position = [longitude, latitude, altitude || 0]

            this.entity.position.setValue(Cesium.Cartesian3.fromDegrees(...this.__data.position))
            this.entityTip.position.setValue(Cesium.Cartesian3.fromDegrees(...this.__data.position))

        }

        // 更新旋转
        if (course) {

            this._rotateIcon2(course)

        }

    }
    // ===================================

    // public
    // ===================================
    restore(r = false) {

        if (this.mesh) {
            this._restore(r)
        }

        if (this.entity) {
            this._restore2()
        }

    }
    remove(r = false) {

        if (this.mesh) {
            this._remove(r)
        }

        if (this.entity) {
            this._remove2()
        }

    }
    rotateIcon(course, r = false) {

        if (this.mesh) {
            this._rotateIcon(course, r)
        }

        if (this.entity) {
            this._rotateIcon2(course)
        }

    }
    update(d, r = false) {

        if (this.mesh) {
            this._update(d, r)
        }

        if (this.entity) {
            this._update2(d)
        }

    }
    // ===================================

}

class BaseObjectHub {

    constructor(name = 'BaseObjectHub') {

        this.name = name

        this.world = World.getInstance()
        this.three = this.world.three
        this.cesium = this.world.cesium

        this.rootGroup = new THREE.Group()
        this.world.three.scene.add(this.rootGroup)

        this.indexObjectID = new Map()

    }

    // three
    // ===================================
    setEnable(enable) {
        if (enable) {
            this.three.scene.add(this.rootGroup)
        } else {
            this.three.scene.remove(this.rootGroup)
        }

        this.world.timerRender()
    }

    addObject(o) {

        o.hub = this

        this.indexObjectID.set(o.__data.id, o)

        // 默认显示
        if (o.mesh) {
            this.rootGroup.add(o.mesh)
        }

    }

    getObjectByID(id) {
        return this.indexObjectID.get(id)
    }

    getObjectAll() {
        return [...this.indexObjectID.values()]
    }

    removeAll() {
        this.indexObjectID.forEach(o => {
            o.remove()
        })

        this.world.timerRender()
    }

    restoreAll() {
        this.indexObjectID.forEach(o => {
            o.restore()
        })

        this.world.timerRender()
    }

    removeCssTipAll() {
        this.indexObjectID.forEach(o => {
            o.removeCssTip()
        })

        this.world.timerRender()
    }

    restoreCssTipAll() {
        this.indexObjectID.forEach(o => {
            o.restoreCssTip()
        })

        this.world.timerRender()
    }

    pick(x, y) {

        let objects = []

        const intersects = this.world.pick(x, y, this.rootGroup.children);

        intersects.forEach(i => {
            if (i.object.__rootParent) {
                objects.push(i.object.__rootParent)
            }
        })

        return objects

    }
    // ===================================

    // cesium
    // ===================================
    pick2(x, y) {

        let objects = []

        let pickedPrimitive = this.cesium.viewer.scene.pick(new Cesium.Cartesian2(x, y));
        let pickedEntity = (Cesium.defined(pickedPrimitive)) ? pickedPrimitive.id : undefined;

        if (Cesium.defined(pickedEntity) && pickedEntity.__rootParent) {
            objects.push(pickedEntity.__rootParent)
        }

        return objects

    }
    // ===================================


    createObjects(n) {
        console.time('批量创建object')

        for (let i = 0; i < n; i++) {
            let o = new BaseObject(new BaseObjectData({
                id: 'BaseObject-' + i,
                position: [114 + i / 10, 30, 0]
            }))
            this.addObject(o)
        }

        console.timeEnd('批量创建object')
    }

    updateObjects(data) {
        console.time('批量更新object')

        this.indexObjectID.forEach(o => {

            let p = {
                longitude: o.__data.position[0] + 0.1,
                latitude: o.__data.position[1],
                altitude: o.__data.position[2],
                course: 30,
            }

            o.update(p)

        })

        console.timeEnd('批量更新object')
    }
}

export { BaseObject, BaseObjectData, BaseObjectHub }