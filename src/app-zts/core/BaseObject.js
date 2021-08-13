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

        this.userData = {
        }

        Object.assign(this, d)

    }
    
}

class BaseObject {

    static __rootGroup = new THREE.Group()

    static __objects = new Map()

    static setEnable = (enable) => {
        if (enable) {
            World.getInstance().three.scene.add(BaseObject.__rootGroup)
        } else {
            World.getInstance().three.scene.remove(BaseObject.__rootGroup)
        }
    }

    static getObjectByID = (id) => {
        return BaseObject.__objects.get(id)
    }

    static removeAll = () => {
        BaseObject.__objects.forEach(o => {
            o.remove()
        })
    }

    static restoreAll = () => {
        BaseObject.__objects.forEach(o => {
            o.restore()
        })
    }

    static removeCssTipAll = () => {
        BaseObject.__objects.forEach(o => {
            o.removeCssTip()
        })
    }

    static restoreCssTipAll = () => {
        BaseObject.__objects.forEach(o => {
            o.restoreCssTip()
        })
    }

    constructor(d = new BaseObjectData) {

        const that = this

        // 
        this.mesh = new THREE.Mesh()
        this.mesh.frustumCulled = false
        this.mesh.onBeforeRender = () => {
            that.onMeshBeforeRender()
        }

        // 
        this.world = World.getInstance()
        this.cesium = this.world.cesium
        this.three = this.world.three
        this.currentViewerSceneMode = null

        // 
        this.__data = d

        this.init(d)

        BaseObject.__objects.set(d.id, this)

    }

    init(d) {

        let group = this.mesh;

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
        if (d.cssTip) {

            this.addCssTip(group)

        }

    }

    onMeshBeforeRender() {

        // 切换 scene.mode 时执行一次
        if (this.currentViewerSceneMode !== this.cesium.viewer.scene.mode) {
            this.dq()
            this.currentViewerSceneMode = this.cesium.viewer.scene.mode
        }

        // 
        if (this.__data.fixedSize) {

            let factor = this.__data.size

            let mode = this.cesium.viewer.scene.mode
            if (mode === Cesium.SceneMode.SCENE3D) {
                // 
            } else if (mode === Cesium.SceneMode.COLUMBUS_VIEW) {
                factor *= 0.015
            }

            let mesh = this.mesh
            // 计算 object 到 camera 平面的距离，可用，准确
            let camera = this.cesium.viewer.camera
            let cameraPlane = Cesium.Plane.fromPointNormal(camera.position, camera.directionWC)
            let pos = new Cesium.Cartesian3(mesh.position.x, mesh.position.y, mesh.position.z)
            let distance = Cesium.Plane.getPointDistance(cameraPlane, pos)
            let scale = distance * factor;
            mesh.scale.set(scale, scale, scale);
        }

    }

    addCssTip() {

        // 
        const tipWrapper = document.createElement('div')
        tipWrapper.textContent = ''
        tipWrapper.style = `
pointer-events: none;
height: 0;
width: 0;
`
        // 
        const tipBody = document.createElement('div')
        tipBody.textContent = this.__data.id
        tipBody.style = `
pointer-events: auto;
position: absolute;
left: 50px;
bottom: 50px;
height: 30px;
width: 60px;
border: solid red 1px;
cursor: pointer;
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
        if (!this.tip) {
            this.tip = {}
        }
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
            anchor: ["Center"],
            connector: ["Straight"],
        });

        source.conn = conn

    }

    removeCssTip() {
        this.mesh.remove(this.tip.tipObject)
    }

    restoreCssTip() {
        this.mesh.add(this.tip.tipObject)
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

    restore() {
        BaseObject.__rootGroup.add(this.mesh)
        this.restoreCssTip()
    }
    remove() {
        BaseObject.__rootGroup.remove(this.mesh)
        this.removeCssTip()
    }

}

export { BaseObject, BaseObjectData }