import World from '../core/World.js'
import { BaseObject, BaseObjectData } from '../core/BaseObject.js'

class Demo {

    constructor(el) {

        this.world = World.getInstance()
        this.world.init(el)
        this.world.three.scene.add(BaseObject.rootGroup)

        this.BaseObject = BaseObject

        console.time('批量创建object')
        for (let i = 0; i < 10; i++) {
            let o = new BaseObject(new BaseObjectData({
                id: 'id-' + i,
                position: [114 + i / 10, 30, 0]
            }))
            BaseObject.rootGroup.add(o)
        }
        console.timeEnd('批量创建object')

        BaseObject.__resizeAll()
        this.world.timerRender()

        // test
        setTimeout(() => {
            this.world.timerRender()
        }, 5000)

    }

}

export default Demo