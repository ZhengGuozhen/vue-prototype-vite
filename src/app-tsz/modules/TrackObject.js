import * as THREE from 'three/build/three.module.js'
import { BaseObject, BaseObjectData } from '../core/BaseObject.js'

class TrackObject extends BaseObject {

    constructor(d = new BaseObjectData) {

        super(d)

        let geometry = new THREE.ConeBufferGeometry(1, 2, 32)
        let material = new THREE.MeshNormalMaterial()
        let a = new THREE.Mesh(geometry, material);
        a.scale.set(1, 1, 1);
        this.mesh.add(a)
        
    }

}

export { TrackObject }