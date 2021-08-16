import World from '../core/World.js'
import Resource from '../core/Resource.js'
import { BaseObjectData, BaseObject, BaseObjectHub } from '../core/BaseObject.js'
import { TrackObject } from '../modules/TrackObject.js'
import { EventObject } from '../modules/EventObject.js'

class Demo {

    constructor(el) {

        this.world = World.getInstance()
        this.world.init(el)

        this.BaseObjectHub = new BaseObjectHub()
        this.TrackObjectHub = new BaseObjectHub()
        this.EventObjectHub = new BaseObjectHub()


        console.time('批量创建object')
        for (let i = 0; i < 5; i++) {
            let o = new BaseObject(new BaseObjectData({
                id: 'BaseObject-' + i,
                position: [114 + i / 10, 30, 0]
            }))
            this.BaseObjectHub.addObject(o)
        }
        console.timeEnd('批量创建object')

        console.time('批量创建object')
        for (let i = 0; i < 5; i++) {
            let o = new TrackObject(new BaseObjectData({
                id: 'TrackObject-' + i,
                position: [114 + i / 10, 20, 0]
            }))
            this.TrackObjectHub.addObject(o)
        }
        console.timeEnd('批量创建object')

        console.time('批量创建object')
        for (let i = 0; i < 5; i++) {
            let o = new EventObject(new BaseObjectData({
                id: 'EventObject-' + i,
                position: [114 + i / 10, 10, 0]
            }))
            this.EventObjectHub.addObject(o)
        }
        console.timeEnd('批量创建object')


        this.world.timerRender(3000)

    }

    dispose() {
        World.deleteInstance()
        Resource.deleteInstance()
    }

}

export default Demo