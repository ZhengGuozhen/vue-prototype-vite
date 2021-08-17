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

        this.cssTip = {
            show: true,
            defaultValue: this.id
        }

        this.icon = {
            show: true,
            url: '/image/flag_cn.png',
            rotation: 45
        }

        this.CACHE = {
        }

        Object.assign(this, d)

    }

}

class BaseObject {

    constructor(d = new BaseObjectData) {

        const that = this

        // 
        this.hub = null

        // 
        this.mesh = new THREE.Mesh()
        this.mesh.frustumCulled = false
        this.mesh.onBeforeRender = () => {
            that.onMeshBeforeRender()
        }
        this.mesh.__rootParent = this
        this.mesh.__tag = 'rootMesh'

        // 
        this.resource = Resource.getInstance()
        this.world = World.getInstance()
        this.cesium = this.world.cesium
        this.three = this.world.three
        this.currentViewerSceneMode = null

        // 
        this.tip = {}

        // 
        this.icon = null

        // 
        this.__data = d

        this.init(d)


        // test ================================
        // cesium entity 不适合进行动态操作
        const entity = {
            name: 'entity-0',
            position: Cesium.Cartesian3.fromDegrees(...d.position),
            ellipse: {
                semiMinorAxis: 5000,
                semiMajorAxis: 8000,
                fill: false,
                outline: true,
                outlineColor: Cesium.Color.YELLOW,
                outlineWidth: 2.0,
                // material: Cesium.Color.BLUE.withAlpha(0.5)
                material: '/image/flag_cn.png',
                rotation: -Math.PI / 4
            },
            // polygon: {
            //     hierarchy: Cesium.Cartesian3.fromDegreesArray([
            //         d.position[0] - 1, d.position[1] - 1,
            //         d.position[0] + 1, d.position[1] - 1,
            //         d.position[0] + 1, d.position[1] + 1,
            //         d.position[0] - 1, d.position[1] + 1,
            //     ]),
            //     material: Cesium.Color.RED.withAlpha(0.2)
            // },
            // billboard: {
            //     image: '/image/flag_cn.png',
            //     width: 64,
            //     height: 64,
            //     rotation: -Math.PI/4
            // }
        };
        this.entity = this.cesium.viewer.entities.add(entity);

        // 精灵对象不正常，与 three camera 有关
        // const sprite = new THREE.Sprite(this.resource.getMaterialTexture(d.icon.url));
        // sprite.scale.set(5, 5, 5)
        // this.mesh.add(sprite);

        // test ================================

    }

    init(d) {

        let o = this.mesh;

        // 平面
        if (d.icon.show) {
            let material = this.resource.getMaterialTexture(d.icon.url);
            let geometry = this.resource.getGeometry('plane')

            let iconObject = new THREE.Mesh(geometry, material);
            iconObject.scale.set(1, 1, 1);
            o.add(iconObject)

            this.icon = iconObject
            this.icon.__rootParent = this

            this.rotateIcon(d.icon.rotation)
        }

        // 坐标轴
        // o.add(new THREE.AxesHelper(2))
        // 网格
        // o.add(new THREE.GridHelper(2, 10))

        // tip
        if (d.cssTip.show) {

            this.addCssTip()

        }

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
    <div class="pointer-events-auto border-2 border-red-400 bg-gray-500 w-24">slot2 slot2 slot2 slot2 slot2</div>
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


    rotateIcon(course, r = false) {
        this.icon.rotation.set(0, - course * Math.PI / 180, 0)

        if (r) { this.world.timerRender() }
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

    restore(r = false) {
        if (this.hub) {
            this.hub.rootGroup.add(this.mesh)
        } else {
            this.three.scene.add(this.mesh)
        }
        this.restoreCssTip()

        if (r) { this.world.timerRender() }
    }
    remove(r = false) {
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh)
            this.removeCssTip()

            if (r) { this.world.timerRender() }
        }
    }

}

class BaseObjectHub {

    constructor(name = 'BaseObjectHub') {

        this.name = name

        this.world = World.getInstance()

        this.rootGroup = new THREE.Group()
        this.world.three.scene.add(this.rootGroup)

        this.indexObjectID = new Map()

    }

    setEnable(enable) {
        if (enable) {
            World.getInstance().three.scene.add(this.rootGroup)
        } else {
            World.getInstance().three.scene.remove(this.rootGroup)
        }

        this.world.timerRender()
    }

    addObject(o) {

        o.hub = this

        this.indexObjectID.set(o.__data.id, o)

        // 默认显示
        this.rootGroup.add(o.mesh)

    }

    getObjectByID(id) {
        return this.indexObjectID.get(id)
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

        const intersects = this.world.pick(x, y, this.rootGroup.children);

        let objects = []

        intersects.forEach(i => {
            if (i.object.__rootParent) {
                objects.push(i.object.__rootParent)
            }
        })

        return objects

    }

}

export { BaseObject, BaseObjectData, BaseObjectHub }