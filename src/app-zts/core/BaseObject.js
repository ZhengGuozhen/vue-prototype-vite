import * as THREE from 'three/build/three.module.js'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { jsPlumb } from 'jsplumb'
import { v4 as uuid } from 'uuid'

import * as Cesium from 'cesium'
import World from './World.js'

class BaseObjectData {
    constructor(d) {
        this.config = {
            fixedSize: true,
            size: 1,
            cssTip: true
        }

        this.id = uuid()
        this.position = [114, 30, 0]

        Object.assign(this, d)
    }
}

class BaseObject extends THREE.Mesh {

    constructor(d = new BaseObjectData) {

        super()

        // 
        this.frustumCulled = false

        this.__world = World.getInstance()
        this.__cesium = this.__world.cesium
        this.__three = this.__world.three
        this.__currentViewerSceneMode = null

        this.__data = d

        this.__init(d)

        BaseObject.objects.set(d.id, this)

    }

    static rootGroup = new THREE.Group()
    static objects = new Map()
    static __removeCssTipAll = function () {
        BaseObject.objects.forEach(o => {
            o.remove(o.__tip.tipObject)
        })
    }
    static __restoreCssTipAll = function () {
        BaseObject.objects.forEach(o => {
            o.add(o.__tip.tipObject)
        })
    }
    static __resizeAll = function () {
        World.getInstance().resizeObjects(BaseObject.rootGroup)
    }

    onBeforeRender() {
        if (this.__currentViewerSceneMode !== this.__cesium.viewer.scene.mode) {
            console.log('dq')
            this.__dq()
            this.__currentViewerSceneMode = this.__cesium.viewer.scene.mode
        }
    }

    __init(d) {

        let group = this;

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
        if (d.config.cssTip) {

            this.__addCssTip(group)

            this.__tip.tipObject.onAfterRender = () => {

                if (!this.__tip.tipBody.__conn) {

                    this.__addCssTipConn()

                    this.__tip.tipObject.onAfterRender = () => { }

                }

            }

        }

    }

    __addCssTip() {

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
        this.add(tipObject)

        // 
        tipBody.addEventListener('contextmenu', (e) => {
            console.error(e)
            e.preventDefault()
        })

        // 
        if (!this.__tip) {
            this.__tip = {}
        }
        this.__tip.tipWrapper = tipWrapper
        this.__tip.tipBody = tipBody
        this.__tip.tipObject = tipObject

    }

    __addCssTipConn() {

        // 需要 render 一下，或者 document.body.appendChild(tipWrapper) 后面才能 plumbIns.connect
        // document.body.appendChild(this.__tip.tipWrapper)
        // this.__world.renderThree()

        let source = this.__tip.tipBody
        let target = this.__tip.tipWrapper

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

    __removeCssTip() {
        this.remove(this.__tip.tipObject)
    }

    __restoreCssTip() {
        this.add(this.__tip.tipObject)
    }

    __dq() {

        let o = this
        let pos = this.__data.position

        let mode = this.__cesium.viewer.scene.mode

        if (mode === Cesium.SceneMode.SCENE3D) {

            let pos_ = Cesium.Cartesian3.fromDegrees(...pos);

            o.position.set(pos_.x, pos_.y, pos_.z)
            o.up.set(0, 0, -6378137)
            o.lookAt(new THREE.Vector3(0, 0, 0));
            o.rotateX(-Math.PI / 2)

        } else if (mode === Cesium.SceneMode.COLUMBUS_VIEW) {

            let p = this.__cesium.viewer.scene.mapProjection.project(
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

    __resize() {
        this.__world.resizeObjects(this)
    }

    __restore() {
        BaseObject.rootGroup.add(this)
        this.__restoreCssTip()
    }
    __remove() {
        BaseObject.rootGroup.remove(this)
        this.__removeCssTip()
    }




    // test code, to delete
    // ======================================
    addTestObjects() {

        // Cesium entity
        let defaultPosition = [114.43, 30.41, 100000]
        const entity = {
            name: 'Polygon',
            polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray([
                    defaultPosition[0] - 1, defaultPosition[1] - 1,
                    defaultPosition[0] + 1, defaultPosition[1] - 1,
                    defaultPosition[0] + 1, defaultPosition[1] + 1,
                    defaultPosition[0] - 1, defaultPosition[1] + 1,
                ]),
                material: Cesium.Color.RED.withAlpha(0.2)
            }
        };
        this.__cesium.viewer.entities.add(entity);

        // 地心坐标轴
        this.__three.scene.add(new THREE.AxesHelper(1e7));

        // 添加一个 object
        let o = this.addThreeObject({
            position: [114, 30, 0]
        })
        this.__world.renderThree()
        this.addThreeObjectTipConn(o)

        // 添加多个 object
        console.time('新建object')
        for (let i = 0; i < 10; i++) {
            let o = this.addThreeObject({
                position: [114 + i / 5, 30, 0]
            })
            this.demoObjects.push(o)
        }
        this.__world.renderThree()
        for (let o of this.demoObjects) {
            this.addThreeObjectTipConn(o)
        }
        console.timeEnd('新建object')

        this.__world.resizeObjects()
        this.__world.timerRender()

    }

    addThreeObject(data) {

        let group = new THREE.Group();
        this.__three.scene.add(group);

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

    dqObject(o, pos) {
        let mode = this.__cesium.viewer.scene.mode

        if (mode === Cesium.SceneMode.SCENE3D) {

            let pos_ = Cesium.Cartesian3.fromDegrees(...pos);

            o.position.set(pos_.x, pos_.y, pos_.z)
            o.up.set(0, 0, -6378137)
            o.lookAt(new THREE.Vector3(0, 0, 0));
            o.rotateX(-Math.PI / 2)

        } else if (mode === Cesium.SceneMode.COLUMBUS_VIEW) {

            let p = this.__cesium.viewer.scene.mapProjection.project(
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
    // ======================================

}

export { BaseObject, BaseObjectData }