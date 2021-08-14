import * as THREE from 'three/build/three.module.js'

class Resource {

    static instance = null
    static getInstance() {
        if (!Resource.instance) {
            console.warn('new Resource Instance')
            Resource.instance = new Resource()
        }
        return Resource.instance
    }

    constructor() {

        this.texture = {
            国旗: new THREE.TextureLoader().load('/image/flag_cn.png')
        }

        this.material = {
            国旗: new THREE.MeshBasicMaterial({ map: this.texture.国旗 })
        }

        const plane = new THREE.PlaneBufferGeometry(1, 1)
        plane.rotateX(- Math.PI / 2)
        this.geometry = {
            plane: plane
        }

    }

    getGeometry(id) {
        if (this.geometry[id]) {
            return this.geometry[id]
        } else {
            return this.geometry['plane']
        }
    }

    getMaterial(id) {
        if (this.material[id]) {
            return this.material[id]
        } else {
            return this.material['国旗']
        }
    }

}

export default Resource