import World from '../core/World.js'
import Resource from '../core/Resource.js'
import { BaseObjectData, BaseObject, BaseObjectHub } from '../core/BaseObject.js'
import { TrackObjectHub } from '../modules/TrackObject.js'

class Demo {

    constructor(el) {

        this.world = World.getInstance()
        this.world.init(el)

        this.baseObjectHub = new BaseObjectHub()
        this.trackObjectHub = new TrackObjectHub()

        this.baseObjectHub.createObjects(5)

        this.world.timerRender(3000)



    }

    dispose() {
        World.deleteInstance()
        Resource.deleteInstance()
    }

}

export default Demo