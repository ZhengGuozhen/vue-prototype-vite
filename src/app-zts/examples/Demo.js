import World from '../core/World.js'
import { BaseObject, BaseObjectData } from '../core/BaseObject.js'

class Demo {

    constructor(el) {

        this.world = World.getInstance()
        this.world.init(el)
        BaseObject.setEnable(true)

        this.BaseObject = BaseObject

        console.time('批量创建object')
        for (let i = 0; i < 500; i++) {
            let o = new BaseObject(new BaseObjectData({
                id: 'id-' + i,
                position: [114 + i / 10, 30, 0]
            }))
            o.restore()
        }
        console.timeEnd('批量创建object')

        this.world.timerRender()

    }

}

export default Demo