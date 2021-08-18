import * as THREE from 'three/build/three.module.js'
import { BaseObject, BaseObjectData } from '../core/BaseObject.js'

class TrackObject extends BaseObject {

    constructor(d = new BaseObjectData) {

        super(d)

        // let a = new THREE.Mesh(
        //     this.resource.getGeometry('cone'),
        //     this.resource.getMaterial('meshNormalMaterial')
        // );
        // a.scale.set(1, 1, 1);
        // this.mesh.add(a)

    }

}

export { TrackObject }