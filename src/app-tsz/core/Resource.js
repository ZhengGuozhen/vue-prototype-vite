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
    static deleteInstance() {
        if (Resource.instance) {
            console.warn('delete Resource Instance')
            Resource.instance = null
        }
    }

    constructor() {

        this.texture = {
        }

        this.material = {
            meshBasicMaterial: new THREE.MeshBasicMaterial(),
            meshNormalMaterial: new THREE.MeshNormalMaterial()
        }

        const plane = new THREE.PlaneBufferGeometry(1, 1)
        plane.rotateX(- Math.PI / 2)

        this.geometry = {
            plane: plane,
            cone: new THREE.ConeBufferGeometry(1, 2, 16)
        }

    }

    getGeometry(key) {
        if (this.geometry[key]) {
            return this.geometry[key]
        } else {
            return this.geometry['plane']
        }
    }

    getMaterial(key) {
        if (this.material[key]) {
            return this.material[key]
        } else {
            return this.material['meshBasicMaterial']
        }
    }

    getMaterialTexture(url) {
        if (!this.texture[url]) {
            console.warn('new Texture', url)
            this.texture[url] = new THREE.TextureLoader().load(url)
        }

        if (!this.material[url]) {
            console.warn('new Material', url)
            this.material[url] = new THREE.MeshBasicMaterial({ map: this.texture[url] })
        }

        return this.material[url]
    }

}

export default Resource