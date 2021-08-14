import * as THREE from 'three/build/three.module.js'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { jsPlumb } from 'jsplumb'
import { v4 as uuid } from 'uuid'

import * as Cesium from 'cesium'
import World from './World.js'

class BaseObjectData {

    constructor(d) {

        this.id = uuid()
        this.position = [114, 30, 0]
        this.fixedSize = true
        this.size = 0.05
        this.cssTip = true

        this.iconUrl = '/image/flag_cn.png'
        this.iconRotation = [0, - Math.PI / 2, 0]

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

        // 
        this.world = World.getInstance()
        this.cesium = this.world.cesium
        this.three = this.world.three
        this.currentViewerSceneMode = null

        // 
        this.tip = {
        }

        // 
        this.icon = null

        // 
        this.__data = d

        this.init(d)

    }

    init(d) {

        let o = this.mesh;

        // 平面
        if (d.iconUrl) {
            let texture = new THREE.TextureLoader().load(d.iconUrl);
            let material = new THREE.MeshBasicMaterial({ map: texture });

            let geometry = new THREE.PlaneBufferGeometry(1, 1)
            geometry.rotateX(- Math.PI / 2)

            let icon = new THREE.Mesh(geometry, material);
            icon.scale.set(1, 1, 1);
            icon.rotation.set(...d.iconRotation)
            o.add(icon)

            this.icon = icon
            this.icon.__rootParent = this
        }

        // 坐标轴
        // o.add(new THREE.AxesHelper(2))
        // 网格
        // o.add(new THREE.GridHelper(2, 10))

        // tip
        if (d.cssTip) {

            this.addCssTip()

        }

    }

    onMeshBeforeRender() {

        // 切换 scene.mode 时执行一次
        if (this.currentViewerSceneMode !== this.cesium.viewer.scene.mode) {
            this.dq()
            this.currentViewerSceneMode = this.cesium.viewer.scene.mode
        }

        // resize
        if (this.__data.fixedSize) {

            let o = this.mesh

            let factor = this.__data.size

            let mode = this.cesium.viewer.scene.mode

            if (mode === Cesium.SceneMode.SCENE3D) {

                // 计算 object 到 camera 平面的距离，可用，准确
                let camera = this.cesium.viewer.camera
                let cameraPlane = Cesium.Plane.fromPointNormal(camera.position, camera.directionWC)
                let pos = new Cesium.Cartesian3(o.position.x, o.position.y, o.position.z)
                let distance = Cesium.Plane.getPointDistance(cameraPlane, pos)
                let scale = distance * factor;
                o.scale.set(scale, scale, scale);

            } else if (mode === Cesium.SceneMode.COLUMBUS_VIEW) {

                let cameraHeight = this.cesium.viewer.camera.positionCartographic.height
                let scale = cameraHeight * factor;
                o.scale.set(scale, scale, scale);

            }

        }

        // 球面另一边不显示
        if (this.cesium.viewer.scene.mode === Cesium.SceneMode.SCENE3D) {

            let cameraPos = this.cesium.viewer.camera.positionCartographic
            let cameraPos_ = Cesium.Cartesian3.fromRadians(cameraPos.longitude, cameraPos.latitude, 0)

            let a = new THREE.Vector3(cameraPos_.x, cameraPos_.y, cameraPos_.z)
            let b = this.mesh.position
            let d = a.distanceTo(b)
            const r = 6378137 * 1.414

            let object_at_front
            if (d > r) {
                object_at_front = false
            } else {
                object_at_front = true
            }

            if (object_at_front !== this.__cache__object_at_front) {
                object_at_front ? this.restoreCssTip() : this.removeCssTip()
            }
            this.__cache__object_at_front = object_at_front

        }

    }

    dq() {

        let o = this.mesh
        let pos = this.__data.position

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
    <div class="pointer-events-auto border-2 border-red-400 bg-gray-500 whitespace-nowrap">${this.__data.id}</div>
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

    removeCssTip() {
        if (this.tip.tipObject) {
            this.mesh.remove(this.tip.tipObject)
            this.world.timerRender()
        }
    }
    restoreCssTip() {
        if (this.tip.tipObject) {
            this.mesh.add(this.tip.tipObject)
            this.world.timerRender()
        }
    }
    toggleCssTip() {
        if (!this.tip.tipObject) {
            return
        }

        if (this.tip.tipObject.parent) {
            this.removeCssTip()
        } else {
            this.restoreCssTip()
        }
        this.world.timerRender()
    }

    restore() {
        if (this.hub) {
            this.hub.rootGroup.add(this.mesh)
        } else {
            this.three.scene.add(this.mesh)
        }
        this.restoreCssTip()
    }
    remove() {
        if (this.mesh.parent) {
            this.mesh.parent.remove(this.mesh)
            this.removeCssTip()
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
    }

    restoreAll() {
        this.indexObjectID.forEach(o => {
            o.restore()
        })
    }

    removeCssTipAll() {
        this.indexObjectID.forEach(o => {
            o.removeCssTip()
        })
    }

    restoreCssTipAll() {
        this.indexObjectID.forEach(o => {
            o.restoreCssTip()
        })
    }

    pick(x, y) {

        const intersects = this.world.pick(x, y, this.rootGroup.children);

        let objects = []

        intersects.forEach( i => {
            if (i.object.__rootParent) {
                objects.push(i.object.__rootParent)
            }
        })

        return objects

    }

}

export { BaseObject, BaseObjectData, BaseObjectHub }