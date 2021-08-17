

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


// camera 相关计算
// ======================================

// 计算 object 相对于 camera 的 position
// 由于直接修改了 cemare 的矩阵，camera.position 不正确，此法不可用
let v = new THREE.Vector3();
let distanceToCamera = v.subVectors(o.position, this.three.camera.position).length()

// 计算 object 相对于 camera 的 position，可用，较慢
let m = new THREE.Matrix4()
m.multiplyMatrices(this.three.camera.matrixWorldInverse, o.matrixWorld);
let position = new THREE.Vector3();
position.setFromMatrixPosition(m)
let distanceToCamera = position.length()
let scale = distanceToCamera * factor;
o.scale.set(scale, scale, scale);

// 计算 object 相对于 camera 的 position，可用，较快
let cameraPos = this.cesium.viewer.camera.position
let cameraPos_ = new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z)
let v = new THREE.Vector3();
let distanceToCamera = v.subVectors(
    o.position, cameraPos_).length()
let scale = distanceToCamera * factor;
o.scale.set(scale, scale, scale);

// 计算 object 到 camera 平面的距离，可用，准确
const size = o.__rootParent.__data.size
let camera = this.cesium.viewer.camera
let cameraPlane = Cesium.Plane.fromPointNormal(camera.position, camera.directionWC)
let pos = new Cesium.Cartesian3(o.position.x, o.position.y, o.position.z)
let distance = Cesium.Plane.getPointDistance(cameraPlane, pos)
let scale = distance * size;
o.scale.set(scale, scale, scale);

// 计算 cemera 相对地表的高度，可用，快速，但是旋转视角后结果错误
let scale = cameraHeight * factor;
o.scale.set(scale, scale, scale);

// ======================================
