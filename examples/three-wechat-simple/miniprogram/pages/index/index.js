import getBehavior from './behavior'
import yuvBehavior from './yuvBehavior'

const NEAR = 0.001
const FAR = 1000

Component({
    behaviors: [getBehavior(), yuvBehavior],
    data: {
        theme: 'light',
        
    },
    lifetimes: {
        /**
        * 生命周期函数--监听页面加载
        */
        detached() {
            console.log("页面detached")
            if (wx.offThemeChange) {
                wx.offThemeChange()
            }
        },
        ready() {
            console.log("页面准备完全")
            this.setData({
                theme: wx.getSystemInfoSync().theme || 'light'
            })

            if (wx.onThemeChange) {
                wx.onThemeChange(({ theme }) => {
                    this.setData({ theme })
                })
            }

        },
    },
    methods: {
        init() {
            this.initGL()
        },
        render(frame) {
            this.renderGL(frame)

            const camera = frame.camera

            // 修改光标位置
            const reticle = this.viewer.modelReticle
            if (reticle) {
                const hitTestRes = this.session.hitTest(0.5, 0.5)
                if (hitTestRes.length) {
                    reticle.matrixAutoUpdate = false
                    reticle.matrix.fromArray(hitTestRes[0].transform)
                    reticle.matrix.decompose(reticle.position, reticle.quaternion, reticle.scale)
                    reticle.visible = true
                } else {
                    reticle.visible = false
                }
            }

            // 相机
            if (camera) {
                this.viewer.camera.matrixAutoUpdate = false
                this.viewer.camera.matrixWorldInverse.fromArray(camera.viewMatrix);
                this.viewer.camera.matrixWorld.copy(this.viewer.camera.matrixWorldInverse).invert();

                const projectionMatrix = camera.getProjectionMatrix(NEAR, FAR)
                this.viewer.camera.projectionMatrix.fromArray(projectionMatrix);
                this.viewer.camera.projectionMatrixInverse.copy(this.viewer.camera.projectionMatrix).invert();
            }
        },
    },
})