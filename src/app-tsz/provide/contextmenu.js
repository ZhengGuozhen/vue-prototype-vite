export const contextMenuCommon = {
    show: false,
    position: {},
    intersectObject: null,
    options: [],
}
export const optionsWorld = [
    {
        label: '3D/2D',
        action: (o) => {
            o.world.changeView()
        },
    },
    {
        label: '移除所有Tip',
        action: (o) => {
            o.baseObjectHub.removeCssTipAll()
        },
    },
    {
        label: '恢复所有Tip',
        action: (o) => {
            o.baseObjectHub.restoreCssTipAll()
        },
    },
    {
        label: '移除所有BaseObject',
        action: (o) => {
            o.baseObjectHub.removeAll()
        },
    },
    {
        label: '恢复所有Object',
        action: (o) => {
            o.baseObjectHub.restoreAll()
        },
    },
    {
        label: '播放test',
        action: (o) => {
            setInterval(() => {
                o.baseObjectHub.updateObjects()
                o.world.timerRender(100)
            }, 500)
        },
    }
]
export const optionsBaseObject = [
    {
        label: 'Tip显隐',
        action: (o) => {
            if (o.tip) {
                o.toggleCssTip(true)
            }
        },
    },
    {
        label: '移除',
        action: (o) => {
            o.remove(true)
        },
    },
    {
        label: '更新test',
        action: (o) => {
            o.update(
                {
                    longitude: 114,
                    latitude: 29,
                    altitude: 0,
                    course: 30,
                },
                true,
            )
            o.update2(
                {
                    longitude: 114,
                    latitude: 29,
                    altitude: 0,
                    course: 30,
                },
                true,
            )
        },
    },
]
