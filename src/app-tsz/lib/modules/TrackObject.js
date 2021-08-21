import * as THREE from 'three/build/three.module.js'
import { BaseObjectData, BaseObject, BaseObjectHub } from '../core/BaseObject.js'

class TrackObjectData extends BaseObjectData {

    constructor(d = new BaseObjectData) {

        super(d)

    }

}

class TrackObject extends BaseObject {

    constructor(d = new TrackObjectData) {

        super(d)

        // let a = new THREE.Mesh(
        //     this.resource.getGeometry('cone'),
        //     this.resource.getMaterial('meshNormalMaterial')
        // );
        // a.scale.set(1, 1, 1);
        // this.mesh.add(a)

    }

}

class TrackObjectHub extends BaseObjectHub {

    constructor(name = 'TrackObjectHub') {

        super(name)

    }

}

export { TrackObjectData, TrackObject, TrackObjectHub }